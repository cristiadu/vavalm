import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import yaml from 'yaml'
import { RegisterRoutes } from '@/routes/generated/routes'
import fs from 'fs'
import path from 'path'
import setupTestData from '@/bootstrap/Bootstrap'
import db from '@/models/db'
import dotenv from 'dotenv'
import SchedulerService from '@/services/SchedulerService'
import rateLimit from 'express-rate-limit'
import { ErrorApiModel } from '@/models/contract/ErrorApiModel'
import { errorHandler } from '@/middleware/errorHandler'

const app = express()
const port = Number(process.env.PORT ?? 8000)
const host = process.env.HOST || '0.0.0.0'

dotenv.config()

app.use(bodyParser.json())
app.use(cors())

// Apply rate limiting to all requests
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX ?? 1000), // Configurable via env var; default 1000 per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: express.Request, res: express.Response): void => {
      const error = new ErrorApiModel(
        429,
        'Too many requests from this IP, please try again later',
        'RATE_LIMIT_EXCEEDED',
        {
          retryAfter: String(res.getHeader('Retry-After') || '900'),
        },
      )
      res.status(429).json(error)
    },
  }),
)

// Add request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const sanitizedUrl = req.originalUrl.replace(/\n|\r/g, "")
    console.info(`${req.method} ${sanitizedUrl} ${res.statusCode} ${duration}ms`)
  })
  
  next()
})

// Register routes using TSOA's RegisterRoutes function
RegisterRoutes(app)

// Add error handler middleware
app.use(errorHandler)

// Serve swagger docs
const openApiYamlDoc = fs.readFileSync(path.join(__dirname, '../docs/openapi.yaml'), 'utf8')

// Convert YAML to JSON
const openApiJsonDoc = yaml.parse(openApiYamlDoc)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiJsonDoc, {
  explorer: true,
  customCssUrl: 'https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css',
  customJs: [
    'https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js',
    'https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js',
  ],
}))

// Serve swagger.yaml for tools that need it
app.get('/swagger.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../docs/openapi.yaml'))
})

/** Stop scheduler workers and close database connections on process shutdown. */
const gracefulShutdown = async (): Promise<void> => {
  console.info('Received shutdown signal, closing connections...')

  // Stop scheduler
  SchedulerService.cleanupWorkers()

  try {
    await db.sequelize.close()
    console.info('Database connections closed')
  } catch (error) {
    console.error('Error closing database connections:', error)
  }
}

// Listen for shutdown signals
process.on('SIGTERM', () => void gracefulShutdown())
process.on('SIGINT', () => void gracefulShutdown())

/** Initialize database state and start the HTTP server. */
const initializeApp = async (): Promise<void> => {
  try {
    const forceSync = process.env.FORCE_SYNC === 'true'
    
    await db.initializeDatabase()
    
    // Sync database schema
    await db.sequelize.sync({ force: forceSync })
    console.info('Database schema synchronized.')

    // Setup test data
    await setupTestData()
    console.info('Test data has been created successfully.')
    
    // Start the server
    app.listen(port, host, () => {
      console.info(`Server is running on ${host}:${port}`)
      const shouldStartScheduler = process.env.START_SCHEDULER != 'false'
      console.info('shouldStartScheduler', shouldStartScheduler)
      if (shouldStartScheduler) {
        console.info('Starting match scheduler...')
        SchedulerService.startScheduler()
      }
    })
  } catch (error) {
    console.error('Failed to initialize application:', error)
    throw error
  }
}

void initializeApp()

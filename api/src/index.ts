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
const port = process.env.PORT || 8000

dotenv.config()

app.use(bodyParser.json())
app.use(cors())

// Apply rate limiting to all requests
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
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
    console.log(`${req.method} ${sanitizedUrl} ${res.statusCode} ${duration}ms`)
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

// Graceful shutdown
const gracefulShutdown = (): void => {
  console.log('Received shutdown signal, closing connections...')
  
  // Stop scheduler
  SchedulerService.cleanupWorkers()
  
  // Close database connection
  db.sequelize.close()
    .then(() => {
      console.log('Database connections closed')
      throw new Error('Database connection issues detected. Pausing background workers.')
    })
    .catch((err: Error) => {
      console.error('Error closing database connections:', err)
      throw new Error('Database connection issues detected. Pausing background workers.')
    })
    
  // Force exit after timeout if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    throw new Error('Database connection issues detected. Pausing background workers.')
  }, 10000)
}

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

const initializeApp = async (): Promise<void> => {  
  try {
    const forceSync = process.env.FORCE_SYNC === 'true'
    
    await db.initializeDatabase()
    
    // Sync database schema
    await db.sequelize.sync({ force: forceSync })
    console.log('Database schema synchronized.')
    
    // Setup test data
    await setupTestData()
    console.log('Test data has been created successfully.')
    
    // Start the server
    app.listen(port, () => {
      console.info(`Server is running on port ${port}`)
      const shouldStartScheduler = process.env.START_SCHEDULER != 'false'
      console.log('shouldStartScheduler', shouldStartScheduler)
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

initializeApp()

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import yaml from 'yaml'
import { RegisterRoutes } from './routes/routes'
import fs from 'fs'
import path from 'path'
import setupTestData from './bootstrap/Bootstrap'
import db from './models/db'
import dotenv from 'dotenv'
import SchedulerService from '@/services/SchedulerService'

const app = express()
const port = process.env.PORT || 8000

dotenv.config()

// Database connection health tracking
let dbConnectionHealthy = true
const DB_HEALTH_CHECK_INTERVAL = 30000 // 30 seconds

app.use(bodyParser.json())
app.use(cors())

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

// Add database connection check middleware
app.use((req, _res, next) => {
  // Skip health check endpoint to avoid recursion
  if (req.path === '/health') {
    return next()
  }
  
  // If database is known to be unhealthy, pause worker processing
  if (!dbConnectionHealthy) {
    SchedulerService.pauseWorker()
  }
  
  next()
})

// Add health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await db.sequelize.authenticate()
    
    // If we get here, the database is healthy
    if (!dbConnectionHealthy) {
      console.log('Database connection restored. Resuming background workers.')
      dbConnectionHealthy = true
      SchedulerService.resumeWorker()
    }
    
    res.status(200).json({ 
      status: 'ok',
      database: dbConnectionHealthy ? 'connected' : 'issues detected',
      workers: SchedulerService.getWorkerStatus(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    dbConnectionHealthy = false
    
    res.status(503).json({
      status: 'degraded',
      database: 'connection issues',
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

// Register routes using TSOA's RegisterRoutes function
RegisterRoutes(app)


// Serve swagger docs
const openApiYamlDoc = fs.readFileSync(path.join(__dirname, '../docs/api/openapi.yaml'), 'utf8')

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
  res.sendFile(path.join(__dirname, '../docs/api/openapi.yaml'))
})

// Periodic database health checks
setInterval(async () => {
  try {
    await db.sequelize.authenticate()
    
    if (!dbConnectionHealthy) {
      console.log('Database connection restored. Resuming background workers.')
      dbConnectionHealthy = true
      SchedulerService.resumeWorker()
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    
    if (dbConnectionHealthy) {
      console.error('Database connection issues detected. Pausing background workers.')
      dbConnectionHealthy = false
      SchedulerService.pauseWorker()
    }
  }
}, DB_HEALTH_CHECK_INTERVAL)

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

// Initialize database and start server
const initializeApp = async (): Promise<void> => {  
  try {
    const forceSync = process.env.FORCE_SYNC === 'true'
    
    // Initialize database connection
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

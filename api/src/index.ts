import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import setupTestData from './bootstrap/Bootstrap'
import db from './models/db'

import SchedulerService from '@/services/SchedulerService'

import TeamsController from '@/controllers/TeamsController'
import PlayersController from '@/controllers/PlayersController'
import TournamentController from '@/controllers/TournamentController'
import MatchController from '@/controllers/MatchController'
import GameController from '@/controllers/GameController'
import VlrImportController from '@/controllers/VlrImportController'

const app = express()
const port = process.env.PORT || 8000

// Database connection health tracking
let dbConnectionHealthy = true
let consecutiveDbErrors = 0
const DB_ERROR_THRESHOLD = 3
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
app.use((req, res, next) => {
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

// Add timeout middleware for API requests
app.use((req, res, next) => {
  // Set a 30 second timeout for all requests
  req.setTimeout(30000, () => {
    res.status(503).json({ error: 'Request timeout' })
  })
  next()
})

// Add error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err)
  
  // Check if it's a database error
  if (err.name && (
    err.name.includes('Sequelize') || 
    err.name.includes('ConnectionError') ||
    err.name.includes('TimeoutError') ||
    err.message?.includes('too many clients')
  )) {
    // Track database errors
    dbConnectionHealthy = false
    consecutiveDbErrors++
    
    if (consecutiveDbErrors >= DB_ERROR_THRESHOLD) {
      console.error('Database connection issues detected. Pausing background workers.')
      SchedulerService.pauseWorker()
    }
  }
  
  res.status(500).json({ error: 'Internal server error' })
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
      consecutiveDbErrors = 0
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

// Routes
app.use('/teams', TeamsController)
app.use('/players', PlayersController)
app.use('/tournaments', TournamentController)
app.use('/games', GameController)
app.use('/matches', MatchController)
app.use('/import', VlrImportController)

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  
  // Check if it's a database-related error
  if (error.message && (
    error.message.includes('database') ||
    error.message.includes('connection') ||
    error.message.includes('sequelize') ||
    error.message.includes('too many clients')
  )) {
    dbConnectionHealthy = false
    SchedulerService.pauseWorker()
  }
  
  // Let the process exit if in development, but keep running in production
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Database connection issues detected. Pausing background workers.')
  }
})

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Promise Rejection:', reason)
  
  // Check if it's a database-related error
  if (reason instanceof Error && reason.message && (
    reason.message.includes('database') ||
    reason.message.includes('connection') ||
    reason.message.includes('sequelize') ||
    reason.message.includes('too many clients')
  )) {
    dbConnectionHealthy = false
    SchedulerService.pauseWorker()
  }
})

// Periodic database health checks
setInterval(async () => {
  try {
    await db.sequelize.authenticate()
    
    if (!dbConnectionHealthy) {
      console.log('Database connection restored. Resuming background workers.')
      dbConnectionHealthy = true
      consecutiveDbErrors = 0
      SchedulerService.resumeWorker()
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    
    if (dbConnectionHealthy) {
      console.error('Database connection issues detected. Pausing background workers.')
      dbConnectionHealthy = false
      consecutiveDbErrors++
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

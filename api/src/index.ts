import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import setupTestData from './bootstrap/Bootstrap'
import db from './models/db'

import SchedulerService  from './services/SchedulerService'

import TeamsController from './controllers/TeamsController'
import PlayersController from './controllers/PlayersController'
import TournamentController from './controllers/TournamentController'
import MatchController from './controllers/MatchController'
import GameController from './controllers/GameController'
import VlrImportController from './controllers/VlrImportController'

const app = express()
const port = process.env.PORT || 8000

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

// Add error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
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
  // Let the process exit if in development, but keep running in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason)
})

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing connections...')
  
  // Stop scheduler
  SchedulerService.cleanupWorkers?.()
  
  // Close database connection
  db.sequelize.close()
    .then(() => {
      console.log('Database connections closed')
      process.exit(0)
    })
    .catch((err: Error) => {
      console.error('Error closing database connections:', err)
      process.exit(1)
    })
    
  // Force exit after timeout if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Initialize database and start server
const initializeApp = async () => {  
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
    process.exit(1)
  }
}

initializeApp()

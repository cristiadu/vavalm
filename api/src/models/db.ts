import { Sequelize, Dialect } from 'sequelize'
import config from '@/config/config.json'

type Environment = 'development' | 'test' | 'production'
const env = (process.env.NODE_ENV || 'development') as Environment
const dbConfig = config[env]

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect as Dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
      evict: dbConfig.pool.evict,
    },
    logging: false,
  },
)

// Add connection validation with retries
const validateConnection = async (attempts = 3): Promise<void> => {
  for (let i = 0; i < attempts; i++) {
    try {
      await sequelize.authenticate()
      console.log('Database connection established successfully.')
      return
    } catch (error) {
      console.error(`Unable to connect to the database (attempt ${i + 1}/${attempts}):`, error)
      if (i < attempts - 1) {
        const delay = Math.pow(1.5, i) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}

// Add connection pool monitoring
const monitorPool = () => {
  setInterval(async () => {
    const pool = sequelize.connectionManager
    try {
      const connection = await pool.getConnection({ type: 'read' })
      console.log('Pool status - Connection available')
      // @ts-ignore - release method exists on the connection object
      connection.release()
    } catch (error) {
      console.log('Pool status - No connection available')
    }
  }, 60000) // Log every minute
}

// Initialize connection and monitoring
const initializeDatabase = async () => {
  try {
    await validateConnection()
    monitorPool()
  } catch (error) {
    console.error('Failed to initialize database connection:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async () => {
  try {
    await sequelize.close()
    console.log('Database connection closed.')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Handle process termination
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const db = {
  sequelize,
  Sequelize,
  initializeDatabase,
}

export default db

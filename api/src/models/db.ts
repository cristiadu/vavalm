import { Sequelize, Dialect } from 'sequelize'
import { isMainThread } from 'worker_threads'
import pg from 'pg'
import config from '@/config/config.json'
import { MATCH_WORKER_POOL_MAX } from '@/models/constants'

type Environment = 'development' | 'test' | 'production'
type DatabaseDialectOptions = {
  ssl?: {
    require: boolean
    rejectUnauthorized: boolean
  }
}
const env = (process.env.NODE_ENV || 'development') as Environment
const dbConfig = config[env]

/**
 * Connection pool bounds for the thread this module was loaded in.
 *
 * Worker threads get their own module instance, so they each build their own
 * pool. The main thread serves every request and keeps the configured size; a
 * match worker plays one match and takes a small pool with no idle minimum, so
 * the total stays well inside the database's connection limit.
 *
 * @param onMainThread - Whether this is the main thread rather than a worker.
 * @returns The max and min connections this thread should hold.
 */
export const resolvePoolBounds = (onMainThread: boolean): { max: number, min: number } => {
  if (onMainThread) {
    return { max: dbConfig.pool.max, min: dbConfig.pool.min }
  }

  return { max: Math.min(MATCH_WORKER_POOL_MAX, dbConfig.pool.max), min: 0 }
}

/**
 * Resolve verified TLS for remote databases or plaintext for the loopback desktop database.
 *
 * @param databaseSsl - Raw DATABASE_SSL environment value.
 * @returns Sequelize dialect options for the requested transport security.
 */
export const resolveDatabaseDialectOptions = (databaseSsl: string | undefined): DatabaseDialectOptions => {
  if (databaseSsl === 'false') {
    return {}
  }

  return { ssl: { require: true, rejectUnauthorized: true } }
}

const poolBounds = resolvePoolBounds(isMainThread)

const poolOptions = {
  max: poolBounds.max,
  min: poolBounds.min,
  acquire: dbConfig.pool.acquire,
  idle: dbConfig.pool.idle,
  evict: dbConfig.pool.evict,
}

/**
 * Managed Postgres providers hand out a single connection string rather than
 * discrete credentials, so a deployed environment sets DATABASE_URL and the
 * config.json entry for its NODE_ENV is ignored. Local development, the docker
 * compose stack and the test suite leave it unset and keep using config.json.
 *
 * TLS verification stays on: hosted providers present certificates from public
 * CAs. A provider with a private CA needs its certificate supplied here, not
 * rejectUnauthorized turned off.
 *
 * An sslmode in the connection string overrides the ssl options below, so the
 * URL must not carry `sslmode=require` — pg currently aliases it to verify-full
 * but is migrating it to libpq semantics, which encrypt without verifying. Omit
 * sslmode and let this apply, or set `sslmode=verify-full` explicitly.
 */
const databaseUrl = process.env.DATABASE_URL
const databaseDialectOptions = resolveDatabaseDialectOptions(process.env.DATABASE_SSL)

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    pool: poolOptions,
    dialectOptions: databaseDialectOptions,
    logging: false,
  })
  : new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect as Dialect,
      dialectModule: pg,
      pool: poolOptions,
      logging: false,
    },
  )

/**
 * Validate the database connection with bounded exponential-backoff retries.
 *
 * @param attempts - Maximum number of authentication attempts.
 */
const validateConnection = async (attempts = 3): Promise<void> => {
  for (let i = 0; i < attempts; i++) {
    try {
      await sequelize.authenticate()
      console.info('Database connection established successfully.')
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

/** Report whether a connection can be borrowed from the Sequelize pool. */
const monitorPool = (): void => {
  setInterval(async () => {
    const pool = sequelize.connectionManager
    try {
      const connection = await pool.getConnection({ type: 'read' })
      console.info('Pool status - Connection available')
      pool.releaseConnection(connection)
    } catch {
      console.info('Pool status - No connection available')
    }
  }, 60000) // Log every minute
}

/** Validate the initial database connection and start pool monitoring. */
const initializeDatabase = async (): Promise<void> => {
  try {
    await validateConnection()
    monitorPool()
  } catch (error) {
    console.error('Failed to initialize database connection:', error)
    throw error
  }
}

/** Close the Sequelize connection during process shutdown. */
const shutdown = async (): Promise<void> => {
  try {
    await sequelize.close()
    console.info('Database connection closed.')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Handle process termination
process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())

const db = {
  sequelize,
  Sequelize,
  initializeDatabase,
}

export default db

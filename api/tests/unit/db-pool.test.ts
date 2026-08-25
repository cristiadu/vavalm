import { describe, expect, it } from 'vitest'
import { resolveDatabaseDialectOptions, resolvePoolBounds } from '@/models/db'
import { MATCH_WORKER_POOL_MAX, MAX_CONCURRENT_MATCHES } from '@/models/constants'
import config from '@/config/config.json'

/** Postgres ships with this many connection slots by default. */
const DEFAULT_POSTGRES_MAX_CONNECTIONS = 100

describe('Database connection pool sizing', () => {
  const configured = config.production.pool

  it('gives the main thread the configured pool', () => {
    const bounds = resolvePoolBounds(true)

    expect(bounds.max).toBe(configured.max)
    expect(bounds.min).toBe(configured.min)
  })

  it('gives a match worker a small pool', () => {
    const bounds = resolvePoolBounds(false)

    expect(bounds.max).toBe(MATCH_WORKER_POOL_MAX)
    expect(bounds.max).toBeLessThan(configured.max)
  })

  it('holds no idle connections open in a match worker', () => {
    // Workers come and go with matches, so an idle minimum in each of them is
    // just connections parked away from the thread serving requests.
    expect(resolvePoolBounds(false).min).toBe(0)
  })

  it('never asks a worker for more than the configured maximum', () => {
    expect(resolvePoolBounds(false).max).toBeLessThanOrEqual(configured.max)
  })

  it('keeps every thread combined inside the default postgres limit', () => {
    // One main thread plus MAX_CONCURRENT_MATCHES workers, each with its own
    // Sequelize instance and therefore its own pool.
    const worstCase = resolvePoolBounds(true).max + MAX_CONCURRENT_MATCHES * resolvePoolBounds(false).max

    expect(worstCase).toBeLessThan(DEFAULT_POSTGRES_MAX_CONNECTIONS)
  })
})

describe('Database transport security', () => {
  it('keeps verified TLS enabled by default', () => {
    // GIVEN no desktop-specific database override
    const databaseSsl = undefined

    // WHEN database dialect options are resolved
    const dialectOptions = resolveDatabaseDialectOptions(databaseSsl)

    // THEN certificate verification remains required
    expect(dialectOptions).toEqual({
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    })
  })

  it('disables TLS only for the embedded loopback database', () => {
    // GIVEN the explicit desktop database override
    const databaseSsl = 'false'

    // WHEN database dialect options are resolved
    const dialectOptions = resolveDatabaseDialectOptions(databaseSsl)

    // THEN Sequelize receives no TLS options
    expect(dialectOptions).toEqual({})
  })
})

import jwt from 'jsonwebtoken'

/**
 * Generates a valid JWT signed with the same secret the server uses.
 * JWT_SECRET is read from the environment (loaded from .env by setup.ts).
 */
export const createTestToken = (): string => {
  const jwtSecret = process.env.JWT_SECRET || 'my-secret-key'
  return jwt.sign({ scopes: ['admin'] }, jwtSecret, { algorithm: 'HS256' })
}

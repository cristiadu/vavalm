import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import path from 'path'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { VavalMApi } from '@tests/generated/api'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Set default timeout for all tests
vi.setConfig({ testTimeout: 30000 })

// Generate a valid JWT signed with the same secret the server uses
const jwtSecret = process.env.JWT_SECRET || 'my-secret-key'
const testToken = jwt.sign({ scopes: ['admin'] }, jwtSecret, { algorithm: 'HS256' })

// Create an API client for tests
export const apiClient = new VavalMApi({
  BASE: process.env.API_BASE_URL || 'http://localhost:8000/api',
  TOKEN: testToken,
})

// Setup before all tests
beforeAll(async () => {
  // Global setup code if needed
  console.log('Test setup complete')
})

// Reset any mocks before each test
beforeEach(() => {
  // Reset any mocks or test state
})

// Cleanup after all tests
afterAll(async () => {
  // Any cleanup needed
  console.log('Test cleanup complete')
}) 
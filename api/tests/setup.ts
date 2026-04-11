import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import path from 'path'
import dotenv from 'dotenv'
import { VavalMApi } from '@tests/generated/api'
import { createTestToken } from '@tests/api/common-auth'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Set default timeout for all tests
vi.setConfig({ testTimeout: 30000 })

// Create an API client for tests
export const apiClient = new VavalMApi({
  BASE: process.env.API_BASE_URL || 'http://localhost:8000/api',
  TOKEN: createTestToken(),
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
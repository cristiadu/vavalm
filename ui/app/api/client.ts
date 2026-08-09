import { VavalMApi } from "@/api/generated/VavalMApi"

// Create an API client for tests
export const VavalMApiClient = new VavalMApi({
  BASE: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  // For tests, we can add a dummy token or set up JWT as needed
  TOKEN: process.env.TEST_API_TOKEN || 'test-token',
})

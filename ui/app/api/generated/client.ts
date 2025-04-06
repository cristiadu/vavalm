import { VavalMApi } from "./VavalMApi"

// Define API base URL. The default URL in the generated client is incorrect.
// Backend runs on port 8000 by default with API path prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'

// Create client with correct configuration
export const VavalMClient = new VavalMApi({
  BASE: API_BASE_URL,
})
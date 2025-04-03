export const LIMIT_PER_PAGE_INITIAL_VALUE: number = 10
export const PAGE_OFFSET_INITIAL_VALUE: number = 0
export const MAXIMUM_PAGE_SIZE: number = 100
export const CACHE_DURATION_MS: number = 60000 // 1 minute

export const getApiBaseUrl = (): string => {
  return process.env.API_BASE_URL || 'http://localhost:8000/api'
}

// Amount of time to wait for API responses before timing out
export const API_TIMEOUT_MS: number = 8000 // 8 seconds

export const LIMIT_PER_PAGE_INITIAL_VALUE: number = 10
export const PAGE_OFFSET_INITIAL_VALUE: number = 0

export const getApiBaseUrl = () => {
  return process.env.API_BASE_URL || 'https://localhost:8000'
}


export const LIMIT_PER_PAGE_INITIAL_VALUE: number = 10
export const PAGE_OFFSET_INITIAL_VALUE: number = 0

export const getApiBaseUrl = () => {
    console.log('process.env.API_BASE_URL', process.env.API_BASE_URL)
    return  process.env.API_BASE_URL || 'http://localddfsfhost:4000'
}

// Worker configuration
export const MAX_CONCURRENT_MATCHES = 10
export const MAX_CONCURRENT_WORKERS = 4

// Scheduler configuration
export const STANDARD_CHECK_INTERVAL = 60000 // 1 minute between checks
export const REDUCED_CHECK_INTERVAL = 120000 // 2 minutes when under stress
export const CIRCUIT_BREAKER_THRESHOLD = 5 // Number of consecutive errors before circuit breaks
export const CIRCUIT_BREAKER_RESET_TIME = 60000 // 1 minute until circuit resets 
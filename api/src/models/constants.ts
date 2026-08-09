// Worker configuration
export const MAX_CONCURRENT_MATCHES = 20

// A match worker plays one match at a time, so it needs a couple of
// connections rather than a full request-serving pool. Every worker thread
// gets its own Sequelize instance, so the configured pool size would otherwise
// be multiplied by MAX_CONCURRENT_MATCHES against the database's connection
// limit — 20 workers at 20 connections each is 400, well past postgres's
// default max_connections of 100.
export const MATCH_WORKER_POOL_MAX = 2

// Scheduler configuration
export const STANDARD_CHECK_INTERVAL = 60000 // 1 minute between checks
export const REDUCED_CHECK_INTERVAL = 120000 // 2 minutes when under stress
export const CIRCUIT_BREAKER_THRESHOLD = 5 // Number of consecutive errors before circuit breaks
export const CIRCUIT_BREAKER_RESET_TIME = 60000 // 1 minute until circuit resets

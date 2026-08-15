// Worker configuration
// Each concurrent match is a worker thread with its own Sequelize pool, so this
// is the knob that decides how much memory and CPU the scheduler can claim.
// Configurable because a small deployment target (a 512 MB container) cannot
// hold 20 simultaneous match workers.
export const MAX_CONCURRENT_MATCHES = Number(process.env.MAX_CONCURRENT_MATCHES ?? 20)

// A match worker plays one match at a time, so it needs a couple of
// connections rather than a full request-serving pool. Every worker thread
// gets its own Sequelize instance, so the configured pool size would otherwise
// be multiplied by MAX_CONCURRENT_MATCHES against the database's connection
// limit — 20 workers at 20 connections each is 400, well past postgres's
// default max_connections of 100.
export const MATCH_WORKER_POOL_MAX = 2

// Scheduler configuration
// How often the scheduler looks for matches that are due. Configurable because
// tests otherwise spend a whole polling cycle waiting for the first tick — the
// behaviour under test is "due matches get picked up, future ones do not",
// which holds at any cadence.
export const STANDARD_CHECK_INTERVAL = Number(process.env.SCHEDULER_CHECK_INTERVAL ?? 60000)

// Backs off to twice the normal interval once errors appear.
export const REDUCED_CHECK_INTERVAL = STANDARD_CHECK_INTERVAL * 2
export const CIRCUIT_BREAKER_THRESHOLD = 5 // Number of consecutive errors before circuit breaks
export const CIRCUIT_BREAKER_RESET_TIME = 60000 // 1 minute until circuit resets

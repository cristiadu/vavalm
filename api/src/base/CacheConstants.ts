/**
 * Shared cache TTL values (in seconds) and cache key constants.
 * All services and controllers should import from here — never use inline string literals.
 */
export const CACHE_TTL = {
  GAME: 60,        // 1 minute
  GAME_STATS: 120, // 2 minutes
  ALL_STATS: 30,   // 30 seconds — short-lived; expires quickly enough that explicit invalidation is unnecessary
}

export const CACHE_KEYS = {
  ALL_PLAYER_STATS: 'allPlayerStats',
  ALL_TEAM_STATS: 'allTeamStats',
}

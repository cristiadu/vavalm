/**
 * Shared cache TTL values (in seconds) and cache key constants.
 * All services and controllers should import from here — never use inline string literals.
 */
export const CACHE_TTL = {
  GAME: 60,        // 1 minute
  GAME_STATS: 120, // 2 minutes
  ALL_STATS: 300,  // 5 minutes — model hooks drop these keys whenever a row behind them changes, so the ttl is only a backstop
}

export const CACHE_KEYS = {
  ALL_PLAYER_STATS: 'allPlayerStats',
  ALL_TEAM_STATS: 'allTeamStats',
}

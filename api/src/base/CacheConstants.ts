/**
 * Shared cache TTL values (in seconds).
 * All services and controllers should import from here — never use inline string literals.
 */
export const CACHE_TTL = {
  GAME: 60,        // 1 minute
  GAME_STATS: 120, // 2 minutes
}

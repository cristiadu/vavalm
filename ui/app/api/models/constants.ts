export const LIMIT_PER_PAGE_INITIAL_VALUE: number = 10
export const PAGE_OFFSET_INITIAL_VALUE: number = 0
export const MAXIMUM_PAGE_SIZE: number = 100
export const CACHE_DURATION_MS: number = 60000 // 1 minute

/**
 * URL of a team's logo image.
 *
 * Logos are served as bytes from their own cacheable endpoint rather than
 * inlined as base64 into every response that embeds a team.
 *
 * @param teamId - The team whose logo is wanted.
 * @returns An absolute URL an img tag can load.
 */
export const teamLogoUrl = (teamId: number): string => `${getApiBaseUrl()}/teams/${teamId}/logo`

/**
 * Get the base URL of the API
 * @returns The base URL of the API
 */
export const getApiBaseUrl = (): string => {
  return process.env.API_BASE_URL || 'http://localhost:8000/api'
}

/**
 * The amount of time to wait for API responses before timing out
 * @returns The amount of time to wait for API responses before timing out
 */
export const API_TIMEOUT_MS: number = 8000 // 8 seconds

/**
 * The default logo image path for a team
 * @returns The default logo image path for a team
 */
export const DEFAULT_TEAM_LOGO_IMAGE_PATH: string = '/images/nologo.svg'

/**
 * The multiplier for the assists of a duel
 * @returns The multiplier for the assists of a duel
 */
export const ASSISTS_HALF_MULTIPLIER: number = 0.5

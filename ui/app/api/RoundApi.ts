import { GameLogApiModel, RoundStateApiModel } from "@/api/generated"
import { GameLogWithPlayers } from "@/api/models/types"
import { VavalMApiClient } from "@/api/client"

// Simple cache implementation to store round data
const roundCache = new Map<string, { data: GameLogWithPlayers[], timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export const playFullRound = async (game_id: number, round: number): Promise<RoundStateApiModel | null> => {
  try {
    return await VavalMApiClient.default.playRound(game_id, round)
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export const getLastRound = async (game_id: number): Promise<GameLogWithPlayers[] | null> => {
  try {
    const cacheKey = `last_${game_id}`
    const cachedData = roundCache.get(cacheKey)

    // Return cached data if available and not expired
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return cachedData.data
    }

    const response = await VavalMApiClient.default.getLastRound(game_id)
    const data = response.map((log: GameLogApiModel) => ({
      ...log,
      player1: log.team1_player,
      player2: log.team2_player,
    } as GameLogWithPlayers))

    roundCache.set(cacheKey, { data: data, timestamp: Date.now() })
    return data
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

/**
 * Clear cached round data for a specific game.
 * Should be called after play actions to ensure fresh data on next fetch.
 * @param gameId - The game ID whose cache entries should be cleared
 */
export const clearRoundCacheForGame = (gameId: number): void => {
  for (const key of roundCache.keys()) {
    if (key.startsWith(`round_${gameId}_`) || key === `last_${gameId}`) {
      roundCache.delete(key)
    }
  }
}

export const getRound = async (game_id: number, round: number): Promise<GameLogWithPlayers[] | null> => {
  try {
    const cacheKey = `round_${game_id}_${round}`
    const cachedData = roundCache.get(cacheKey)

    // Return cached data if available and not expired
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return cachedData.data
    }

    const response = await VavalMApiClient.default.getRound(game_id, round)
    const data = response.map((log: GameLogApiModel) => ({
      ...log,
      player1: log.team1_player,
      player2: log.team2_player,
    } as GameLogWithPlayers))

    // Cache the response
    roundCache.set(cacheKey, { data: data, timestamp: Date.now() })

    return data
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Fetch aborted due to timeout')
    } else {
      console.error('Error:', error)
    }
    return null
  }
}

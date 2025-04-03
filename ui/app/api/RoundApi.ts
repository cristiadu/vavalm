import { GameLog, RoundState } from "./models/Tournament"
import { getApiBaseUrl } from "./models/constants"

// Simple cache implementation to store round data
const roundCache = new Map<string, { data: GameLog[], timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export const playFullRound = async (game_id: number, round: number, closure: (_roundState: RoundState) => void): Promise<RoundState | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/rounds/${round}/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", response)
      return null
    }

    const data = await response.json()
    closure(data as RoundState)
    
    // Clear cache for this game since data has changed
    clearCacheForGame(game_id)
    
    return data as RoundState
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const getLastRound = async (game_id: number, closure: (_lastRoundLogs: GameLog[]) => void): Promise<GameLog[] | null> => {
  try {
    const cacheKey = `last_${game_id}`
    const cachedData = roundCache.get(cacheKey)
    
    // Return cached data if available and not expired
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      closure(cachedData.data)
      return cachedData.data as GameLog[]
    }
    
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/rounds/last`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", response)
      return null
    }

    const data = await response.json()
    
    // Cache the response
    roundCache.set(cacheKey, { data: data as GameLog[], timestamp: Date.now() })
    
    closure(data as GameLog[])
    return data as GameLog[]
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Fetch aborted due to timeout')
    } else {
      console.error('Error:', error)
    }
    return null
  }
}

export const getRound = async (game_id: number, round: number, closure: (_roundLogs: GameLog[]) => void): Promise<GameLog[] | null> => {
  try {
    const cacheKey = `round_${game_id}_${round}`
    const cachedData = roundCache.get(cacheKey)
    
    // Return cached data if available and not expired
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      closure(cachedData.data)
      return cachedData.data as GameLog[]
    }
    
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/rounds/${round}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error("Network response was not ok: ", response)
      return null
    }

    const responseData = await response.json()
    const data = Array.isArray(responseData) ? responseData : responseData.data || []
    
    // Cache the response
    roundCache.set(cacheKey, { data: data as GameLog[], timestamp: Date.now() })
    
    closure(data as GameLog[])
    return data as GameLog[]
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Fetch aborted due to timeout')
    } else {
      console.error('Error:', error)
    }
    return null
  }
}

// Helper function to clear cache entries for a specific game
function clearCacheForGame(game_id: number): void {
  // Clear all cache entries related to this game
  for (const key of roundCache.keys()) {
    if (key.includes(`_${game_id}_`)) {
      roundCache.delete(key)
    }
  }
}

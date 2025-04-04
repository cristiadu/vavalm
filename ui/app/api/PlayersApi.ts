import { getApiBaseUrl, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { AllPlayerStats, Player } from "@/api/models/Player"
import { ItemsWithPagination } from "@/api/models/types"

// Cache for API responses to reduce network requests
const playerCache: Record<string, { data: object, timestamp: number }> = {}
const CACHE_TTL = 60000 // 1 minute cache TTL

// Helper function to get/set cached data
const withCache = async <T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
): Promise<T> => {
  const now = Date.now()
  const cachedItem = playerCache[cacheKey]
  
  // Return cached data if it exists and is not expired
  if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
    return cachedItem.data as T
  }
  
  // Fetch fresh data
  const data = await fetchFn()
  
  // Cache the new data
  playerCache[cacheKey] = { data: data as object, timestamp: now }
  
  return data
}

export const fetchPlayersStats = async (
  closure: (_playerData: ItemsWithPagination<AllPlayerStats>) => void, 
  limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, 
  offset: number = PAGE_OFFSET_INITIAL_VALUE,
): Promise<ItemsWithPagination<AllPlayerStats>> => {
  const cacheKey = `playersStats:${limit}:${offset}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await fetch(`${getApiBaseUrl()}/players/stats?limit=${limit}&offset=${offset}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch players stats: ${response.status}`)
      }
      
      return await response.json()
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error('Error fetching players stats:', error)
    // Return empty result on error
    const emptyResult = { items: [], total: 0 } as ItemsWithPagination<AllPlayerStats>
    closure(emptyResult)
    return emptyResult
  }
}

export const fetchPlayersByTeam = async (
  teamId: number, 
  closure: (_playerData: Player[]) => void,
): Promise<Player[]> => {
  const cacheKey = `playersByTeam:${teamId}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}/players`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch players by team: ${response.status}`)
      }
      
      return await response.json()
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error(`Error fetching players for team ${teamId}:`, error)
    closure([])
    return []
  }
}

export const fetchPlayers = async (
  closure: (_playerData: ItemsWithPagination<Player>) => void, 
  limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, 
  offset: number = PAGE_OFFSET_INITIAL_VALUE,
): Promise<ItemsWithPagination<Player>> => {
  const cacheKey = `players:${limit}:${offset}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await fetch(`${getApiBaseUrl()}/players?limit=${limit}&offset=${offset}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`)
      }
      
      return await response.json()
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error('Error fetching players:', error)
    const emptyResult = { items: [], total: 0 } as ItemsWithPagination<Player>
    closure(emptyResult)
    return emptyResult
  }
}

export const fetchPlayer = async (
  playerId: number, 
  closure: (_playerData: Player) => void,
): Promise<Player> => {
  const cacheKey = `player:${playerId}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await fetch(`${getApiBaseUrl()}/players/${playerId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player ${playerId}: ${response.status}`)
      }
      
      return await response.json()
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error)
    // Return a fallback or show an error
    throw error
  }
}

export const fetchPlayerStats = async (
  playerId: number, 
  closure: (_playerData: AllPlayerStats) => void,
): Promise<AllPlayerStats> => {
  const cacheKey = `playerStats:${playerId}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await fetch(`${getApiBaseUrl()}/players/${playerId}/stats`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player stats ${playerId}: ${response.status}`)
      }
      
      return await response.json()
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error)
    throw error
  }
}

// Invalidate cache when modifying data
const invalidatePlayerCache = (): void => {
  Object.keys(playerCache).forEach(key => {
    if (key.startsWith('player') || key.startsWith('team')) {
      delete playerCache[key]
    }
  })
}

export const newPlayer = async (player: Player, closure: (_playerData: Player) => void): Promise<Player | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(player),
    })
  
    if (!response.ok) {
      console.error("Network response was not ok: ", player)
      return null
    }
  
    const result = await response.json()
    invalidatePlayerCache() // Clear cache after modifications
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const editPlayer = async (player: Player, closure: (_playerData: Player) => void): Promise<Player | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/players/${player.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(player),
    })
  
    if (!response.ok) {
      console.error("Network response was not ok: ", player)
      return null
    }
  
    const result = await response.json()
    invalidatePlayerCache() // Clear cache after modifications
    closure(result)
    console.debug('Success:', result)
    return result as Player
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const deletePlayer = async (player: Player, closure: (_result: {message: string}) => void): Promise<{message: string} | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/players/${player.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(player),
    })
  
    if (!response.ok) {
      console.error("Network response was not ok: ", player)
      return null
    }
  
    const result = await response.json()
    invalidatePlayerCache() // Clear cache after modifications
    closure(result)
    console.debug('Success:', result)
    return result as {message: string}
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

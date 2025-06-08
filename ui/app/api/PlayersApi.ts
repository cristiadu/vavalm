import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { AllPlayerStats, ItemsWithPagination_AllPlayerStats_, ItemsWithPagination_PlayerApiModel_, PlayerApiModel } from "@/api/generated"
import { VavalMApiClient } from "@/api/client"

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

// Invalidate cache when modifying data
const invalidatePlayerCache = (): void => {
  Object.keys(playerCache).forEach(key => {
    if (key.startsWith('player') || key.startsWith('team')) {
      delete playerCache[key]
    }
  })
}

export const fetchPlayersStats = async (
  closure: (_playerData: ItemsWithPagination_AllPlayerStats_) => void, 
  limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, 
  offset: number = PAGE_OFFSET_INITIAL_VALUE,
): Promise<ItemsWithPagination_AllPlayerStats_> => {
  const cacheKey = `playersStats:${limit}:${offset}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await VavalMApiClient.default.getPlayersStats(limit, offset)
      return response
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error('Error fetching players stats:', error)
    // Return empty result on error
    const emptyResult = { items: [], total: 0 } as ItemsWithPagination_AllPlayerStats_
    closure(emptyResult)
    return emptyResult
  }
}

export const fetchPlayersByTeam = async (
  teamId: number, 
  closure: (_playerData: PlayerApiModel[]) => void,
): Promise<PlayerApiModel[]> => {
  const cacheKey = `playersByTeam:${teamId}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await VavalMApiClient.default.getTeamPlayers(teamId)
      return response
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
  closure: (_playerData: ItemsWithPagination_PlayerApiModel_) => void, 
  limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, 
  offset: number = PAGE_OFFSET_INITIAL_VALUE,
): Promise<ItemsWithPagination_PlayerApiModel_> => {
  const cacheKey = `players:${limit}:${offset}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await VavalMApiClient.default.getPlayers(undefined, limit, offset)
      return response
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error('Error fetching players:', error)
    const emptyResult = { items: [], total: 0 } as ItemsWithPagination_PlayerApiModel_
    closure(emptyResult)
    return emptyResult
  }
}

export const fetchPlayer = async (
  playerId: number, 
  closure: (_playerData: PlayerApiModel) => void,
): Promise<PlayerApiModel> => {
  const cacheKey = `player:${playerId}`
  
  try {
    const data = await withCache(cacheKey, async () => {
      const response = await VavalMApiClient.default.getPlayer(playerId)
      return response
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
      const response = await VavalMApiClient.default.getPlayerStats(playerId)
      return response
    })
    
    closure(data)
    return data
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error)
    throw error
  }
}

export const newPlayer = async (player: PlayerApiModel, closure: (_playerData: PlayerApiModel) => void): Promise<PlayerApiModel | null> => {
  try {
    const response = await VavalMApiClient.default.createPlayer(player)
    invalidatePlayerCache() // Clear cache after modifications
    closure(response)
    console.debug('Success:', response)
    return response
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const editPlayer = async (player: PlayerApiModel, closure: (_playerData: PlayerApiModel) => void): Promise<PlayerApiModel | null> => {
  try {
    if (!player.id) {
      throw new Error('Player ID is required')
    }

    const response = await VavalMApiClient.default.updatePlayer(player.id, player)
    invalidatePlayerCache() // Clear cache after modifications
    closure(response)
    console.debug('Success:', response)
    return response
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const deletePlayer = async (player: PlayerApiModel, closure: () => void): Promise<void> => {
  try {
    if (!player.id) {
      throw new Error('Player ID is required')
    }

    await VavalMApiClient.default.deletePlayer(player.id)
    invalidatePlayerCache() // Clear cache after modifications
    closure()
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

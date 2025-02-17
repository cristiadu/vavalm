import { getApiBaseUrl, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"
import { AllPlayerStats, Player } from "./models/Player"
import { ItemsWithPagination } from "./models/types"

export const fetchPlayersStats = async (closure: (playerData: ItemsWithPagination<AllPlayerStats>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`${getApiBaseUrl()}/players/stats?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  closure(data)
  return data
}

export const fetchPlayersByTeam = async (teamId: number, closure: (playerData: Player[]) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}/players`)
  const data = await response.json()
  closure(data)
  return data
}

export const fetchPlayers = async (closure: (playerData: ItemsWithPagination<Player>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`${getApiBaseUrl()}/players?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  closure(data)
  return data
}

export const fetchPlayer = async (playerId: number, closure: (playerData: Player) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/players/${playerId}`)
  const data = await response.json()
  closure(data)
  return data
}

export const fetchPlayerStats = async (playerId: number, closure: (playerData: AllPlayerStats) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/players/${playerId}/stats`)
  const data = await response.json()
  closure(data)
  return data
}

export const newPlayer = async (player: Player, closure: (playerData: Player) => void) => {
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
      return
    }
  
    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}

export const editPlayer = async (player: Player, closure: (playerData: Player) => void) => {
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
      return
    }
  
    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}

export const deletePlayer = async (player: Player, closure: ({message}: {message: string}) => void) => {
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
      return
    }
  
    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}

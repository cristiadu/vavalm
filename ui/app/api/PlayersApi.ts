import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"
import { AllPlayerStats, Player } from "./models/Player"
import { ItemsWithPagination } from "./models/types"

export const fetchPlayersStats = async (closure: (playerData: ItemsWithPagination<AllPlayerStats>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`http://localhost:8000/players/stats?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  closure(data as ItemsWithPagination<AllPlayerStats>)
  return data as ItemsWithPagination<AllPlayerStats>
}

export const fetchPlayersByTeam = async (teamId: number, closure: (playerData: Player[]) => void) => {
  const response = await fetch(`http://localhost:8000/teams/${teamId}/players`)
  const data = await response.json()
  closure(data)
  return data as Player[]
}

export const fetchPlayers = async (closure: (playerData: ItemsWithPagination<Player>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`http://localhost:8000/players?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  closure(data as ItemsWithPagination<Player>)
  return data as ItemsWithPagination<Player>
}

export const fetchPlayer = async (playerId: number, closure: (playerData: Player) => void) => {
  const response = await fetch(`http://localhost:8000/players/${playerId}`)
  const data = await response.json()
  closure(data)
  return data as Player
}

export const fetchPlayerStats = async (playerId: number, closure: (playerData: AllPlayerStats) => void) => {
  const response = await fetch(`http://localhost:8000/players/${playerId}/stats`)
  const data = await response.json()
  closure(data as AllPlayerStats)
  return data as AllPlayerStats
}

export const newPlayer = async (player: Player, closure: (playerData: Player) => void) => {
  try {
    const response = await fetch('http://localhost:8000/players', {
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
    return result as Player
  } catch (error) {
    console.error('Error:', error)
  }
}

export const editPlayer = async (player: Player, closure: (playerData: Player) => void) => {
  try {
    const response = await fetch(`http://localhost:8000/players/${player.id}`, {
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
    return result as Player
  } catch (error) {
    console.error('Error:', error)
  }
}

export const deletePlayer = async (player: Player, closure: ({message}: {message: string}) => void) => {
  try {
    const response = await fetch(`http://localhost:8000/players/${player.id}`, {
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

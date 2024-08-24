import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"
import { Player } from "./models/Player"
import { ItemsWithPagination } from "./models/types"

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

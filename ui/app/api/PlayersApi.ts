import { Player } from "./models/Player"

const PlayersApi = {
  fetchPlayersByTeam: async (teamId: number, closure: (playerData: Player[]) => void) => {
    const response = await fetch(`http://localhost:8000/teams/${teamId}/players`)
    const data = await response.json()
    closure(data)
    return data as Player[]
  },
  fetchPlayers: async (closure: (playerData: Player[]) => void) => {
    const response = await fetch('http://localhost:8000/players')
    const data = await response.json()
    closure(data)
    return data as Player[]
  },
  fetchPlayer: async (playerId: number, closure: (playerData: Player) => void) => {
    const response = await fetch(`http://localhost:8000/players/${playerId}`)
    const data = await response.json()
    closure(data)
    return data as Player
  },
  newPlayer: async (player: Player, closure: (playerData: Player) => void) => {
    try {
      const response = await fetch('http://localhost:8000/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
      })
  
      if (!response.ok) {
        console.log("Network response was not ok: ", player)
        return
      }
  
      const result = await response.json()
      closure(result)
      console.log('Success:', result)
      return result as Player
    } catch (error) {
      console.error('Error:', error)
    }
  },
  editPlayer: async (player: Player, closure: (playerData: Player) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/players/${player.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
      })
  
      if (!response.ok) {
        console.log("Network response was not ok: ", player)
        return
      }
  
      const result = await response.json()
      closure(result)
      console.log('Success:', result)
      return result as Player
    } catch (error) {
      console.error('Error:', error)
    }
  },
  deletePlayer: async (player: Player, closure: ({message}: {message: string}) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/players/${player.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
      })
  
      if (!response.ok) {
        console.log("Network response was not ok: ", player)
        return
      }
  
      const result = await response.json()
      closure(result)
      console.log('Success:', result)
      return result
    } catch (error) {
      console.error('Error:', error)
    }
  },
}
  
export default PlayersApi

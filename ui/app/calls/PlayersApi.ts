export interface PlayerAttributes {
  clutch: number,
  awareness: number,
  aim: number,
  positioning: number,
  game_reading: number,
  resilience: number,
  confidence: number,
  strategy: number,
  adaptability: number,
  communication: number,
  unpredictability: number,
  game_sense: number,
  decision_making: number,
  rage_fuel: number,
  teamwork: number,
  utility_usage: number
}

export interface Player {
    id?: number
    nickname: string
    full_name: string
    age: number
    country: string
    team_id: number
    player_attributes: PlayerAttributes
}
  
const PlayersApi = {
  fetchPlayers: async (closure: (playerData: Player[]) => void) => {
    const response = await fetch('http://localhost:8000/players')
    const data = await response.json()
    closure(data)
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
    } catch (error) {
      console.error('Error:', error)
    }
  },
  deletePlayer: async (player: Player, closure: (playerData: Player) => void) => {
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
    } catch (error) {
      console.error('Error:', error)
    }
  },
}
  
export default PlayersApi

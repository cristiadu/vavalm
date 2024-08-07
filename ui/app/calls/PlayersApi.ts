export enum PlayerRole {
  Initiator = 'Initiator',
  Duelist = 'Duelist',
  Controller = 'Controller',
  Sentinel = 'Sentinel',
  Flex = 'Flex',
  IGL = 'IGL',
}

export const getRoleBgColor = (role: PlayerRole): string => {
  const tailwindStyle = "p-1 rounded text-white ml-2 "
  switch (role) {
  case PlayerRole.Initiator:
    return tailwindStyle + 'bg-blue-400'
  case PlayerRole.Duelist:
    return tailwindStyle + 'bg-red-700'
  case PlayerRole.Controller:
    return tailwindStyle + 'bg-green-700'
  case PlayerRole.Sentinel:
    return tailwindStyle + 'bg-purple-700'
  case PlayerRole.Flex:
    return tailwindStyle + 'bg-yellow-600'
  case PlayerRole.IGL:
    return tailwindStyle + 'bg-orange-500'
  default:
    return tailwindStyle + 'bg-gray-700'
  }
}

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
    role: PlayerRole
    player_attributes: PlayerAttributes
}

export interface PlayerWithFlag extends Player {
  countryFlag?: string | null;
}

  
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
      return result
    } catch (error) {
      console.error('Error:', error)
    }
  },
}
  
export default PlayersApi

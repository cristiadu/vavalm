import { getApiBaseUrl } from "./models/constants"
import { GameLog, RoundState } from "./models/Tournament"

export const playSingleDuel = async (game_id: number, round: number, closure: (roundState: RoundState) => void) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/rounds/${round}/duel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }
    
    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export const getLastDuel = async (game_id: number, closure: (lastDuelLog: GameLog) => void) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/rounds/last/duel`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }
    
    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

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
      console.error("Network response was not ok: ", response)
      return
    }
    
    const data = await response.json()
    closure(data as RoundState)
    console.debug('Success:', data)
    return data as RoundState
  } catch (error) {
    console.error('Error:', error)
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
      console.error("Network response was not ok: ", response)
      return
    }
    
    const data = await response.json()
    closure(data as GameLog)
    console.debug('Success:', data)
    return data as GameLog
  } catch (error) {
    console.error('Error:', error)
  }
}

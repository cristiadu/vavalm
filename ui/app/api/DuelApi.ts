import { getApiBaseUrl } from "./models/constants"
import { GameLog, RoundState } from "./models/Tournament"

export const playSingleDuel = async (game_id: number, round: number, closure: (_roundState: RoundState) => void): Promise<void> => {
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

export const getLastDuel = async (
  game_id: number, 
  closure: (_lastDuelLog: GameLog) => void,
  options?: { signal?: AbortSignal },
): Promise<GameLog | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/rounds/last/duel`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: options?.signal,
    })
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }
    
    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    // Don't log aborted requests as errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Fetch aborted')
      return null
    }
    console.error('Error:', error)
    throw error
  }
}

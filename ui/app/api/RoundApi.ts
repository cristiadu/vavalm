import { get } from "http"
import { GameLog, RoundState } from "./models/Tournament"
import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"

const RoundApi = {
  playFullRound: async (game_id: number, round: number, closure: (roundState: RoundState) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/games/${game_id}/rounds/${round}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", response)
        return
      }

      const data = await response.json()
      closure(data as RoundState)
      console.log('Success:', data)
      return data as RoundState
    } catch (error) {
      console.error('Error:', error)
    }
  },
  getLastRound: async (game_id: number, closure: (lastRoundLogs: GameLog[]) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
    try {
      const response = await fetch(`http://localhost:8000/games/${game_id}/rounds/last?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", response)
        return
      }

      const data = await response.json()
      closure(data as GameLog[])
      console.log('Success:', data)
      return data as GameLog[]
    } catch (error) {
      console.error('Error:', error)
    }
  },
  getRound: async (game_id: number, round: number, closure: (roundLogs: GameLog[]) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
    try {
      const response = await fetch(`http://localhost:8000/games/${game_id}/rounds/${round}?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", response)
        return
      }

      const data = await response.json()
      closure(data as GameLog[])
      console.log('Success:', data)
      return data as GameLog[]
    } catch (error) {
      console.error('Error:', error)
    }
  },
}

export default RoundApi

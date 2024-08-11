import { RoundState } from "./models/Tournament"

const GameApi = {
  playFullGame: async (game_id: string, closure: (response: { message: string }) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/games/${game_id}/play`, {
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
      closure(data as { message: string })
      console.log('Success:', data)
      return data as { message: string }
    } catch (error) {
      console.error('Error:', error)
    }
  },
  playFullRound: async (game_id: string, round: number, closure: (roundState: RoundState) => void) => {
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
  playSingleDuel: async (game_id: string, round: number, closure: (roundState: RoundState) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/games/${game_id}/rounds/${round}/duel`, {
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
}

export default GameApi

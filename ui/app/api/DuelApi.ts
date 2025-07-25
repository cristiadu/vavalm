import { GameLogApiModel, RoundStateApiModel } from "@/api/generated"
import { VavalMApiClient } from "@/api/client"

export const playSingleDuel = async (game_id: number, round: number, closure: (_roundState: RoundStateApiModel) => void): Promise<RoundStateApiModel> => {
  try {
    const response = await VavalMApiClient.default.playDuel(game_id, round)
    closure(response)
    return response
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export const getLastDuel = async (
  game_id: number, 
  closure: (_lastDuelLog: GameLogApiModel | null) => void,
): Promise<GameLogApiModel | null> => {
  try {
    const response = await VavalMApiClient.default.getLastDuel(game_id)
    closure(response)
    return response
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

import { ApiError, GameLogApiModel, RoundStateApiModel } from "@/api/generated"
import { VavalMApiClient } from "@/api/client"

export const playSingleDuel = async (game_id: number, round: number): Promise<RoundStateApiModel> => {
  try {
    return await VavalMApiClient.default.playDuel(game_id, round)
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export const getLastDuel = async (game_id: number): Promise<GameLogApiModel | null> => {
  try {
    return await VavalMApiClient.default.getLastDuel(game_id)
  } catch (error) {
    // 404 is expected when no duels have been played yet
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    console.error('Error:', error)
    throw error
  }
}

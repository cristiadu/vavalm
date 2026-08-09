import { GameApiModel, GameStatsApiModel, MatchApiModel } from "@/api/generated"
import { VavalMApiClient } from "@/api/client"

export const playFullGame = async (game_id: number): Promise<void> => {
  try {
    return await VavalMApiClient.default.playGame(game_id)
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getMatch = async (match_id: number): Promise<MatchApiModel | null> => {
  try {
    const response = await VavalMApiClient.default.getMatch(match_id)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getGame = async (game_id: number): Promise<GameApiModel | null> => {
  try {
    return await VavalMApiClient.default.getGame(game_id)
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getGameStats = async (game_id: number): Promise<GameStatsApiModel | null> => {
  try {
    const response = await VavalMApiClient.default.getGameStats(game_id)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

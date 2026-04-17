import { parseLogoImageFile } from "@/api/models/helpers"
import { TeamWithLogoImageData } from "@/api/models/types"
import { GameApiModel, GameStatsApiModel, MatchApiModel, TeamApiModel } from "@/api/generated"
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
    response.team1 = parseLogoImageFile<TeamApiModel>(response.team1 as TeamWithLogoImageData)
    response.team2 = parseLogoImageFile<TeamApiModel>(response.team2 as TeamWithLogoImageData)
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
    response.team1 = parseLogoImageFile<TeamApiModel>(response.team1 as TeamWithLogoImageData)
    response.team2 = parseLogoImageFile<TeamApiModel>(response.team2 as TeamWithLogoImageData)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

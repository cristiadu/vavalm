import { parseLogoImageFile } from "@/api/models/helpers"
import { TeamWithLogoImageData } from "@/api/models/types"
import { GameApiModel, GameStatsApiModel, MatchApiModel, TeamApiModel } from "@/api/generated"
import { VavalMClient } from "@/api/generated/client"
export const playFullGame = async (
  game_id: number,
  closure: (_response: { message: string }) => void,
): Promise<void> => {
  try {
    const response = await VavalMClient.default.playGame(game_id)
    closure(response)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getMatch = async (match_id: number, closure: (_response: MatchApiModel) => void): Promise<MatchApiModel | null> => {
  try {
    const response = await VavalMClient.default.getMatch(match_id)
    response.team1 = parseLogoImageFile<TeamApiModel>(response.team1 as TeamWithLogoImageData)
    response.team2 = parseLogoImageFile<TeamApiModel>(response.team2 as TeamWithLogoImageData)
    closure(response)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getGame = async (
  game_id: number,
  closure: (_response: GameApiModel) => void,
): Promise<GameApiModel | null> => {
  try {
    const response = await VavalMClient.default.getGame(game_id)
    closure(response)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getGameStats = async (game_id: number, closure: (_response: GameStatsApiModel) => void): Promise<GameStatsApiModel | null> => {
  try {
    const response = await VavalMClient.default.getGameStats(game_id)
    response.team1 = parseLogoImageFile<TeamApiModel>(response.team1 as TeamWithLogoImageData)
    response.team2 = parseLogoImageFile<TeamApiModel>(response.team2 as TeamWithLogoImageData)
    closure(response)
    return response
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

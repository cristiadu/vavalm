import { Controller, Get, OperationId, Path, Post, Route, SuccessResponse } from "tsoa"
import GameService from "@/services/GameService"
import { GameApiModel } from "@/models/contract/GameApiModel"
import { GameStatsApiModel } from "@/models/contract/GameStatsApiModel"

@Route("games")
export class GameController extends Controller {
  /**
   * Retrieves a specific game by its ID
   * @param gameId The ID of the game to retrieve
   */
  @Get("{gameId}")
  @OperationId("getGame")
  public async getGame(@Path() gameId: number): Promise<GameApiModel> {
    const game = await GameService.getGame(gameId)
    if (!game) {
      this.setStatus(404)
      throw new Error("Game not found")
    }
    return game.toApiModel()
  }

  /**
   * Plays a game and completes it with simulated results
   * @param gameId The ID of the game to play
   */
  @Post("{gameId}/play")
  @OperationId("playGame")
  @SuccessResponse("200", "Game played successfully")
  public async playGame(@Path() gameId: number): Promise<void> {
    await GameService.playFullGame(gameId)
    this.setStatus(200)
  }

  /**
   * Retrieves games for a specific match
   * @param matchId The ID of the match to retrieve games for
   */
  @Get("match/{matchId}")
  @OperationId("getGamesByMatch")
  public async getGamesByMatch(@Path() matchId: number): Promise<GameApiModel[]> {
    const games = await GameService.getGamesFromMatch(matchId)
    return games.map(game => game.toApiModel())
  }

  /**
   * Retrieves the stats for a specific game
   * @param gameId The ID of the game to retrieve stats for
   */
  @Get("{gameId}/stats")
  @OperationId("getGameStats")
  public async getGameStats(@Path() gameId: number): Promise<GameStatsApiModel> {
    const stats = await GameService.getGameStats(gameId)
    if (!stats) {
      this.setStatus(404)
      throw new Error("Game stats not found")
    }
    
    return stats.toApiModel()
  }
}

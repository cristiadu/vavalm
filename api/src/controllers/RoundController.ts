import { Controller, Get, OperationId, Path, Post, Route } from 'tsoa'
import TournamentService from '@/services/TournamentService'
import MatchService from '@/services/MatchService'
import GameStatsService from '@/services/GameStatsService'
import RoundService from '@/services/RoundService'
import DuelService from '@/services/DuelService'
import { GameLogApiModel, RoundStateApiModel } from '@/models/contract/GameLogApiModel'

@Route("games/{gameId}/rounds")
export class RoundController extends Controller {
  /**
   * Play a full round in a game
   * @param gameId The ID of the game
   * @param round The round number to play
   */
  @Post("{round}/play")
  @OperationId("playRound")
  public async playRound(
    @Path() gameId: number,
    @Path() round: number,
  ): Promise<RoundStateApiModel> {
    const roundFinishedState = await RoundService.playFullRound(gameId, round)
    await GameStatsService.updateAllStats(gameId)
    
    const match = await MatchService.getMatchByGameId(gameId)
    if (!match || !match.id) {
      this.setStatus(500)
      throw new Error('Match not found')
    }

    await TournamentService.updateStandingsAndWinner(match.tournament_id)
    return roundFinishedState.toApiModel()
  }

  /**
   * Play a single duel in a round
   * @param gameId The ID of the game
   * @param round The round number
   */
  @Post("{round}/duel")
  @OperationId("playDuel")
  public async playDuel(
    @Path() gameId: number,
    @Path() round: number,
  ): Promise<RoundStateApiModel> {
    const roundState = await RoundService.playRoundStep(gameId, round)
    await GameStatsService.updateAllStats(gameId)

    const match = await MatchService.getMatchByGameId(gameId)
    if (!match || !match.id) {
      this.setStatus(500)
      throw new Error('Match not found')
    }

    await TournamentService.updateStandingsAndWinner(match.tournament_id)
    return roundState.toApiModel()
  }

  /**
   * Get the last duel in a game
   * @param gameId The ID of the game
   */
  @Get("last/duel")
  @OperationId("getLastDuel")
  public async getLastDuel(
    @Path() gameId: number,
  ): Promise<GameLogApiModel> {
    const lastDuelLog = await DuelService.getLastDuel(gameId)
    return lastDuelLog.toApiModel()
  }

  /**
   * Get logs for the last round in a game
   * @param gameId The ID of the game
   */
  @Get("last")
  @OperationId("getLastRound")
  public async getLastRound(
    @Path() gameId: number,
  ): Promise<GameLogApiModel[]> {
    const lastRoundLogs = await RoundService.getLastRound(gameId)
    return lastRoundLogs.map(log => log.toApiModel())
  }

  /**
   * Get logs for a specific round in a game
   * @param gameId The ID of the game
   * @param round The round number
   */
  @Get("{round}")
  @OperationId("getRound")
  public async getRound(
    @Path() gameId: number,
    @Path() round: number,
  ): Promise<GameLogApiModel[]> {
    const gameLogsFromRound = await RoundService.getRound(gameId, round)
    return gameLogsFromRound.map(log => log.toApiModel())
  }
}


import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { GameStats } from "@/models/GameStats"
import { TeamApiModel } from "./TeamApiModel"
import { PlayerGameStatsApiModel } from "./PlayerGameStatsApiModel"
/**
 * @tsoaModel
 */
export class GameStatsApiModel extends BaseEntityModel {
  constructor(
    public team1_score: number,
    public team2_score: number,
    public game_id: number,
    public team1_id: number,
    public team2_id: number,
    public winner_id?: number,
    public id?: number,
    public team1?: TeamApiModel,
    public team2?: TeamApiModel,
    public players_stats_team1?: PlayerGameStatsApiModel[],
    public players_stats_team2?: PlayerGameStatsApiModel[],
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): GameStatsApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<GameStats> {
    const GameStatsModule = await import('@/models/GameStats')
    const { GameStats } = GameStatsModule

    return new GameStats({
      id: this.id,
      team1_score: this.team1_score,
      team2_score: this.team2_score,
      game_id: this.game_id,
      team1_id: this.team1_id,
      team2_id: this.team2_id,
      winner_id: this.winner_id,
      team1: this.team1?.toEntityModel(),
      team2: this.team2?.toEntityModel(),
      players_stats_team1: this.players_stats_team1?.map(player => player.toEntityModel()),
      players_stats_team2: this.players_stats_team2?.map(player => player.toEntityModel()),
    })
  }
}

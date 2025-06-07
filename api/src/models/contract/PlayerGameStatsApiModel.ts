import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import PlayerGameStats from "@/models/PlayerGameStats"
import { PlayerApiModel } from "./PlayerApiModel"
import { GameStatsApiModel } from "./GameStatsApiModel"

/**
 * @tsoaModel
 */
export class PlayerGameStatsApiModel extends BaseEntityModel {
  constructor(
    public kills: number,
    public deaths: number,
    public assists: number,
    public player_id: number,
    public game_stats_player1_id?: number,
    public game_stats_player2_id?: number,
    public game_stats_player1?: GameStatsApiModel,
    public game_stats_player2?: GameStatsApiModel,
    public player?: PlayerApiModel,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): PlayerGameStatsApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<PlayerGameStats> {
    return new PlayerGameStats({
      kills: this.kills,
      deaths: this.deaths,
      assists: this.assists,
      player_id: this.player_id,
      game_stats_player1_id: this.game_stats_player1_id,
      game_stats_player2_id: this.game_stats_player2_id,
      game_stats_player1: this.game_stats_player1?.toEntityModel(),
      game_stats_player2: this.game_stats_player2?.toEntityModel(),
      player: this.player?.toEntityModel(),
    })
  }
}

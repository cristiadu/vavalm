import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { PlayerGameStats } from "@/models/PlayerGameStats"

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
    public id?: number,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): PlayerGameStatsApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<PlayerGameStats> {
    const PlayerGameStatsModule = await import('@/models/PlayerGameStats')
    const { PlayerGameStats } = PlayerGameStatsModule

    return new PlayerGameStats({
      id: this.id,
      kills: this.kills,
      deaths: this.deaths,
      assists: this.assists,
      player_id: this.player_id,
      game_stats_player1_id: this.game_stats_player1_id,
      game_stats_player2_id: this.game_stats_player2_id,
    })
  }
}

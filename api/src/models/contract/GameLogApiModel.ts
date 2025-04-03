import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { GameLog, RoundState } from "@/models/GameLog"
import { Weapon } from "@/models/enums"
import type { PlayerDuelResults } from "@/models/Player"
import { TeamApiModel } from "@/models/contract/TeamApiModel"
import { PlayerApiModel } from "@/models/contract/PlayerApiModel"

/**
 * @tsoaModel
 */
export class RoundStateApiModel extends BaseEntityModel {
  constructor(
    public round: number,
    public duel: PlayerDuelResults,
    public team1_alive_players: PlayerApiModel[],
    public team2_alive_players: PlayerApiModel[],
    public team_won: TeamApiModel | null,
    public finished: boolean,
    public previous_duel?: PlayerDuelResults,
  ) {
    super()
  }

  async toEntityModel(): Promise<RoundState> {
    const RoundStateModule = await import('@/models/GameLog')
    const { RoundState } = RoundStateModule

    return new RoundState(
      this.round,
      this.duel,
      await Promise.all(this.team1_alive_players.map(async player => player.toEntityModel())) || [],
      await Promise.all(this.team2_alive_players.map(async player => player.toEntityModel())) || [],
      this.team_won ? await this.team_won.toEntityModel() : null,
      this.finished,
      this.previous_duel,
    )
  }

  toApiModel(): RoundStateApiModel {
    return this
  }
}

/**
 * @tsoaModel
 */
export class GameLogApiModel extends BaseEntityModel {
  constructor(
    public round_state: RoundStateApiModel,
    public duel_buff: number,
    public trade_buff: number,
    public trade: boolean,
    public weapon: Weapon,
    public game_id: number,
    public team1_player_id: number,
    public team2_player_id: number,
    public player_killed_id: number,
    public included_on_player_stats: boolean,
    public included_on_team_stats: boolean,
    public id?: number,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): GameLogApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<GameLog> {
    const GameLogModule = await import('@/models/GameLog')
    const { GameLog } = GameLogModule

    return new GameLog({
      id: this.id,
      round_state: await this.round_state.toEntityModel(),
      duel_buff: this.duel_buff,
      trade_buff: this.trade_buff,
      trade: this.trade,
      weapon: this.weapon,
      game_id: this.game_id,
      team1_player_id: this.team1_player_id,
      team2_player_id: this.team2_player_id,
      player_killed_id: this.player_killed_id,
      included_on_player_stats: this.included_on_player_stats,
      included_on_team_stats: this.included_on_team_stats,
    })
  }
}

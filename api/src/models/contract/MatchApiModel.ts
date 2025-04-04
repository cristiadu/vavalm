import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { Match } from "@/models/Match"
import { TeamApiModel } from "./TeamApiModel"
import { GameApiModel } from "./GameApiModel"

/**
 * @tsoaModel
 */
export class MatchApiModel extends BaseEntityModel {
  constructor(
    public date: string,
    public tournament_id: number,
    public team1_id: number,
    public team2_id: number,
    public type: string,
    public team1_score: number,
    public team2_score: number,
    public included_on_standings: boolean,
    public started: boolean,
    public finished: boolean,
    public winner_id?: number,
    public id?: number,
    public team1?: TeamApiModel,
    public team2?: TeamApiModel,
    public games?: GameApiModel[],
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): MatchApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Match> {
    const MatchModule = await import('@/models/Match')
    const { Match } = MatchModule

    return new Match({
      id: this.id,
      date: new Date(this.date),
      tournament_id: this.tournament_id,
      team1_id: this.team1_id,
      team2_id: this.team2_id,
      winner_id: this.winner_id,
      type: this.type,
      team1_score: this.team1_score,
      team2_score: this.team2_score,
      included_on_standings: this.included_on_standings,
      started: this.started,
      finished: this.finished,
      team1: this.team1?.toEntityModel(),
      team2: this.team2?.toEntityModel(),
      games: this.games?.map(game => game.toEntityModel()),
    })
  }
} 


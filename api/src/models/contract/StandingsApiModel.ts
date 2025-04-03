import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { Standings } from "@/models/Standings"

/**
 * @tsoaModel
 */
export class StandingsApiModel extends BaseEntityModel {
  constructor(
    public wins: number,
    public losses: number,
    public maps_won: number,
    public maps_lost: number,
    public rounds_won: number,
    public rounds_lost: number,
    public tournament_id: number,
    public team_id: number,
    public position: number,
    public id?: number,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): StandingsApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Standings> {
    const StandingsModule = await import('@/models/Standings')
    const { Standings } = StandingsModule

    return new Standings({
      id: this.id,
      wins: this.wins,
      losses: this.losses,
      maps_won: this.maps_won,
      maps_lost: this.maps_lost,
      rounds_won: this.rounds_won,
      rounds_lost: this.rounds_lost,
      tournament_id: this.tournament_id,
      team_id: this.team_id,
      position: this.position,
    })
  }
}

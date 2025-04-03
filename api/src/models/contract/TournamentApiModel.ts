import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { Tournament } from "@/models/Tournament"
import { TournamentType } from "@/models/enums"
import { TeamApiModel } from "@/models/contract/TeamApiModel"

/**
 * @tsoaModel
 */
export class TournamentApiModel extends BaseEntityModel {
  constructor(
    public name: string,
    public description: string,
    public country: string,
    public type: TournamentType,
    public start_date: string,
    public end_date: string,
    public started: boolean,
    public ended: boolean,
    public winner_id?: number,
    public teams?: (TeamApiModel | number)[],
    public id?: number,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): TournamentApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Tournament> {
    const TournamentModule = await import('@/models/Tournament')
    const { Tournament } = TournamentModule

    // Process teams - convert numbers to simple objects with id only
    const processedTeams = this.teams?.map(team => {
      if (typeof team === 'number') {
        return { id: team } // Create a simple object with just the ID
      } else {
        return team.toEntityModel() // Process full TeamApiModel normally
      }
    })

    return new Tournament({
      id: this.id,
      name: this.name,
      description: this.description,
      country: this.country,
      type: this.type,
      teams: processedTeams,
      start_date: new Date(this.start_date),
      end_date: new Date(this.end_date),
      started: this.started,
      ended: this.ended,
      winner_id: this.winner_id,
    })
  }
}

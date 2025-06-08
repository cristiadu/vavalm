import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import Game from "@/models/Game"
import { GameMap } from "@/models/enums"
import { GameStatsApiModel } from "@/models/contract/GameStatsApiModel"

/**
 * @tsoaModel
 */
export class GameApiModel extends BaseEntityModel {
  constructor(
    public date: string,
    public map: GameMap,
    public match_id: number,
    public included_on_standings: boolean,
    public started: boolean,
    public finished: boolean,
    public id?: number,
    public stats?: GameStatsApiModel,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): GameApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Game> {
    return new Game({
      id: this.id,
      date: new Date(this.date),
      map: this.map,
      match_id: this.match_id,
      included_on_standings: this.included_on_standings,
      started: this.started,
      finished: this.finished,
      stats: this.stats,
    })
  }
}

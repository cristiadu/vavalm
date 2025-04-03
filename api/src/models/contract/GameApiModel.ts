import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { Game } from "@/models/Game"
import { GameMap } from "@/models/enums"

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
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): GameApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Game> {
    const GameModule = await import('@/models/Game')
    const { Game } = GameModule

    return new Game({
      id: this.id,
      date: new Date(this.date),
      map: this.map,
      match_id: this.match_id,
      included_on_standings: this.included_on_standings,
      started: this.started,
      finished: this.finished,
    })
  }
}

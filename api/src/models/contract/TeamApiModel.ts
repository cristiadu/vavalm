import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type {Team} from "@/models/Team"
import type { Optional } from "sequelize"
import { PlayerApiModel } from "./PlayerApiModel"

/**
 * @tsoaModel
 */
export class TeamApiModel extends BaseEntityModel {
  constructor(
    public short_name?: string,
    public full_name?: string,
    public description?: string,
    public country?: string,
    /** 
     * @tsoaProperty
     * @tsoaFormat "binary"
     */
    public logo_image_file?: Blob | null,
    public id?: number,
    public players?: PlayerApiModel[],
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): TeamApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Team> {
    const TeamModule = await import('@/models/Team')
    const { Team } = TeamModule

    return new Team({
      id: this.id,
      short_name: this.short_name || "",
      full_name: this.full_name || "",
      description: this.description || "",
      country: this.country || "",
      logo_image_file: this.logo_image_file,
      players: this.players?.map(player => player.toEntityModel()),
    })
  }

  @Hidden()
  async toEntityModelBulk(): Promise<Optional<object, never>> {
    const entity = await this.toEntityModel()
    return entity.toJSON()
  }
}

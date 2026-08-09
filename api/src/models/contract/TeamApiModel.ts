import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import Team from "@/models/Team"
import { PlayerApiModel } from "@/models/contract/PlayerApiModel"

/**
 * @tsoaModel
 */
export class TeamApiModel extends BaseEntityModel {
  constructor(
    public short_name?: string,
    public full_name?: string,
    public description?: string,
    public country?: string,
    public logo_url?: string | null,
    public id?: number,
    public players?: PlayerApiModel[],
  ) {
    super()
  }

  /**
   * Constructs a real TeamApiModel instance from a plain object
   * (e.g. a tsoa-deserialized request body, which has the right shape but no methods).
   */
  static from(data: TeamApiModel): TeamApiModel {
    return new TeamApiModel(
      data.short_name, data.full_name, data.description, data.country,
      data.logo_url, data.id, data.players,
    )
  }

  @Hidden()
  override toApiModel(): TeamApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Team> {
    return new Team({
      id: this.id,
      short_name: this.short_name || "",
      full_name: this.full_name || "",
      description: this.description || "",
      country: this.country || "",
      players: this.players?.map(player => player.toEntityModel()),
    })
  }

  @Hidden()
  async toEntityModelBulk(): Promise<Record<string, unknown>> {
    const { id, short_name, full_name, description, country } = await this.toEntityModel()
    return {
      ...(id != null && { id }),
      short_name,
      full_name,
      description,
      country,
    }
  }
}

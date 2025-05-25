import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import type { Team } from "@/models/Team"
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
    public logo_image_file?: string | File | null,
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

    // Convert image data to Buffer if needed
    let logoBuffer = null
    if (this.logo_image_file) {
      if (typeof this.logo_image_file === 'string' && this.logo_image_file.startsWith('data:image')) {
        // Handle base64 data URL format
        const base64Data = this.logo_image_file.split(',')[1] || this.logo_image_file
        try {
          logoBuffer = Buffer.from(base64Data, 'base64')
        } catch (e) {
          console.error('Error converting base64 to buffer:', e)
        }
      } else if (this.logo_image_file instanceof File) {
        // Handle File object format (from form upload)
        const arrayBuffer = await this.logo_image_file.arrayBuffer()
        logoBuffer = Buffer.from(arrayBuffer)
      }
    }

    return new Team({
      id: this.id,
      short_name: this.short_name || "",
      full_name: this.full_name || "",
      description: this.description || "",
      country: this.country || "",
      logo_image_file: logoBuffer,
      players: this.players?.map(player => player.toEntityModel()),
    })
  }

  @Hidden()
  async toEntityModelBulk(): Promise<Optional<object, never>> {
    const entity = await this.toEntityModel()
    return entity.toJSON()
  }
}

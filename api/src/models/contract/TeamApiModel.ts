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
    public logo_image_file?: string | File | null,
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
      data.logo_image_file, data.id, data.players,
    )
  }

  @Hidden()
  override toApiModel(): TeamApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Team> {
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
  async toEntityModelBulk(): Promise<Record<string, unknown>> {
    const { id, short_name, full_name, description, country, logo_image_file } = await this.toEntityModel()
    return {
      ...(id != null && { id }),
      short_name,
      full_name,
      description,
      country,
      logo_image_file,
    }
  }
}

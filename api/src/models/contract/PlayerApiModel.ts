import { BaseEntityModel } from "@/base/types"
import { Hidden } from "tsoa"
import { PlayerRole } from "@/models/enums"
import type { Optional } from "sequelize"
import Player, { PlayerAttributes } from "@/models/Player"

export class PlayerAttributesApiModel extends BaseEntityModel {
  constructor(
    public clutch: number,
    public awareness: number,
    public aim: number,
    public positioning: number,
    public game_reading: number,
    public resilience: number,
    public confidence: number,
    public strategy: number,
    public adaptability: number,
    public communication: number,
    public unpredictability: number,
    public game_sense: number,
    public decision_making: number,
    public rage_fuel: number,
    public teamwork: number,
    public utility_usage: number,
  ) {
    super()
  }

  async toEntityModel(): Promise<PlayerAttributes> {
    const PlayerModule = await import('@/models/Player')
    const { PlayerAttributes } = PlayerModule
    
    return new PlayerAttributes(
      this.clutch,
      this.awareness,
      this.aim,
      this.positioning,
      this.game_reading,
      this.resilience,
      this.confidence,
      this.strategy,
      this.adaptability,
      this.communication,
      this.unpredictability,
      this.game_sense,
      this.decision_making,
      this.rage_fuel,
      this.teamwork,
      this.utility_usage,
    )
  }

  toApiModel(): PlayerAttributesApiModel {
    return this
  } 
}

/**
 * @tsoaModel
 */
export class PlayerApiModel extends BaseEntityModel {
  constructor(
    public nickname: string,
    public full_name: string,
    public age: number,
    public country: string,
    public team_id: number,
    public role: PlayerRole,
    public player_attributes: PlayerAttributesApiModel,
    public id?: number,
  ) {
    super()
  }

  @Hidden()
  override toApiModel(): PlayerApiModel {
    return this
  }

  @Hidden()
  override async toEntityModel(): Promise<Player> {
    const attributes = await this.player_attributes.toEntityModel()
    
    return new Player({
      id: this.id,
      nickname: this.nickname,
      full_name: this.full_name,
      age: this.age,
      country: this.country,
      team_id: this.team_id,
      role: this.role,
      player_attributes: attributes,
    })
  }

  @Hidden()
  async toEntityModelBulk(): Promise<Optional<object, never>> {
    const entity = await this.toEntityModel()
    return entity.toJSON()
  }
}

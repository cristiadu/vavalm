import { Model, DataTypes, Association } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import { PlayerRole } from '@/models/enums'
import { BaseEntityModel } from '@/base/types'
import { PlayerApiModel, PlayerAttributesApiModel } from '@/models/contract/PlayerApiModel'

/**
 * @tsoaModel
 */
export interface PlayerDuel {
  player1: Player
  player2: Player
  isTrade: boolean
}

/**
 * @tsoaModel
 */
export interface PlayerDuelResults {
  winner: PlayerApiModel | null
  loser: PlayerApiModel | null
  startedTradeDuel: boolean
}


// Number must be between 0 and 3
export interface PlayerAttributesContract {
  clutch: number,
  awareness: number,
  aim: number,
  positioning: number,
  game_reading: number,
  resilience: number,
  confidence: number,
  strategy: number,
  adaptability: number,
  communication: number,
  unpredictability: number,
  game_sense: number,
  decision_making: number,
  rage_fuel: number,
  teamwork: number,
  utility_usage: number,
}

// Must follow the PlayerAttributesContract interface
export class PlayerAttributes extends BaseEntityModel implements PlayerAttributesContract {
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

  toApiModel(): PlayerAttributesApiModel {
    return new PlayerAttributesApiModel(
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

  toEntityModel(): PlayerAttributes {
    return this
  }
}

class Player extends Model implements BaseEntityModel {
  declare id: number
  declare nickname: string
  declare full_name: string
  declare age: number
  declare country: string
  declare team_id: number
  declare team: Team
  declare role: PlayerRole
  declare player_attributes: PlayerAttributes

  static associations: {
    team: Association<Player, Team>
  }

  toApiModel(): PlayerApiModel {
    let playerAttributes: PlayerAttributes
    if (this.player_attributes instanceof PlayerAttributes) {
      playerAttributes = this.player_attributes
    } else {
      // Convert plain object to PlayerAttributes instance
      const attrs = this.player_attributes as unknown as PlayerAttributesContract
      playerAttributes = new PlayerAttributes(
        attrs.clutch,
        attrs.awareness,
        attrs.aim,
        attrs.positioning,
        attrs.game_reading,
        attrs.resilience,
        attrs.confidence,
        attrs.strategy,
        attrs.adaptability,
        attrs.communication,
        attrs.unpredictability,
        attrs.game_sense,
        attrs.decision_making,
        attrs.rage_fuel,
        attrs.teamwork,
        attrs.utility_usage,
      )
    }

    return new PlayerApiModel(
      this.nickname,
      this.full_name,
      this.age,
      this.country,
      this.team_id,
      this.role,
      playerAttributes.toApiModel(),
      this.id,
    )
  }

  toEntityModel(): Player {
    return this
  }
}

Player.init({
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 18,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(PlayerRole)),
    allowNull: false,
    defaultValue: PlayerRole.FLEX,
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  player_attributes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      clutch: 0,
      awareness: 0,
      aim: 0,
      positioning: 0,
      game_reading: 0,
      resilience: 0,
      confidence: 0,
      strategy: 0,
      adaptability: 0,
      communication: 0,
      unpredictability: 0,
      game_sense: 0,
      decision_making: 0,
      rage_fuel: 0,
      teamwork: 0,
      utility_usage: 0,
    } as PlayerAttributes,
  },
}, {
  sequelize: db.sequelize,
  modelName: 'Player',
})

export default Player

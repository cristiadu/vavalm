import { Model, DataTypes, Association } from 'sequelize'

import db from './db'

import Team from './Team'
import { PlayerRole } from './enums'

export interface PlayerDuel {
  player1: Player
  player2: Player
  isTrade: boolean
}

export interface PlayerDuelResults {
  winner: Player | null
  loser: Player | null
  startedTradeDuel: boolean
}

export interface PlayerAttributes {
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
  utility_usage: number
}

class Player extends Model {
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

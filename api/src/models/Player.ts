import { Model, DataTypes, Association } from 'sequelize'
import Team from './Team'
import { PlayerRole } from './enums'
import { sequelize } from './index'

export interface PlayerDuel {
  player1: Player
  player2: Player
  isTrade: boolean
}

export interface PlayerDuelResults {
  winner: Player
  loser: Player
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
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(PlayerRole)),
    allowNull: false,
    defaultValue: PlayerRole.Flex,
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  player_attributes: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Player',
})

export default Player

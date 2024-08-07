import { Model, DataTypes } from 'sequelize'
import { sequelize } from './index'
import Team from './Team'

class Player extends Model {
  declare id: number
  declare nickname: string
  declare full_name: string
  declare age: number
  declare country: string
  declare team_id: number
  declare team: Team
  declare player_attributes: {
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

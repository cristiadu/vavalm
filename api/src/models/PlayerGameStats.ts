import { DataTypes, Model } from 'sequelize'
import { sequelize } from './index'
import Player from './Player'

class PlayerGameStats extends Model {
  declare player: Player
  declare kills: number
  declare deaths: number
  declare assists: number
}

PlayerGameStats.init({
  kills: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deaths: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assists: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize, modelName: 'PlayerGameStats' })

export default PlayerGameStats

import { Association, DataTypes, Model } from 'sequelize'
import Player from './Player'
import { sequelize } from './index'

class PlayerGameStats extends Model {
  declare player: Player
  declare kills: number
  declare deaths: number
  declare assists: number

  static associations: {
    player: Association<PlayerGameStats, Player>
  }
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

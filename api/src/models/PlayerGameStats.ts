import { Association, DataTypes, Model } from 'sequelize'
import Player from './Player'
import { sequelize } from './index'

class PlayerGameStats extends Model {
  declare player: Player
  declare kills: number
  declare deaths: number
  declare assists: number
  declare game_stats_id: number
  declare player_id: number

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
  game_stats_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize, modelName: 'PlayerGameStats' })

export default PlayerGameStats

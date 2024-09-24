import { Association, DataTypes, Model } from 'sequelize'

import db from './db'

import Player from './Player'
import GameStats from './GameStats'

class PlayerGameStats extends Model {
  declare player: Player
  declare kills: number
  declare deaths: number
  declare assists: number
  declare player_id: number
  declare game_stats_player1_id?: number
  declare game_stats_player2_id?: number
  declare game_stats_player1?: GameStats
  declare game_stats_player2?: GameStats

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
  game_stats_player1_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  game_stats_player2_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize: db.sequelize, modelName: 'PlayerGameStats' })

export default PlayerGameStats

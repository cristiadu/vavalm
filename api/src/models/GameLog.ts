import { DataTypes, Model } from 'sequelize'
import { sequelize } from './index'
import Player from './Player'

export class GameLog extends Model {
  declare date: Date
  declare duel_buff: number
  declare trade_buff: number
  declare trade: boolean
  declare team1_player: Player
  declare team2_player: Player
  declare player_killed: Player
}

GameLog.init({
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  duel_buff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  trade_buff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  trade: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
}, { sequelize, modelName: 'GameLog' })

export default GameLog

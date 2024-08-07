import { Association, DataTypes, Model } from 'sequelize'
import Player from './Player'
import { sequelize } from './index'

export class GameLog extends Model {
  declare date: Date
  declare duel_buff: number
  declare trade_buff: number
  declare trade: boolean
  declare team1_player: Player
  declare team2_player: Player
  declare player_killed: Player

  static associations: {
    team1_player: Association<GameLog, Player>
    team2_player: Association<GameLog, Player>
    player_killed: Association<GameLog, Player>
  }
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

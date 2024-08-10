import { Association, DataTypes, Model } from 'sequelize'
import Player from './Player'
import { sequelize } from './index'

// Manage a Round state as it goes.
export interface Round {
  round: number
  isTradeHappening: boolean
  team1_alive_players: Player[]
  team2_alive_players: Player[]
  finished: boolean
}

export class GameLog extends Model {
  declare round: number
  declare last_duel_of_round: boolean
  declare duel_buff: number
  declare trade_buff: number
  declare trade: boolean
  declare team1_player: Player
  declare team2_player: Player
  declare player_killed: Player
  declare game_id: number
  declare team1_player_id: number
  declare team2_player_id: number
  declare player_killed_id: number

  static associations: {
    team1_player: Association<GameLog, Player>
    team2_player: Association<GameLog, Player>
    player_killed: Association<GameLog, Player>
  }
}

GameLog.init({
  round: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  last_duel_of_round: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  duel_buff: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  trade_buff: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  trade: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team1_player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team2_player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  player_killed_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize, modelName: 'GameLog' })

export default GameLog

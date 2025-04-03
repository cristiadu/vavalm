import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import Player, { PlayerDuelResults } from '@/models/Player'
import { Weapon } from '@/models/enums'

// Manage a Round state as it goes.
export interface RoundState {
  round: number
  duel: PlayerDuelResults | null
  previous_duel: PlayerDuelResults | null
  team1_alive_players: Player[]
  team2_alive_players: Player[]
  team_won: Team | null
  finished: boolean
}

export class GameLog extends Model {
  declare id?: number
  declare round_state: RoundState
  declare duel_buff: number
  declare trade_buff: number
  declare trade: boolean
  declare weapon: Weapon
  declare team1_player: Player
  declare team2_player: Player
  declare player_killed: Player
  declare game_id: number
  declare team1_player_id: number
  declare team2_player_id: number
  declare player_killed_id: number
  declare included_on_player_stats: boolean
  declare included_on_team_stats: boolean

  static associations: {
    team1_player: Association<GameLog, Player>
    team2_player: Association<GameLog, Player>
    player_killed: Association<GameLog, Player>
  }
}

GameLog.init({
  round_state: {
    type: DataTypes.JSON,
    allowNull: false,
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
  weapon: {
    type: DataTypes.ENUM(...Object.values(Weapon)),
    allowNull: false,
  },
  included_on_player_stats: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  included_on_team_stats: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, { sequelize: db.sequelize, modelName: 'GameLog' })

export default GameLog

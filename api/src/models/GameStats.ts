import { Association, DataTypes, Model } from 'sequelize'

import db from './db'

import Team from './Team'
import PlayerGameStats from './PlayerGameStats'
import Game from './Game'

class GameStats extends Model {
  declare id?: number
  declare team1: Team
  declare team2: Team
  declare game: Game
  declare players_stats_team1: PlayerGameStats[]
  declare players_stats_team2: PlayerGameStats[]
  declare team1_score: number
  declare team2_score: number
  declare winner: Team
  declare game_id: number
  declare team1_id: number
  declare team2_id: number
  declare winner_id: number

  static associations: {
    game: Association<GameStats, Game>
    team1: Association<GameStats, Team>
    team2: Association<GameStats, Team>
    players_stats_team1: Association<GameStats, PlayerGameStats>
    players_stats_team2: Association<GameStats, PlayerGameStats>
    winner: Association<GameStats, Team>
  }
}

GameStats.init({
  team1_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team2_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  winner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, { sequelize: db.sequelize, modelName: 'GameStats' })

export default GameStats

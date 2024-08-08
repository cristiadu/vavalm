import { Association, DataTypes, Model } from 'sequelize'
import Team from './Team'
import PlayerGameStats from './PlayerGameStats'
import { sequelize } from './index'

class GameStats extends Model {
  declare team1: Team
  declare team2: Team
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
    allowNull: false,
  },
}, { sequelize, modelName: 'GameStats' })

export default GameStats

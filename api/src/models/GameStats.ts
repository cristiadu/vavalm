import { DataTypes, Model } from 'sequelize'
import { sequelize } from './index'
import Team from './Team'
import PlayerGameStats from './PlayerGameStats'

class GameStats extends Model {
  declare team1: Team
  declare team2: Team
  declare players_stats_team1: PlayerGameStats[]
  declare players_stats_team2: PlayerGameStats[]
  declare team1_score: number
  declare team2_score: number
  declare winner: Team
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
}, { sequelize, modelName: 'GameStats' })

export default GameStats

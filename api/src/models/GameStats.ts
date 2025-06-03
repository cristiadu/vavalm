import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import PlayerGameStats from '@/models/PlayerGameStats'
import Game from '@/models/Game'
import { BaseEntityModel } from '@/base/types'
import { GameStatsApiModel } from '@/models/contract/GameStatsApiModel'

class GameStats extends Model implements BaseEntityModel {
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

  toApiModel(): GameStatsApiModel {
    return new GameStatsApiModel(
      this.team1_score,
      this.team2_score,
      this.game_id,
      this.team1_id,
      this.team2_id,
      this.winner_id,
      this.id,
      this.team1?.toApiModel(),
      this.team2?.toApiModel(),
      this.players_stats_team1?.map(player => player.toApiModel()),
      this.players_stats_team2?.map(player => player.toApiModel()),
    )
  }

  toEntityModel(): GameStats {
    return this
  }

  clone(): GameStats {
    return Object.assign(new GameStats(), this)
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

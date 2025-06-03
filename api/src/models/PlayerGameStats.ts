import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Player from '@/models/Player'
import GameStats from '@/models/GameStats'
import { PlayerGameStatsApiModel } from '@/models/contract/PlayerGameStatsApiModel'
import { BaseEntityModel } from '@/base/types'

/**
 * @tsoaModel
 */
class PlayerGameStats extends Model implements BaseEntityModel {
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

  toApiModel(): PlayerGameStatsApiModel {
    return new PlayerGameStatsApiModel(
      this.kills,
      this.deaths,
      this.assists,
      this.player_id,
      this.game_stats_player1_id,
      this.game_stats_player2_id,
      this.game_stats_player1?.toApiModel(),
      this.game_stats_player2?.toApiModel(),
      this.player?.toApiModel(),
    )
  }

  toEntityModel(): PlayerGameStats {
    return this
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

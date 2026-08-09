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

  /**
   * Returns the game stats this row belongs to, whichever side the player took.
   */
  playedGameStats(): GameStats | undefined {
    return this.game_stats_player1 ?? this.game_stats_player2
  }

  /**
   * Returns the id of the team the player actually played for in this game.
   *
   * A row linked through game_stats_player1 was played for that game's team1,
   * one linked through game_stats_player2 for its team2. Reading the side keeps
   * historical results correct when a player later transfers.
   */
  playedForTeamId(): number | undefined {
    return this.game_stats_player1?.team1_id ?? this.game_stats_player2?.team2_id
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
}, {
  sequelize: db.sequelize,
  modelName: 'PlayerGameStats',
  indexes: [
    { fields: ['player_id'] },
    { fields: ['game_stats_player1_id'] },
    { fields: ['game_stats_player2_id'] },
  ],
})

export default PlayerGameStats

import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import Player from '@/models/Player'
import { TournamentType } from '@/models/enums'
import Standings from '@/models/Standings'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'
import GameLog from '@/models/GameLog'
import PlayerGameStats from '@/models/PlayerGameStats'
import { BaseEntityModel } from '@/base/types'
import { TournamentApiModel } from '@/models/contract/TournamentApiModel'

class Tournament extends Model implements BaseEntityModel {
  /** @format int64 */
  declare id?: number
  declare type: TournamentType
  declare name: string
  declare description: string
  declare country: string
  declare schedule: Match[]
  declare teams: Team[]
  declare standings: Standings[]
  /** @format int64 */
  declare winner_id: number
  declare winner: Team
  /** @format date-time */
  declare start_date: Date
  /** @format date-time */
  declare end_date: Date
  declare started: boolean
  declare ended: boolean

  declare addTeams: (teamIds: number[]) => Promise<void>
  declare setTeams: (teamIds: number[]) => Promise<void>

  static associations: {
    schedule: Association<Tournament, Match>
    teams: Association<Tournament, Team>
    standings: Association<Tournament, Standings>
    winner: Association<Tournament, Team>
  }

  toApiModel(): TournamentApiModel {
    return new TournamentApiModel(
      this.name,
      this.description,
      this.country,
      this.type,
      this.start_date.toISOString(),
      this.end_date.toISOString(),
      this.started,
      this.ended,
      this.winner_id,
      this.teams?.map(team => team.toApiModel()),
      this.id,
    )
  }

  toEntityModel(): Tournament {
    return this
  }
}
Tournament.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(...Object.values(TournamentType)),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  started: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  ended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  winner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
}, { 
  sequelize: db.sequelize, 
  modelName: 'Tournament', 
})

Tournament.belongsToMany(Team, { as: 'teams', through: 'TournamentTeams', foreignKey: 'tournament_id', sourceKey: 'id' })
Team.belongsToMany(Tournament, { through: 'TournamentTeams', foreignKey: 'team_id', sourceKey: 'id', as: 'tournaments' })

Tournament.belongsTo(Team, { as: 'winner', foreignKey: 'winner_id' })
Team.hasMany(Tournament, { as: 'tournaments_won', foreignKey: 'winner_id', sourceKey: 'id' })

Tournament.hasMany(Match, { as: 'schedule', foreignKey: 'tournament_id', sourceKey: 'id' })
Match.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'tournament' })

Match.hasMany(Game, { as: 'games', foreignKey: 'match_id', sourceKey: 'id' })
Game.belongsTo(Match, { foreignKey: 'match_id', as : 'match' })

Match.belongsTo(Team, { as: 'team1', foreignKey: 'team1_id', targetKey: 'id' })
Match.belongsTo(Team, { as: 'team2', foreignKey: 'team2_id', targetKey: 'id' })

Tournament.hasMany(Standings, { as: 'standings', foreignKey: 'tournament_id', sourceKey: 'id' })
Standings.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'tournament' })

Game.hasMany(GameLog, { as: 'logs', foreignKey: 'game_id', sourceKey: 'id' })
GameLog.belongsTo(Game, { foreignKey: 'game_id', as: 'game', targetKey: 'id' })

Game.hasOne(GameStats, { as: 'stats', foreignKey: 'game_id', sourceKey: 'id' })
GameStats.belongsTo(Game, { foreignKey: 'game_id', as: 'game' })

GameStats.belongsTo(Team, { as: 'team1', foreignKey: 'team1_id', targetKey: 'id' })
GameStats.belongsTo(Team, { as: 'team2', foreignKey: 'team2_id', targetKey: 'id' })
GameStats.belongsTo(Team, { as: 'winner', foreignKey: 'winner_id', targetKey: 'id' })

GameStats.hasMany(PlayerGameStats, { as: 'players_stats_team1', foreignKey: 'game_stats_player1_id', sourceKey: 'id' })
GameStats.hasMany(PlayerGameStats, { as: 'players_stats_team2', foreignKey: 'game_stats_player2_id', sourceKey: 'id' })
PlayerGameStats.belongsTo(GameStats, { as: 'game_stats_player1', foreignKey: 'game_stats_player1_id', targetKey: 'id' })
PlayerGameStats.belongsTo(GameStats, { as: 'game_stats_player2', foreignKey: 'game_stats_player2_id', targetKey: 'id' })

PlayerGameStats.belongsTo(Player, { as: 'player', foreignKey: 'player_id', targetKey: 'id' })

Standings.belongsTo(Team, { as: 'team', foreignKey: 'team_id', targetKey: 'id' })

GameLog.belongsTo(Player, { as: 'team1_player', foreignKey: 'team1_player_id', targetKey: 'id' })
GameLog.belongsTo(Player, { as: 'team2_player', foreignKey: 'team2_player_id', targetKey: 'id' })
GameLog.belongsTo(Player, { as: 'player_killed', foreignKey: 'player_killed_id', targetKey: 'id' })

export default Tournament

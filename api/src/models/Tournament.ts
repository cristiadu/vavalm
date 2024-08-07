import { Association, DataTypes, Model } from 'sequelize'
import { TournamentType } from './enums'
import Team from './Team'
import Standings from './Standings'
import Game from './Game'
import GameStats from './GameStats'
import GameLog from './GameLog'
import PlayerGameStats from './PlayerGameStats'
import Player from './Player'
import { sequelize } from './index'

class Tournament extends Model {
  declare type: TournamentType
  declare schedule: Game[]
  declare teams: Team[]
  declare standings: Standings[]
  declare start_date: Date
  declare started: boolean
  declare ended: boolean

  static associations: {
    schedule: Association<Tournament, Game>
    teams: Association<Tournament, Team>
    standings: Association<Tournament, Standings>
  }
}
Tournament.init({
  type: {
    type: DataTypes.ENUM(...Object.values(TournamentType)),
    allowNull: false,
  },
  start_date: {
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
}, { 
  sequelize, 
  modelName: 'Tournament', 
})

Tournament.hasMany(Game, { as: 'schedule' })
Game.belongsTo(Tournament)

Tournament.hasMany(Standings, { as: 'standings' })
Standings.belongsTo(Tournament)

Game.hasMany(GameLog, { as: 'logs' })
GameLog.belongsTo(Game)

Game.hasOne(GameStats, { as: 'stats' })
GameStats.belongsTo(Game)

GameStats.hasOne(Team, { as: 'team1' })
GameStats.hasOne(Team, { as: 'team2' })
GameStats.hasOne(Team, { as: 'winner' })

GameStats.hasMany(PlayerGameStats, { as: 'players_stats_team1' })
GameStats.hasMany(PlayerGameStats, { as: 'players_stats_team2' })

PlayerGameStats.belongsTo(Player, { as: 'player' })

Standings.hasOne(Team, { as: 'team' })

GameLog.hasOne(Player, { as: 'team1_player' })
GameLog.hasOne(Player, { as: 'team2_player' })
GameLog.hasOne(Player, { as: 'player_killed' })

export default Tournament

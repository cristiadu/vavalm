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
  declare id?: number
  declare type: TournamentType
  declare name: string
  declare description: string
  declare country: string
  declare schedule: Game[]
  declare teams: Team[]
  declare standings: Standings[]
  declare start_date: Date
  declare started: boolean
  declare ended: boolean

  declare addTeams: (teamIds: number[]) => Promise<void>

  static associations: {
    schedule: Association<Tournament, Game>
    teams: Association<Tournament, Team>
    standings: Association<Tournament, Standings>
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

Tournament.belongsToMany(Team, { as: 'teams', through: 'TournamentTeams', foreignKey: 'tournament_id', sourceKey: 'id' })
Team.belongsToMany(Tournament, { through: 'TournamentTeams', foreignKey: 'team_id', sourceKey: 'id', as: 'tournaments' })

Tournament.hasMany(Game, { as: 'schedule', foreignKey: 'tournament_id', sourceKey: 'id' })
Game.belongsTo(Tournament, { foreignKey: 'tournament_id', as : 'tournament' })

Tournament.hasMany(Standings, { as: 'standings', foreignKey: 'tournament_id', sourceKey: 'id' })
Standings.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'tournament' })

Game.hasMany(GameLog, { as: 'logs', foreignKey: 'game_id', sourceKey: 'id' })
GameLog.belongsTo(Game, { foreignKey: 'game_id', as: 'game' })

Game.hasOne(GameStats, { as: 'stats', foreignKey: 'game_id', sourceKey: 'id' })
GameStats.belongsTo(Game, { foreignKey: 'game_id', as: 'game' })

GameStats.belongsTo(Team, { as: 'team1', foreignKey: 'team1_id', targetKey: 'id' })
GameStats.belongsTo(Team, { as: 'team2', foreignKey: 'team2_id', targetKey: 'id' })
GameStats.belongsTo(Team, { as: 'winner', foreignKey: 'winner_id', targetKey: 'id' })

GameStats.hasMany(PlayerGameStats, { as: 'players_stats_team1', foreignKey: 'game_stats_id', sourceKey: 'id' })
GameStats.hasMany(PlayerGameStats, { as: 'players_stats_team2', foreignKey: 'game_stats_id', sourceKey: 'id' })
PlayerGameStats.belongsTo(GameStats, { as: 'game_stats', foreignKey: 'game_stats_id', targetKey: 'id' })

PlayerGameStats.belongsTo(Player, { as: 'player', foreignKey: 'player_id', targetKey: 'id' })

Standings.belongsTo(Team, { as: 'team', foreignKey: 'team_id', targetKey: 'id' })

GameLog.belongsTo(Player, { as: 'team1_player', foreignKey: 'team1_player_id', targetKey: 'id' })
GameLog.belongsTo(Player, { as: 'team2_player', foreignKey: 'team2_player_id', targetKey: 'id' })
GameLog.belongsTo(Player, { as: 'player_killed', foreignKey: 'player_killed_id', targetKey: 'id' })

export default Tournament

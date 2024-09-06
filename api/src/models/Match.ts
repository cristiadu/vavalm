import { Association, DataTypes, Model } from 'sequelize'
import { MatchType } from './enums'
import db from './db'
import Tournament from './Tournament'
import Game from './Game'
import Team from './Team'

class Match extends Model {
  declare id: number
  declare date: Date
  declare type: MatchType
  declare team1_id: number
  declare team1: Team
  declare team2_id: number
  declare team2: Team
  declare winner_id: number
  declare winner: Team
  declare team1_score: number
  declare team2_score: number
  declare games: Game[]
  declare tournament_id: number
  declare tournament: Tournament
  declare included_on_standings: boolean
  declare started : boolean
  declare finished : boolean

  public static associations: {
    games: Association<Match, Game>
    tournament: Association<Match, Tournament>
  }
}

Match.init({
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  tournament_id: {
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
  type: {
    type: DataTypes.ENUM(...Object.values(MatchType)),
    allowNull: false,
  },
  team1_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team2_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  included_on_standings: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  started: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  finished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, { sequelize: db.sequelize, modelName: 'Match' })

export default Match

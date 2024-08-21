import { Association, DataTypes, Model } from 'sequelize'
import { MatchType } from './enums'
import { sequelize } from './index'
import Tournament from './Tournament'
import Game from './Game'

class Match extends Model {
  declare id: number
  declare date: Date
  declare match_type: MatchType
  declare games: Game[]
  declare tournament_id: number
  declare tournament: Tournament
  declare included_on_standings: boolean

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
  match_type: {
    type: DataTypes.ENUM(...Object.values(MatchType)),
    allowNull: false,
  },
  included_on_standings: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, { sequelize, modelName: 'Match' })

export default Match

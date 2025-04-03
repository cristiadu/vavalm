import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import Tournament from '@/models/Tournament'
import { MatchType } from '@/models/enums'
import Game from '@/models/Game'
import { MatchApiModel } from '@/models/contract/MatchApiModel'
import { BaseEntityModel } from '@/base/types'

export class Match extends Model implements BaseEntityModel {
  declare id?: number
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
  declare started: boolean
  declare finished: boolean

  public static associations: {
    games: Association<Match, Game>
    tournament: Association<Match, Tournament>
  }

  toApiModel(): MatchApiModel {
    const apiModel = new MatchApiModel(
      this.date.toISOString(),
      this.tournament_id,
      this.team1_id,
      this.team2_id,
      this.type,
      this.team1_score,
      this.team2_score,
      this.included_on_standings,
      this.started,
      this.finished,
      this.winner_id,
      this.id,
    )
    return apiModel
  }


  toEntityModel(): Match {
    return this
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

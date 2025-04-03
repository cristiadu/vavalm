import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import { BaseEntityModel } from '@/base/types'
import { StandingsApiModel } from '@/models/contract/StandingsApiModel'

export class Standings extends Model implements BaseEntityModel {
  declare team: Team
  declare wins: number
  declare losses: number
  declare maps_won: number
  declare maps_lost: number
  declare rounds_won: number
  declare rounds_lost: number
  declare tournament_id: number
  declare team_id: number
  declare position: number

  static associations: {
    team: Association<Standings, Team>
  }

  toApiModel(): StandingsApiModel {
    return new StandingsApiModel(
      this.wins,
      this.losses,
      this.maps_won,
      this.maps_lost,
      this.rounds_won,
      this.rounds_lost,
      this.tournament_id,
      this.team_id,
      this.position,
    )
  }

  toEntityModel(): Standings {
    return this
  }
}

Standings.init({
  wins: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  losses: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  maps_won: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  maps_lost: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rounds_won: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rounds_lost: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tournament_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, { 
  sequelize: db.sequelize, 
  modelName: 'Standings', 
})

export default Standings

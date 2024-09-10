import { Association, DataTypes, Model } from 'sequelize'
import Team from './Team'
import db from './db'

class Standings extends Model {
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

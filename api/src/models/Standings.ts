import { DataTypes, Model } from 'sequelize'
import { sequelize } from './index'
import Team from './Team'

class Standings extends Model {
  declare team: Team
  declare wins: number
  declare losses: number
  declare maps_won: number
  declare maps_lost: number
  declare rounds_won: number
  declare rounds_lost: number
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
}, { 
  sequelize, 
  modelName: 'Standings', 
})

export default Standings

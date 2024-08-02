import { Model, DataTypes } from 'sequelize'
import { sequelize } from './index'

interface TeamAttributes {
  id?: number
  short_name: string
  logo_url?: string
  full_name: string
  description?: string
  country: string
}

class Team extends Model<TeamAttributes> implements TeamAttributes {
  declare id: number
  declare short_name: string
  declare logo_url?: string
  declare full_name: string
  declare description?: string
  declare country: string
}

Team.init({
  short_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  logo_url: {
    type: DataTypes.STRING,
    defaultValue: 'https://tecdn.b-cdn.net/img/new/slides/041.jpg',
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  country: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'Team',
})

export default Team

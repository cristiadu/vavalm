import { Model, DataTypes } from 'sequelize'
import { sequelize } from './index'

class Team extends Model {}

Team.init({
  short_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  logo_image_file: {
    type: DataTypes.BLOB,
    allowNull: true,
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

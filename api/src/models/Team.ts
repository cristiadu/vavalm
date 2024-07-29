import { Model, DataTypes } from 'sequelize'
import databaseInstance from '../Database'

class Team extends Model {}

async function initializeTeamModel() {
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
      defaultValue(this: Team) {
        return this.getDataValue('short_name')
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    sequelize: await databaseInstance.getClient(),
    modelName: 'Team',
  })
}

initializeTeamModel()

export default Team

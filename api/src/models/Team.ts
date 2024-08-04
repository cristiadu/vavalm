import { Model, DataTypes } from 'sequelize'
import { sequelize } from './index'
import Player from './Player'

class Team extends Model {
  logo_image_file: any
  short_name!: string
  full_name!: string
  description!: string
  country!: string

  public getPlayers!: () => Promise<Player[]>
}

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

// Establish the relationship
Team.hasMany(Player, { foreignKey: 'team_id' })
Player.belongsTo(Team, { foreignKey: 'team_id' })

export default Team

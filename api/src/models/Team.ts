import { Model, DataTypes, Association } from 'sequelize'
import { sequelize } from './index'
import Player from './Player'

class Team extends Model {
  declare logo_image_file: any
  declare short_name: string
  declare full_name: string
  declare description: string
  declare country: string
  declare readonly players?: Player[]

  public static associations: {
    players: Association<Team, Player>
  }
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

Team.hasMany(Player, { foreignKey: 'team_id', sourceKey: 'id', as: 'players' })
Player.belongsTo(Team, { foreignKey: 'team_id', as: 'team' })

export default Team

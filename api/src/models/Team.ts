import { Model, DataTypes, Association } from 'sequelize'

import db from '@/models/db'

import Player from '@/models/Player'
import Tournament from '@/models/Tournament'
import { TeamApiModel } from '@/models/contract/TeamApiModel'

export class Team extends Model {
  declare id?: number
  declare logo_image_file: Buffer | null
  declare short_name: string
  declare full_name: string
  declare description: string
  declare country: string
  declare readonly players?: Player[]
  declare readonly tournaments?: Tournament[]

  static associations: {
    players: Association<Team, Player>
  }

  toApiModel(): TeamApiModel {
    const logoBase64 = this.logo_image_file 
      ? `data:image/png;base64,${Buffer.from(this.logo_image_file).toString('base64')}` 
      : null
      
    return new TeamApiModel(
      this.short_name,
      this.full_name,
      this.description,
      this.country,
      logoBase64,
      this.id,
      this.players?.map(player => player.toApiModel()),
    )
  }

  toEntityModel(): Team {
    return this
  }
}

Team.init({
  short_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  sequelize: db.sequelize,
  modelName: 'Team',
})

Team.hasMany(Player, { foreignKey: 'team_id', sourceKey: 'id', as: 'players' })
Player.belongsTo(Team, { foreignKey: 'team_id', as: 'team' })

export default Team

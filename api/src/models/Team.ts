import { Model, DataTypes, Association } from 'sequelize'

import db from '@/models/db'

import Player from '@/models/Player'
import Tournament from '@/models/Tournament'
import { TeamApiModel } from '@/models/contract/TeamApiModel'

class Team extends Model {
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

  /**
   * Converts to the api shape.
   *
   * The logo is referenced by url rather than embedded: inlining the blob as
   * base64 made every response carrying a team tens of kilobytes larger, and a
   * url is cacheable and fetched only when a logo is actually shown.
   */
  toApiModel(): TeamApiModel {
    return new TeamApiModel(
      this.short_name,
      this.full_name,
      this.description,
      this.country,
      this.id ? `/api/teams/${this.id}/logo` : null,
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

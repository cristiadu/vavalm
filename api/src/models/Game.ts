import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Match from '@/models/Match'
import { GameMap } from '@/models/enums'
import GameLog from '@/models/GameLog'
import GameStats from '@/models/GameStats'
import { BaseEntityModel } from '@/base/types'
import { GameApiModel } from '@/models/contract/GameApiModel'

export class Game extends Model implements BaseEntityModel {
  declare id: number
  declare date: Date
  declare map: GameMap
  declare logs: GameLog[]
  declare match_id: number
  declare match: Match
  declare stats: GameStats
  declare included_on_standings: boolean
  declare started : boolean
  declare finished : boolean

  public static associations: {
    logs: Association<Game, GameLog>
    stats: Association<Game, GameStats>
  }

  toApiModel(): GameApiModel {
    return new GameApiModel(
      this.date.toISOString(),
      this.map,
      this.match_id,
      this.included_on_standings,
      this.started,
      this.finished,
      this.id,
    )
  }

  toEntityModel(): Game {
    return this
  }
}

Game.init({
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  map: {
    type: DataTypes.ENUM(...Object.values(GameMap)),
    allowNull: false,
  },
  match_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  included_on_standings: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  started: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  finished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, { sequelize: db.sequelize, modelName: 'Game' })

export default Game

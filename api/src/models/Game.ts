import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Match from '@/models/Match'
import { GameMap } from '@/models/enums'
import GameLog from '@/models/GameLog'
import GameStats from '@/models/GameStats'

class Game extends Model {
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

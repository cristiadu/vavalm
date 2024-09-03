import { Association, DataTypes, Model } from 'sequelize'
import { GameMap } from './enums'
import GameLog from './GameLog'
import GameStats from './GameStats'
import db from './db'
import Match from './Match'

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
}, { sequelize: db.sequelize, modelName: 'Game' })

export default Game

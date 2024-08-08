import { Association, DataTypes, Model } from 'sequelize'
import { GameMap } from './enums'
import GameLog from './GameLog'
import GameStats from './GameStats'
import { sequelize } from './index'

class Game extends Model {
  declare date: Date
  declare map: GameMap
  declare logs: GameLog[]
  declare tournament_id: number
  declare stats: GameStats

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
  tournament_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize, modelName: 'Game' })

export default Game

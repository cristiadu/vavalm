import { DataTypes, Model } from 'sequelize'
import { sequelize } from './index'
import { GameMap } from './enums'
import GameLog from './GameLog'
import GameStats from './GameStats'

class Game extends Model {
  declare date: Date
  declare map: GameMap
  declare log: GameLog[]
  declare stats: GameStats
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
}, { sequelize, modelName: 'Game' })

export default Game

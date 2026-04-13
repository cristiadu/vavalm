import { Association, DataTypes, Model } from 'sequelize'

import db from '@/models/db'

import Team from '@/models/Team'
import Player, { PlayerDuelResults } from '@/models/Player'
import { Weapon } from '@/models/enums'
import { BaseEntityModel } from '@/base/types'
import { GameLogApiModel, RoundStateApiModel } from '@/models/contract/GameLogApiModel'

export class RoundState extends BaseEntityModel {
  constructor(
    public round: number,
    public duel: PlayerDuelResults,
    public team1_alive_players: Player[],
    public team2_alive_players: Player[],
    public team_won: Team | null,
    public finished: boolean,
    public previous_duel?: PlayerDuelResults,
  ) {
    super()
  }
  
  toApiModel(): RoundStateApiModel {
    return new RoundStateApiModel(
      this.round,
      this.duel,
      this.team1_alive_players.map(player => player.toApiModel()) || [],
      this.team2_alive_players.map(player => player.toApiModel()) || [],
      this.team_won?.toApiModel() || null,
      this.finished,
      this.previous_duel,
    )
  }

  toEntityModel(): RoundState {
    return this
  }
}

class GameLog extends Model implements BaseEntityModel {
  declare id?: number
  declare round_state: RoundState
  declare duel_buff: number
  declare trade_buff: number
  declare trade: boolean
  declare weapon: Weapon
  declare team1_player: Player
  declare team2_player: Player
  declare player_killed: Player
  declare game_id: number
  declare team1_player_id: number
  declare team2_player_id: number
  declare player_killed_id: number
  declare included_on_player_stats: boolean
  declare included_on_team_stats: boolean

  static associations: {
    team1_player: Association<GameLog, Player>
    team2_player: Association<GameLog, Player>
    player_killed: Association<GameLog, Player>
  }

  toApiModel(): GameLogApiModel {
    // round_state is stored as DataTypes.JSON; when read from the DB it is a plain object,
    // not a RoundState instance. Cast to the scalar subset of RoundStateApiModel to extract
    // only the fields that are reliably persisted (alive-player arrays are excluded and
    // served as [] — per-duel player info is embedded via team1_player / team2_player).
    const rs = this.round_state as Pick<RoundStateApiModel, 'round' | 'duel' | 'team_won' | 'finished' | 'previous_duel'>

    return new GameLogApiModel(
      new RoundStateApiModel(
        rs.round,
        rs.duel,
        [],
        [],
        rs.team_won ?? null,
        rs.finished,
        rs.previous_duel,
      ),
      this.duel_buff,
      this.trade_buff,
      this.trade,
      this.weapon,
      this.game_id,
      this.team1_player_id,
      this.team2_player_id,
      this.player_killed_id,
      this.included_on_player_stats,
      this.included_on_team_stats,
      this.team1_player ? this.team1_player.toApiModel() : undefined,
      this.team2_player ? this.team2_player.toApiModel() : undefined,
    )
  }

  toEntityModel(): GameLog {
    return this
  }
}

GameLog.init({
  round_state: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  duel_buff: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  trade_buff: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  trade: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team1_player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team2_player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  player_killed_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  weapon: {
    type: DataTypes.ENUM(...Object.values(Weapon)),
    allowNull: false,
  },
  included_on_player_stats: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  included_on_team_stats: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize: db.sequelize,
  modelName: 'GameLog',
  indexes: [
    { fields: ['game_id'] },
    { fields: ['team1_player_id'] },
    { fields: ['team2_player_id'] },
    { fields: ['player_killed_id'] },
  ],
})

export default GameLog

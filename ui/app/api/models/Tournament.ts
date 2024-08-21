import { Player } from "./Player"
import { Team } from "./Team"

export const ASSISTS_HALF_MULTIPLIER: number = 0.5

export const orderLogsByRoundAndId = (a: GameLog, b: GameLog): number => {
  if (a.round_state.round === b.round_state.round) {
    return b.id - a.id
  }
  return b.round_state.round - a.round_state.round
}

export const orderPlayersByStats = (p1: PlayerGameStats, p2: PlayerGameStats): number => {
  const kda1 = (p1.kills + p1.assists * ASSISTS_HALF_MULTIPLIER) / p1.deaths
  const kda2 = (p2.kills + p2.assists * ASSISTS_HALF_MULTIPLIER) / p2.deaths

  if (kda1 > kda2) {
    return -1
  } else if (kda1 < kda2) {
    return 1
  } else {
    if (p1.kills > p2.kills) {
      return -1
    } else if (p1.kills < p2.kills) {
      return 1
    } else {
      if (p1.assists > p2.assists) {
        return -1
      } else if (p1.assists < p2.assists) {
        return 1
      } else {
        if (p1.deaths > p2.deaths) {
          return 1
        } else if (p1.deaths < p2.deaths) {
          return -1
        } else {
          return 0
        }
      }
    }
  }
}

export const orderStandingsByStats = (a: Standing, b: Standing): number => {
  if (a.wins > b.wins) {
    return -1
  } else if (a.wins < b.wins) {
    return 1
  } else {
    if (a.maps_won > b.maps_won) {
      return -1
    } else if (a.maps_won < b.maps_won) {
      return 1
    } else {
      if (a.rounds_won > b.rounds_won) {
        return -1
      } else if (a.rounds_won < b.rounds_won) {
        return 1
      } else {
        return 0
      }
    }
  }
}

export const randomValorantWeapon = () =>  {
  const weapons = Object.values(Weapons)
  return weapons[Math.floor(Math.random() * weapons.length)]
}

export enum Weapons {
  VANDAL = 'Vandal',
  PHANTOM = 'Phantom',
  OPERATOR = 'Operator',
  SHERIFF = 'Sheriff',
  GHOST = 'Ghost',
  MARSHAL = 'Marshal',
  ARES = 'Ares',
  ODIN = 'Odin',
  BUCKY = 'Bucky',
  JUDGE = 'Judge',
  FRENZY = 'Frenzy',
  SHORTY = 'Shorty',
}

export enum TournamentType {
  SINGLE_GROUP = 'SINGLE_GROUP',
}

export enum GameMap {
  BIND = 'Bind',
  HAVEN = 'Haven',
  SPLIT = 'Split',
  ASCENT = 'Ascent',
  FRACTURE = 'Fracture',
  ICEBOX = 'Icebox',
  BREEZE = 'Breeze',
  SUNSET = 'Sunset',
  ABYSS = 'Abyss',
  LOTUS = 'Lotus',
  PEARL = 'Pearl',
}

export enum MatchType {
  BO1 = 'BO1',
  BO3 = 'BO3',
  BO5 = 'BO5',
}

export interface Match {
  id: number
  team1: Team
  team2: Team
  team1_score: number
  team2_score: number
  games: Game[]
  type: MatchType
  tournament_id: number
  tournament?: Tournament
}

export interface Game {
  id: number
  date: Date
  map: GameMap
  logs: GameLog[]
  stats: GameStats
  match_id: number
  match?: Match
}

export interface RoundState {
  round: number
  isTradeHappening: boolean
  team1_alive_players: Player[]
  team2_alive_players: Player[]
  team_won: Team | null
  finished: boolean
}

export interface GameLog {
  id: number
  round_state: RoundState
  duel_buff: number
  trade_buff: number
  trade: boolean
  team1_player: Player
  team2_player: Player
  player_killed: Player
  game_id: number
  team1_player_id: number
  team2_player_id: number
  player_killed_id: number
}

export interface GameStats {
  game: Game
  team1: Team
  team2: Team
  players_stats_team1: PlayerGameStats[]
  players_stats_team2: PlayerGameStats[]
  team1_score: number
  team2_score: number
  winner: Team
  game_id: number
  team1_id: number
  team2_id: number
  winner_id: number
}

export interface PlayerGameStats {
  player: Player
  kills: number
  deaths: number
  assists: number
  game_stats_id: number
  player_id: number
}

export interface Standing {
  id: number
  team: Team
  wins: number
  losses: number
  maps_won: number
  maps_lost: number
  rounds_won: number
  rounds_lost: number
  tournament_id: number
  team_id: number
}

export interface Tournament {
  id: number
  name: string
  description: string
  start_date: string
  started: boolean
  ended: boolean
  country: string
  type: TournamentType
  teams: Team[]
  schedule: Game[]
  standings: Standing[]
}

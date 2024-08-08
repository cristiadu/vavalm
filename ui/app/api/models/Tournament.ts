import { Player } from "./Player"
import { Team } from "./Team"

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

export interface Game {
  id: number
  date: Date
  map: GameMap
  logs: GameLog[]
  tournament_id: number
  stats: GameStats
}

export interface GameLog {
  date: Date
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

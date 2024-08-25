import Player from "../models/Player"

export interface ItemsWithPagination<T> {
  items: T[]
  total: number
}

export interface AllPlayerStats {
  player: Player
  kda: number
  winrate: number
  totalGames: number
  totalWins: number
  totalKills: number
  totalDeaths: number
  totalAssists: number
}

import Player from "../models/Player"

export interface ItemsWithPagination<T> {
  items: T[]
  total: number
}

export interface AllPlayerStats {
  player: Player
  kda: number
  winrate: number
  mapWinrate: number
  totalMatchesPlayed: number
  totalMatchesWon: number
  totalMatchesLost: number
  totalMapsPlayed: number
  totalMapsWon: number
  totalMapsLost: number
  totalKills: number
  totalDeaths: number
  totalAssists: number
}

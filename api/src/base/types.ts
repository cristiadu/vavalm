import Player from "../models/Player"
import Team from "../models/Team"

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

export interface TeamStats {
  team: Team
  tournamentsWon: number
  tournamentsParticipated: number
  winrate: number
  totalMatchesPlayed: number
  totalMatchesWon: number
  totalMatchesLost: number
  mapWinrate: number
  totalMapsPlayed: number
  totalMapsWon: number
  totalMapsLost: number
}

import { PlayerWithFlag } from "@/api/models/Player"
import { GameStats, Match } from "@/api/models/Tournament"

export interface Team {
  short_name: string
  logo_image_file?: Blob | null
  full_name: string
  description?: string
  country: string
  id?: number
  players?: PlayerWithFlag[]
}

export interface TeamWithLogoImageData extends Omit<Team, 'logo_image_file'> {
  logo_image_file?: { data: number[] } | Blob | null
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

export const getWinOrLossColor = (team: Team, stats: GameStats | Match): string => {
  if (stats.winner_id === null) {
    return 'bg-gray-500 text-white'
  } else if (stats.winner_id === team.id) {
    return 'bg-green-400 text-white'
  } else {
    return 'bg-red-500 text-white'
  }
}

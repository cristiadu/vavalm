import { PlayerRole } from '@/models/enums'

export const VLR_URL = 'https://www.vlr.gg'

export interface VlrPlayer {
  id: string
  nickname: string
  full_name: string
  country: string
  role: PlayerRole
}

export interface VlrTeam {
  id: string
  short_name: string
  full_name: string
  country: string
  logo_url: string
  players: VlrPlayer[]
}

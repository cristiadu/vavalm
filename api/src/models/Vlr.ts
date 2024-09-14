export const VLR_URL = 'https://www.vlr.gg'

export interface VlrPlayer {
  nickname: string
  full_name: string
  country: string
}

export interface VlrTeam {
  short_name: string
  full_name: string
  country: string
  logo_url: string
  players: VlrPlayer[]
}

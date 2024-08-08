import { PlayerWithFlag } from "./Player"

export interface Team {
  short_name: string
  logo_image_file?: Blob | null
  full_name: string
  description?: string
  country: string
  id?: number
  players?: PlayerWithFlag[]
}

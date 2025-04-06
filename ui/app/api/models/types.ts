import { GameLogApiModel, PlayerApiModel, TeamApiModel } from "@/api/generated"

/**
 * A type that represents an enum where the value is the enum name
 * This is used to get the enum name from the enum value
 * @param T - The type of the enum
 */
export interface EnumWithFieldName<T> {
  value: T
}

/**
 * A type that represents an items with pagination
 * @param T - The type of the items
 */
export interface ItemsWithPagination<T> {
  items: T[]
  total: number
  page?: number
  pageSize?: number
}

/**
 * A type that represents a country fetched from the Country API
 * @param code - The code of the country
 * @param name - The name of the country
 * @param flag - The flag of the country
 */
export interface Country {
  code?: string
  name: string
  flag: string
}

/**
 * A type that represents a game log with fetched players
 * @param player1 - The first player
 * @param player2 - The second player
 */
export interface GameLogWithPlayers extends GameLogApiModel {
  player1: PlayerApiModel
  player2: PlayerApiModel
}

/**
 * A type that represents a player with a flag
 * @param countryFlag - The flag of the country
 */
export interface PlayerWithFlag extends PlayerApiModel {
  countryFlag?: string | null;
}

/**
 * A type that represents a team with a logo image file that contains the data field.
 * This is used to parse the logo image file to a blob
 * @param logo_image_file - The logo image file of the team
 */
export interface TeamWithLogoImageData extends Omit<TeamApiModel, 'logo_image_file'> {
  logo_image_file?: { data: number[] } | Blob | null | string
}

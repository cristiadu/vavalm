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
 * A team plus the logo image the user picked in the form.
 *
 * The api never sends image data — reads go through logo_url — so this only
 * ever holds a File on its way to the multipart upload, or null.
 */
export interface TeamWithLogoImageData extends TeamApiModel {
  logo_image_file?: File | null
}

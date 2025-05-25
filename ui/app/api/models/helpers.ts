import { GameStatsApiModel, MatchApiModel, PlayerGameStatsApiModel, PlayerRole, TeamApiModel } from "@/api/generated"
import { ASSISTS_HALF_MULTIPLIER, DEFAULT_TEAM_LOGO_IMAGE_PATH } from "@/api/models/constants"
import { TeamWithLogoImageData } from "@/api/models/types"

/**
 * Get the background color for how high the attribute value is
 * @param attributeValue - The value of the attribute
 * @returns The background color for the attribute
 */
export const getAttributeBgColor = (attributeValue: number): string => {
  switch (attributeValue) {
  case 1:
    return "bg-red-600"
  case 2:
    return "bg-yellow-600"
  case 3:
    return "bg-green-600"
  default:
    return "bg-gray-200"
  }
}

/**
 * Get the background color for the role of a player
 * @param role - The role of the player
 * @returns The background color for the role
 */
export const getRoleBgColor = (role: PlayerRole): string => {
  const tailwindStyle = "p-1 rounded text-white ml-2 "
  switch (role) {
  case PlayerRole.INITIATOR:
    return tailwindStyle + 'bg-blue-400'
  case PlayerRole.DUELIST:
    return tailwindStyle + 'bg-red-700'
  case PlayerRole.CONTROLLER:
    return tailwindStyle + 'bg-green-700'
  case PlayerRole.SENTINEL:
    return tailwindStyle + 'bg-purple-700'
  case PlayerRole.FLEX:
    return tailwindStyle + 'bg-yellow-600'
  case PlayerRole.IGL:
    return tailwindStyle + 'bg-orange-500'
  default:
    return tailwindStyle + 'bg-gray-700'
  }
}

/**
 * Parse to File the logo image file for a team
 * @param team - The team to parse the logo image file for
 * @returns The team with the parsed logo image file
 */
export const parseLogoImageFile = <T>(team: TeamWithLogoImageData): T => {
  // Skip processing if no logo or already a File
  if (!team.logo_image_file || team.logo_image_file instanceof File) {
    return team as T
  }

  // Handle base64 string format (from API)
  if (typeof team.logo_image_file === 'string' && team.logo_image_file.startsWith('data:')) {
    try {
      // Convert base64 to blob then to File
      const parts = team.logo_image_file.split(';base64,')
      const contentType = parts[0].replace('data:', '') || 'image/png'
      const base64 = parts[1]
      const byteCharacters = atob(base64)
      const byteArrays = []

      for (let i = 0; i < byteCharacters.length; i += 1024) {
        const slice = byteCharacters.slice(i, i + 1024)
        const byteNumbers = new Array(slice.length)

        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j)
        }

        byteArrays.push(new Uint8Array(byteNumbers))
      }

      const blob = new Blob(byteArrays, { type: contentType })
      team.logo_image_file = new File([blob], `logo-team-${team.id}.png`, { type: contentType })
    } catch (e) {
      console.error('Error converting base64 to File:', e)
    }
  }

  return team as T
}

/**
 * Get a local client URL of the logo image file for a team
 * @param team - The team to get the URL of the logo image file for
 * @returns The URL of the logo image file for the team
 */
export const teamLogoURLObjectOrDefault = (team: TeamApiModel | null): string => {
  return objectURLOrDefault(team?.logo_image_file as File | null, DEFAULT_TEAM_LOGO_IMAGE_PATH) as string
}

/**
 * Get a local client URL of an image file
 * @param image_file - The image file to get the URL of
 * @param defaultPath - The default path to return if the image file is not found
 * @returns The URL of the image file
 */
export const objectURLOrDefault = (image_file: File | null, defaultPath: string | null): string | null => {
  if (!image_file) {
    return defaultPath
  }

  if (image_file instanceof File) {
    return URL.createObjectURL(image_file)
  }

  return defaultPath
}

/**
 * Get the background color for the win or loss of a team
 * @param team - The team to get the background color for
 * @param stats - The stats of the game or match
 * @returns The background color for the win or loss of the team
 */
export const getWinOrLossColor = (team: TeamApiModel, stats: GameStatsApiModel | MatchApiModel): string => {
  if (stats?.winner_id === null) {
    return 'bg-gray-500 text-white'
  } else if (stats?.winner_id === team?.id) {
    return 'bg-green-400 text-white'
  } else {
    return 'bg-red-500 text-white'
  }
}

/**
 * Sort players by their stats
 * @param p1 - The first player to compare
 * @param p2 - The second player to compare
 * @returns The sorted players
 */
export const sortPlayersByStats = (p1: PlayerGameStatsApiModel, p2: PlayerGameStatsApiModel): number => {
  const kda1 = (p1.kills + p1.assists * ASSISTS_HALF_MULTIPLIER) / p1.deaths
  const kda2 = (p2.kills + p2.assists * ASSISTS_HALF_MULTIPLIER) / p2.deaths

  if (kda1 !== kda2) return kda2 - kda1
  if (p1.kills !== p2.kills) return p2.kills - p1.kills
  if (p1.assists !== p2.assists) return p2.assists - p1.assists
  return p1.deaths - p2.deaths
}



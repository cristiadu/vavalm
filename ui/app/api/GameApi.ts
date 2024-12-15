import { getApiBaseUrl } from "./models/constants"
import { Game, Match } from "./models/Tournament"

export const playFullGame = async (
  game_id: number,
  closure: (response: { message: string }) => void,
) => {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/games/${game_id}/play`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }

    const data = await response.json()
    closure(data)
    console.debug("Success:", data)
    return data
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getMatch = async (match_id: number, closure: (response: Match) => void) => {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/matches/${match_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }

    const data = await response.json()
    // Convert Buffer to Blob for team logos
    if (data.team1.logo_image_file) {
      data.team1.logo_image_file = new Blob(
        [new Uint8Array(data.team1.logo_image_file.data)],
        { type: "image/png" },
      )
    }

    if (data.team2.logo_image_file) {
      data.team2.logo_image_file = new Blob(
        [new Uint8Array(data.team2.logo_image_file.data)],
        { type: "image/png" },
      )
    }

    closure(data)
    console.debug("Success:", data)
    return data
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getGame = async (game_id: number, closure: (response: Game) => void) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }

    const data = await response.json()
    // Convert Buffer to Blob for team logos
    if (data.stats.team1.logo_image_file) {
      data.stats.team1.logo_image_file = new Blob(
        [new Uint8Array(data.stats.team1.logo_image_file.data)],
        { type: "image/png" },
      )
    }

    if (data.stats.team2.logo_image_file) {
      data.stats.team2.logo_image_file = new Blob(
        [new Uint8Array(data.stats.team2.logo_image_file.data)],
        { type: "image/png" },
      )
    }

    closure(data)
    console.debug("Success:", data)
    return data
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

import { getApiBaseUrl } from "@/api/models/constants"
import { Game, GameStats, Match } from "@/api/models/Tournament"
import { Team, TeamWithLogoImageData } from "./models/Team"
import { parseLogoImageFile } from "./models/Team"

export const playFullGame = async (
  game_id: number,
  closure: (_response: { message: string }) => void,
): Promise<void> => {
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

export const getMatch = async (match_id: number, closure: (_response: Match) => void): Promise<Match | null> => {
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

    const data = await response.json() as Match
    data.team1 = parseLogoImageFile<Team>(data.team1 as TeamWithLogoImageData)
    data.team2 = parseLogoImageFile<Team>(data.team2 as TeamWithLogoImageData)

    closure(data)
    console.debug("Success:", data)
    return data as Match
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const getGame = async (
  game_id: number,
  closure: (_response: Game) => void,
  options?: { signal?: AbortSignal },
): Promise<Game | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: options?.signal,
    })

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }

    const data = await response.json()

    closure(data)
    console.debug("Success:", data)
    return data as Game | null
  } catch (error) {
    // Don't log aborted requests as errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Fetch aborted')
      return null
    }
    console.error("Error:", error)
    throw error
  }
}

export const getGameStats = async (game_id: number, closure: (_response: GameStats) => void): Promise<GameStats | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/games/${game_id}/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }

    const data = await response.json() as GameStats
    data.team1 = parseLogoImageFile<Team>(data.team1 as TeamWithLogoImageData)
    data.team2 = parseLogoImageFile<Team>(data.team2 as TeamWithLogoImageData)

    closure(data)
    console.debug("Success:", data)
    return data as GameStats | null
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}
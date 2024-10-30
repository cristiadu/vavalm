import { Game, Match } from "./models/Tournament"

export const playFullGame = async (
  game_id: number,
  closure: (response: { message: string }) => void,
) => {
  try {
    const response = await fetch(
      `http://localhost:8000/games/${game_id}/play`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error("Network response was not ok: ", response)
      return
    }

    const data = await response.json()
    closure(data as { message: string })
    console.debug("Success:", data)
    return data as { message: string }
  } catch (error) {
    console.error("Error:", error)
  }
}

export const getMatch = async (match_id: number, closure: (response: Match) => void) => {
  try {
    const response = await fetch(
      `http://localhost:8000/matches/${match_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error("Network response was not ok: ", response)
      return
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

    closure(data as Match)
    console.debug("Success:", data)
    return data as Match
  } catch (error) {
    console.error("Error:", error)
  }
}

export const getGame = async (game_id: number, closure: (response: Game) => void) => {
  try {
    const response = await fetch(`http://localhost:8000/games/${game_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", response)
      return
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

    closure(data as Game)
    console.debug("Success:", data)
    return data as Game
  } catch (error) {
    console.error("Error:", error)
  }
}

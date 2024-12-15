import { ItemsWithPagination } from "./models/types"
import { Match, Tournament } from "./models/Tournament"
import { getApiBaseUrl, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"

export const fetchTournaments = async (closure: (tournamentData: ItemsWithPagination<Tournament>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`${getApiBaseUrl()}/tournaments?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  // Convert Buffer to Blob for team logos
  const tournamentwithBlob = data.items.map((tournament: Tournament) => {
    const teamsWithBlob = tournament.teams.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })
    return { ...tournament, teams: teamsWithBlob }
  })
  const result = { total: data.total, items: tournamentwithBlob }
  closure(result)
  return result
}

export const fetchTournamentMatchSchedule = async (tournamentId: number, closure: (matchData: ItemsWithPagination<Match>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`${getApiBaseUrl()}/tournaments/${tournamentId}/schedule?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  closure(data)
  return data
}

export const getTournament = async (tournamentId: number, closure: (tournamentData: Tournament) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/tournaments/${tournamentId}`)
  const data = await response.json()
  // Convert Buffer to Blob for team logos
  const teamsWithBlob = data.teams?.map((team: any) => {
    if (team.logo_image_file) {
      const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
      return { ...team, logo_image_file: blob }
    }
    return team
  })

  const standingsWithTeamsRef = data.standings?.map((standing: any) => {
    const standingsTeam = teamsWithBlob.find((team: any) => team.id === standing.team_id)
    return { ...standing, team: standingsTeam }
  })

  const result = { ...data, teams: teamsWithBlob, standings: standingsWithTeamsRef }
  closure(result)
  return result
}

export const newTournament = async (tournament: Tournament, closure: (tournamentData: Tournament) => void) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/tournaments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournament),
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", tournament)
      return
    }

    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    console.error('Error creating tournament:', error)
  }
}

export const editTournament = async (tournament: Tournament, closure: (tournamentData: Tournament) => void) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/tournaments/${tournament.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournament),
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", tournament)
      return
    }

    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    console.error('Error updating tournament:', error)
  }
}

export const deleteTournament = async (tournament: Tournament, closure: ({message}: {message: string}) => void) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/tournaments/${tournament.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournament),
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", tournament)
      return
    }

    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    console.error('Error deleting tournament:', error)
  }
}

import { ItemsWithPagination } from "@/api/models/types"
import { Match, Standing, Tournament } from "@/api/models/Tournament"
import { getApiBaseUrl, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { Team, TeamWithLogoImageData } from "@/api/models/Team"

export const fetchTournaments = async (closure: (_tournamentData: ItemsWithPagination<Tournament>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination<Tournament>> => {
  const response = await fetch(`${getApiBaseUrl()}/tournaments?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  // Convert Buffer to Blob for team logos
  const tournamentwithBlob = data.items.map((tournament: Tournament) => {
    const teamsWithBlob = tournament.teams.map((team: TeamWithLogoImageData) => {
      if (team.logo_image_file) {
        const blob = team.logo_image_file instanceof Blob 
          ? team.logo_image_file 
          : new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })
    return { ...tournament, teams: teamsWithBlob }
  })
  const result = { total: data.total, items: tournamentwithBlob }
  closure(result)
  return result as ItemsWithPagination<Tournament>
}

export const fetchTournamentMatchSchedule = async (tournamentId: number, closure: (_matchData: ItemsWithPagination<Match>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination<Match>> => {
  const response = await fetch(`${getApiBaseUrl()}/tournaments/${tournamentId}/schedule?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  closure(data)
  return data as ItemsWithPagination<Match>
}

export const getTournament = async (tournamentId: number, closure: (_tournamentData: Tournament) => void): Promise<Tournament | null> => {
  const response = await fetch(`${getApiBaseUrl()}/tournaments/${tournamentId}`)
  const data = await response.json()
  // Convert Buffer to Blob for team logos
  const teamsWithBlob = data.teams?.map((team: TeamWithLogoImageData) => {
    if (team.logo_image_file) {
      const blob = team.logo_image_file instanceof Blob 
        ? team.logo_image_file 
        : new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
      return { ...team, logo_image_file: blob }
    }
    return team
  })

  const standingsWithTeamsRef = data.standings?.map((standing: Standing) => {
    const standingsTeam = teamsWithBlob.find((team: Team) => team.id === standing.team_id)
    return { ...standing, team: standingsTeam }
  })

  const result = { ...data, teams: teamsWithBlob, standings: standingsWithTeamsRef }
  closure(result)
  return result
}

export const newTournament = async (tournament: Tournament, closure: (_tournamentData: Tournament) => void): Promise<Tournament | null> => {
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
      return null
    }

    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data
  } catch (error) {
    console.error('Error creating tournament:', error)
    return null
  }
}

export const editTournament = async (tournament: Tournament, closure: (_tournamentData: Tournament) => void): Promise<Tournament | null> => {
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
      return null
    }

    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data as Tournament
  } catch (error) {
    console.error('Error updating tournament:', error)
    return null
  }
}

export const deleteTournament = async (tournament: Tournament, closure: (_result: {message: string}) => void): Promise<{message: string} | null> => {
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
      return null
    }

    const data = await response.json()
    closure(data)
    console.debug('Success:', data)
    return data as {message: string}
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return null
  }
}

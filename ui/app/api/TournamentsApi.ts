import { ItemsWithPagination } from "./models/types"
import { Game, Tournament } from "./models/Tournament"
import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"

const TournamentsApi = {
  fetchTournaments: async (closure: (tournamentData: ItemsWithPagination<Tournament>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
    const response = await fetch(`http://localhost:8000/tournaments?limit=${limit}&offset=${offset}`)
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
    closure({ total: data.total, items: tournamentwithBlob } as ItemsWithPagination<Tournament>)
    return { total: data.total, items: tournamentwithBlob } as ItemsWithPagination<Tournament>
  },
  getTournament: async (tournamentId: number, closure: (tournamentData: Tournament) => void) => {
    const response = await fetch(`http://localhost:8000/tournaments/${tournamentId}`)
    const data = await response.json()
    // Convert Buffer to Blob for team logos
    const teamsWithBlob = data.teams?.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })

    const standingsTeamsWithBlob = data.standings?.map((standing: any) => {
      if (standing.team.logo_image_file) {
        const blob = new Blob([new Uint8Array(standing.team.logo_image_file.data)], { type: 'image/png' })
        return { ...standing, team: { ...standing.team, logo_image_file: blob } }
      }
      return standing
    })

    const gameSchedulesTeamsWithBlob = data.schedule?.map((game: Game) => {
      const team1WithBlob = teamsWithBlob.find((team: any) => team.id === game.stats.team1_id)
      const team2WithBlob = teamsWithBlob.find((team: any) => team.id === game.stats.team2_id)
      return { ...game, stats: { ...game.stats, team1: team1WithBlob, team2: team2WithBlob } }
    })

    closure({...data, teams: teamsWithBlob, standings: standingsTeamsWithBlob, schedule: gameSchedulesTeamsWithBlob} as Tournament)
    return {...data, teams: teamsWithBlob, standings: standingsTeamsWithBlob, schedule: gameSchedulesTeamsWithBlob} as Tournament
  },
  newTournament: async (tournament: Tournament, closure: (tournamentData: Tournament) => void) => {
    try {
      const response = await fetch('http://localhost:8000/tournaments', {
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
      closure(data as Tournament)
      console.debug('Success:', data)
      return data as Tournament
    } catch (error) {
      console.error('Error creating tournament:', error)
    }
  },
  editTournament: async (tournament: Tournament, closure: (tournamentData: Tournament) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/tournaments/${tournament.id}`, {
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
      closure(data as Tournament)
      console.debug('Success:', data)
      return data as Tournament
    } catch (error) {
      console.error('Error updating tournament:', error)
    }
  },
  deleteTournament: async (tournament: Tournament, closure: ({message}: {message: string}) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/tournaments/${tournament.id}`, {
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
      return data as Tournament
    } catch (error) {
      console.error('Error deleting tournament:', error)
    }
  },
}

export default TournamentsApi

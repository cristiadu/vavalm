import { Player } from "./PlayersApi"
import { Team } from "./TeamsApi"

enum TournamentType {
  SINGLE_GROUP = 'SINGLE_GROUP',
}

enum GameMap {
  BIND = 'Bind',
  HAVEN = 'Haven',
  SPLIT = 'Split',
  ASCENT = 'Ascent',
  FRACTURE = 'Fracture',
  ICEBOX = 'Icebox',
  BREEZE = 'Breeze',
  SUNSET = 'Sunset',
  ABYSS = 'Abyss',
  LOTUS = 'Lotus',
  PEARL = 'Pearl',
}

interface Game {
  date: Date
  map: GameMap
  logs: GameLog[]
  tournament_id: number
  stats: GameStats
}

interface GameLog {
  date: Date
  duel_buff: number
  trade_buff: number
  trade: boolean
  team1_player: Player
  team2_player: Player
  player_killed: Player
  game_id: number
  team1_player_id: number
  team2_player_id: number
  player_killed_id: number
}

interface GameStats {
  team1: Team
  team2: Team
  players_stats_team1: PlayerGameStats[]
  players_stats_team2: PlayerGameStats[]
  team1_score: number
  team2_score: number
  winner: Team
  game_id: number
  team1_id: number
  team2_id: number
  winner_id: number
}

interface PlayerGameStats {
  player: Player
  kills: number
  deaths: number
  assists: number
  game_stats_id: number
  player_id: number
}

interface Standing {
  id: number
  team: Team
  wins: number
  losses: number
  maps_won: number
  maps_lost: number
  rounds_won: number
  rounds_lost: number
  tournament_id: number
  team_id: number
}

interface Tournament {
  id: number
  name: string
  description: string
  start_date: string
  started: boolean
  ended: boolean
  country: string
  type: TournamentType
  teams: Team[]
  schedule: Game[]
  standings: Standing[]
}

const TournamentsApi = {
  fetchTournaments: async (closure: (tournamentData: Tournament[]) => void) => {
    const response = await fetch('http://localhost:8000/tournaments')
    const data = await response.json()
    // Convert Buffer to Blob for team logos
    const tournamentwithBlob = data.map((tournament: any) => {
      const teamsWithBlob = tournament.teams.map((team: any) => {
        if (team.logo_image_file) {
          const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
          return { ...team, logo_image_file: blob }
        }
        return team
      })
      return { ...tournament, teams: teamsWithBlob }
    })
    closure(tournamentwithBlob as Tournament[])
    return tournamentwithBlob as Team[]
  },
  fetchTournament: async (tournamentId: number, closure: (tournamentData: Tournament) => void) => {
    const response = await fetch(`http://localhost:8000/tournaments/${tournamentId}`)
    const data = await response.json()
    // Convert Buffer to Blob for team logos
    const teamsWithBlob = data.teams.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })

    const standingsTeamsWithBlob = data.standings.map((standing: any) => {
      if (standing.team.logo_image_file) {
        const blob = new Blob([new Uint8Array(standing.team.logo_image_file.data)], { type: 'image/png' })
        return { ...standing, team: { ...standing.team, logo_image_file: blob } }
      }
      return standing
    })

    closure({...data, teams: teamsWithBlob, standings: standingsTeamsWithBlob} as Tournament)
    return {...data, teams: teamsWithBlob, standings: standingsTeamsWithBlob} as Tournament
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
        console.log("Network response was not ok: ", tournament)
        return
      }

      const data = await response.json()
      closure(data as Tournament)
      console.log('Success:', data)
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
        console.log("Network response was not ok: ", tournament)
        return
      }

      const data = await response.json()
      closure(data as Tournament)
      console.log('Success:', data)
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
        console.log("Network response was not ok: ", tournament)
        return
      }

      const data = await response.json()
      closure(data)
      console.log('Success:', data)
      return data as Tournament
    } catch (error) {
      console.error('Error deleting tournament:', error)
    }
  },
}

export default TournamentsApi
export type { Tournament, Game, Standing, TournamentType, GameMap, GameLog, GameStats, PlayerGameStats }

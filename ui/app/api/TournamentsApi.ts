import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { parseLogoImageFile } from "@/api/models/helpers"
import { TeamWithLogoImageData } from '@/api/models/types'
import { ItemsWithPagination_MatchApiModel_, ItemsWithPagination_TournamentApiModel_, StandingsApiModel, TeamApiModel, TournamentApiModel } from "@/api/generated"
import { VavalMApiClient } from "@/api/client"

export const fetchTournaments = async (closure: (_tournamentData: ItemsWithPagination_TournamentApiModel_) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination_TournamentApiModel_> => {
  const response = await VavalMApiClient.default.getTournaments(limit, offset)
  const tournamentwithParsedLogos = response.items.map((tournament: TournamentApiModel) => {
    const teamsWithParsedLogos = tournament.teams?.map((team) => {
      return parseLogoImageFile<TeamApiModel>(team as TeamWithLogoImageData)
    })
    return { ...tournament, teams: teamsWithParsedLogos }
  })
  const result = { total: response.total, items: tournamentwithParsedLogos } as ItemsWithPagination_TournamentApiModel_
  closure(result)
  return result
}

export const fetchTournamentMatchSchedule = async (tournamentId: number, closure: (_matchData: ItemsWithPagination_MatchApiModel_) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination_MatchApiModel_> => {
  const response = await VavalMApiClient.default.getTournamentSchedule(tournamentId, limit, offset)
  closure(response)
  return response
}

export const getTournament = async (tournamentId: number, closure: (_tournamentData: TournamentApiModel) => void): Promise<TournamentApiModel | null> => {
  const response = await VavalMApiClient.default.getTournament(tournamentId)
  const teamsWithParsedLogos = response.teams?.map((team) => {
    return parseLogoImageFile<TeamApiModel>(team as TeamWithLogoImageData)
  })

  const result = { ...response, teams: teamsWithParsedLogos}
  closure(result)
  return result
}

export const getTournamentStandings = async (tournamentId: number, closure: (_tournamentData: StandingsApiModel[]) => void): Promise<StandingsApiModel[] | null> => {
  const response = await VavalMApiClient.default.getTournamentStandings(tournamentId)
  closure(response)
  return response
}

export const newTournament = async (tournament: TournamentApiModel, closure: (_tournamentData: TournamentApiModel) => void): Promise<TournamentApiModel | null> => {
  try {
    const response = await VavalMApiClient.default.createTournament(tournament)
    closure(response)
    return response
  } catch (error) {
    console.error('Error creating tournament:', error)
    return null
  }
}

export const editTournament = async (tournament: TournamentApiModel, closure: (_tournamentData: TournamentApiModel) => void): Promise<TournamentApiModel | null> => {
  try {
    if (!tournament.id) {
      throw new Error('Tournament ID is required')
    }

    const response = await VavalMApiClient.default.updateTournament(tournament.id, tournament)
    closure(response)
    return response
  } catch (error) {
    console.error('Error updating tournament:', error)
    return null
  }
}

export const deleteTournament = async (tournament: TournamentApiModel, closure: (_result: {message: string}) => void): Promise<{message: string} | null> => {
  try {
    if (!tournament.id) {
      throw new Error('Tournament ID is required')
    }

    await VavalMApiClient.default.deleteTournament(tournament.id)
    closure({message: 'Tournament deleted successfully'})
    return {message: 'Tournament deleted successfully'}
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return null
  }
}

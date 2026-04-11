import { TournamentApiModel, TournamentType } from '@tests/generated/api'
import { apiClient } from '@tests/setup'

export const TEST_TOURNAMENT: Omit<TournamentApiModel, 'id' | 'started' | 'ended' | 'winner_id' | 'teams'> = {
  name: 'Fixture Tournament',
  description: 'Tournament created for API tests',
  country: 'Brazil',
  type: TournamentType.SINGLE_GROUP,
  start_date: '2025-01-01T00:00:00.000Z',
  end_date: '2025-12-31T00:00:00.000Z',
}

/**
 * GIVEN: a tournament exists with the provided teams.
 * Creates the tournament via the API and returns it.
 * Auto-creates matches and standings for all team pairs.
 */
export const givenTournamentExists = async (
  teamIds: number[],
  overrides: Partial<TournamentApiModel> = {},
): Promise<TournamentApiModel> => {
  return await apiClient.default.createTournament({
    ...TEST_TOURNAMENT,
    teams: teamIds,
    started: false,
    ended: false,
    ...overrides,
  })
}

/**
 * Cleanup helper — deletes a tournament and its associated matches and standings.
 */
export const cleanupTournament = async (tournamentId: number | undefined): Promise<void> => {
  if (tournamentId) await apiClient.default.deleteTournament(tournamentId)
}

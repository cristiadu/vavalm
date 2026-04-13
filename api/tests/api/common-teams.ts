import { TeamApiModel } from '@tests/generated/api'
import { apiClient } from '@tests/setup'

export const TEST_TEAM: Omit<TeamApiModel, 'id' | 'players' | 'logo_image_file'> = {
  short_name: 'TMFIX',
  full_name: 'Team Fixture',
  country: 'Brazil',
  description: 'Fixture team created for API tests',
}

/**
 * GIVEN: a team exists in the database.
 * Creates a team via the bulk endpoint and returns it.
 */
export const givenTeamExists = async (overrides: Partial<TeamApiModel> = {}): Promise<TeamApiModel> => {
  const teams = await apiClient.default.createTeamsBulk([{ ...TEST_TEAM, ...overrides }])
  return teams[0]
}

/**
 * Cleanup helper — deletes a team by id.
 */
export const cleanupTeam = async (teamId: number | undefined): Promise<void> => {
  if (teamId) await apiClient.default.deleteTeam(teamId)
}

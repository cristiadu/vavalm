import { PlayerApiModel, PlayerRole } from '@tests/generated/api'
import { apiClient } from '@tests/setup'

export const TEST_PLAYER_ATTRIBUTES = {
  clutch: 2,
  awareness: 3,
  aim: 2,
  positioning: 1,
  game_reading: 2,
  resilience: 3,
  confidence: 2,
  strategy: 1,
  adaptability: 2,
  communication: 3,
  unpredictability: 1,
  game_sense: 2,
  decision_making: 2,
  rage_fuel: 1,
  teamwork: 3,
  utility_usage: 2,
}

export const TEST_PLAYER: Omit<PlayerApiModel, 'id'> = {
  nickname: 'fixture_player',
  full_name: 'Fixture Player',
  age: 23,
  country: 'Portugal',
  role: PlayerRole.FLEX,
  team_id: 0, // overridden by givenPlayerExists
  player_attributes: TEST_PLAYER_ATTRIBUTES,
}

/**
 * GIVEN: a player exists in the database for the given team.
 * Creates a player via the bulk endpoint and returns it.
 */
export const givenPlayerExists = async (teamId: number, overrides: Partial<PlayerApiModel> = {}): Promise<PlayerApiModel> => {
  const players = await apiClient.default.createPlayersBulk([{
    ...TEST_PLAYER,
    team_id: teamId,
    ...overrides,
  }])
  return players[0]
}

/**
 * Cleanup helper — deletes a player by id.
 */
export const cleanupPlayer = async (playerId: number | undefined): Promise<void> => {
  if (playerId) await apiClient.default.deletePlayer(playerId)
}

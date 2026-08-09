import { GameApiModel, ItemsWithPagination_MatchApiModel_, MatchApiModel } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER_ATTRIBUTES } from '@tests/api/common-players'
import { givenTournamentExists, cleanupTournament } from '@tests/api/common-tournaments'

const PLAYERS_PER_TEAM = 5

/**
 * A fully played match fixture: two teams, their rosters, and the match whose
 * games have all been simulated. Stats endpoints have real data to aggregate.
 */
export interface PlayedMatchFixture {
  tournamentId: number
  matchId: number
  team1Id: number
  team2Id: number
  team1PlayerIds: number[]
  team2PlayerIds: number[]
}

/**
 * GIVEN: two teams with full rosters have played every game of a match.
 * Creates the teams, players and tournament, then plays each game of the first
 * scheduled match so player and team stats are non-zero.
 *
 * @param prefix Short unique prefix so team short_names and player nicknames do
 *               not collide with fixtures from other test files.
 * @returns The created ids, for assertions and cleanup.
 */
export const givenPlayedMatchExists = async (prefix: string): Promise<PlayedMatchFixture> => {
  const team1 = await givenTeamExists({ short_name: `${prefix}1`, full_name: `${prefix} Team 1`, country: 'Brazil' })
  const team2 = await givenTeamExists({ short_name: `${prefix}2`, full_name: `${prefix} Team 2`, country: 'Argentina' })
  const team1Id = team1.id!
  const team2Id = team2.id!

  const team1PlayerIds: number[] = []
  const team2PlayerIds: number[] = []
  for (let i = 1; i <= PLAYERS_PER_TEAM; i++) {
    const p1 = await givenPlayerExists(team1Id, { nickname: `${prefix}1_player${i}`, player_attributes: TEST_PLAYER_ATTRIBUTES })
    const p2 = await givenPlayerExists(team2Id, { nickname: `${prefix}2_player${i}`, player_attributes: TEST_PLAYER_ATTRIBUTES })
    team1PlayerIds.push(p1.id!)
    team2PlayerIds.push(p2.id!)
  }

  const tournament = await givenTournamentExists([team1Id, team2Id])
  const tournamentId = tournament.id!

  const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
  const matchId = schedule.items[0].id!

  const games = await apiClient.default.getGamesByMatch(matchId) as GameApiModel[]
  for (const game of games) {
    await apiClient.default.playGame(game.id!)
  }

  return { tournamentId, matchId, team1Id, team2Id, team1PlayerIds, team2PlayerIds }
}

/**
 * Cleanup helper — removes the tournament, players and teams created by
 * givenPlayedMatchExists. Matches and games cascade from the tournament.
 */
export const cleanupPlayedMatch = async (fixture: PlayedMatchFixture): Promise<void> => {
  await cleanupTournament(fixture.tournamentId)
  for (const id of [...fixture.team1PlayerIds, ...fixture.team2PlayerIds]) {
    await cleanupPlayer(id)
  }
  await cleanupTeam(fixture.team1Id)
  await cleanupTeam(fixture.team2Id)
}

/**
 * Reads the match back from the API so tests can assert against its winner.
 *
 * @param matchId The match to fetch.
 */
export const getPlayedMatch = async (matchId: number): Promise<MatchApiModel> => {
  return await apiClient.default.getMatch(matchId) as MatchApiModel
}

/**
 * Rounds a ratio to a percentage the same way the services are expected to.
 * Used to assert the reported winrate is a correctly rounded percentage rather
 * than a percentage quantised to whole numbers by rounding before scaling.
 *
 * @param won Numerator — matches or maps won.
 * @param played Denominator — matches or maps played.
 */
export const expectedPercentage = (won: number, played: number): number => {
  if (played === 0) return 0
  return parseFloat(((won / played) * 100).toFixed(2))
}

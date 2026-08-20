import { TeamApiModel } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'
import { givenTournamentExists, cleanupTournament, TEST_TOURNAMENT } from '@tests/api/common-tournaments'

/**
 * Real country with no bootstrap teams, so these fixtures stay isolated. Each
 * suite claims its own: the teams suite counts the teams in Antarctica, and
 * sharing it would make its pagination and filter assertions depend on this
 * file's fixtures.
 */
const TOURNAMENT_FIXTURE_COUNTRY = 'Greenland'

describe('Tournaments', () => {
  let teamOne: TeamApiModel
  let teamTwo: TeamApiModel
  const createdTournamentIds: number[] = []

  beforeAll(async () => {
    // GIVEN: two teams that can be entered into a tournament
    teamOne = await givenTeamExists({
      short_name: 'TRNA',
      full_name: 'Tournament Fixture Team A',
      country: TOURNAMENT_FIXTURE_COUNTRY,
    })
    teamTwo = await givenTeamExists({
      short_name: 'TRNB',
      full_name: 'Tournament Fixture Team B',
      country: TOURNAMENT_FIXTURE_COUNTRY,
    })
  })

  afterAll(async () => {
    for (const id of createdTournamentIds) await cleanupTournament(id)
    await cleanupTeam(teamOne?.id)
    await cleanupTeam(teamTwo?.id)
  })

  it('enters the teams when they are sent as ids', async () => {
    // WHEN: a tournament is created with team ids
    const tournament = await givenTournamentExists([teamOne.id!, teamTwo.id!])
    createdTournamentIds.push(tournament.id!)

    // THEN: both teams are entered
    const stored = await apiClient.default.getTournament(tournament.id!)
    expect(stored.teams?.map(team => (team as TeamApiModel).id).sort()).toEqual(
      [teamOne.id, teamTwo.id].sort(),
    )
  })

  it('enters the teams when they are sent as whole objects', async () => {
    // GIVEN: the teams as the ui sends them — whole objects rather than ids.
    // The contract allows either, and a request body is plain json, so an
    // `instanceof` check against the model class cannot distinguish them.
    const tournament = await givenTournamentExists([], { teams: [teamOne, teamTwo] })
    createdTournamentIds.push(tournament.id!)

    // THEN: the tournament is created and both teams are entered
    const stored = await apiClient.default.getTournament(tournament.id!)
    expect(stored.teams?.map(team => (team as TeamApiModel).id).sort()).toEqual(
      [teamOne.id, teamTwo.id].sort(),
    )
  })

  it('replaces the entered teams when updated with whole objects', async () => {
    // GIVEN: a tournament holding both teams
    const tournament = await givenTournamentExists([teamOne.id!, teamTwo.id!])
    createdTournamentIds.push(tournament.id!)

    // WHEN: it is updated down to a single team, sent as an object
    await apiClient.default.updateTournament(tournament.id!, {
      ...TEST_TOURNAMENT,
      started: false,
      ended: false,
      teams: [teamOne],
    })

    // THEN: only that team remains
    const stored = await apiClient.default.getTournament(tournament.id!)
    expect(stored.teams?.map(team => (team as TeamApiModel).id)).toEqual([teamOne.id])
  })
})

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { cleanupTeam, givenTeamExists } from '@tests/api/common-teams'
import { cleanupTournament, givenTournamentExists } from '@tests/api/common-tournaments'
import { apiClient } from '@tests/setup'

const PAGE_SIZE = 2
const WHOLE_LIST = 100

describe('Global tournament pagination with persistent bootstrap data', () => {
  const teamIds: number[] = []
  const tournamentIds: number[] = []

  beforeAll(async () => {
    for (let fixtureNumber = 1; fixtureNumber <= 2; fixtureNumber += 1) {
      const team = await givenTeamExists({
        short_name: `PGFIX${fixtureNumber}`,
        full_name: `Pagination Fixture Team ${fixtureNumber}`,
        country: fixtureNumber === 1 ? 'Brazil' : 'Argentina',
      })
      teamIds.push(team.id!)
    }

    for (let fixtureNumber = 1; fixtureNumber <= 2; fixtureNumber += 1) {
      const tournament = await givenTournamentExists(teamIds, {
        name: `Pagination Fixture Tournament ${fixtureNumber}`,
        description: `Strict pagination fixture ${fixtureNumber}`,
      })
      tournamentIds.push(tournament.id!)
    }
  })

  afterAll(async () => {
    for (const tournamentId of tournamentIds) {
      await cleanupTournament(tournamentId)
    }
    for (const teamId of teamIds) {
      await cleanupTeam(teamId)
    }
  })

  it('GET /tournaments applies limit and offset to the exact stable ordering', async () => {
    const everything = await apiClient.default.getTournaments(WHOLE_LIST, 0)
    const firstPage = await apiClient.default.getTournaments(PAGE_SIZE, 0)
    const secondPage = await apiClient.default.getTournaments(PAGE_SIZE, PAGE_SIZE)
    const pastEnd = await apiClient.default.getTournaments(PAGE_SIZE, everything.total)

    expect(everything.items.map(tournament => tournament.id)).toEqual(expect.arrayContaining(tournamentIds))
    expect({ items: firstPage.items.map(tournament => tournament.id), total: firstPage.total }).toEqual({
      items: everything.items.slice(0, PAGE_SIZE).map(tournament => tournament.id),
      total: everything.total,
    })
    expect({ items: secondPage.items.map(tournament => tournament.id), total: secondPage.total }).toEqual({
      items: everything.items.slice(PAGE_SIZE, PAGE_SIZE * 2).map(tournament => tournament.id),
      total: everything.total,
    })
    expect(pastEnd).toEqual({ items: [], total: everything.total })
  })
})

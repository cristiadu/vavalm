import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  AllPlayerStats,
  ItemsWithPagination_AllPlayerStats_,
  ItemsWithPagination_TeamStats_,
  ItemsWithPagination_TournamentApiModel_,
  TeamStats,
} from '@tests/generated/api'
import { cleanupPlayer, givenPlayerExists } from '@tests/api/common-players'
import { cleanupTeam, givenTeamExists } from '@tests/api/common-teams'
import { cleanupTournament, givenTournamentExists } from '@tests/api/common-tournaments'
import { apiClient } from '@tests/setup'

const PAGE_SIZE = 2
const WHOLE_LIST = 100

describe('Global pagination without concurrent mutations', () => {
  const teamIds: number[] = []
  const playerIds: number[] = []
  const tournamentIds: number[] = []

  beforeAll(async () => {
    for (let fixtureNumber = 1; fixtureNumber <= 2; fixtureNumber += 1) {
      const team = await givenTeamExists({
        short_name: `PGFIX${fixtureNumber}`,
        full_name: `Pagination Fixture Team ${fixtureNumber}`,
        country: 'Pagination Fixture Country',
      })
      teamIds.push(team.id!)

      const player = await givenPlayerExists(team.id!, {
        nickname: `pagination_fixture_player_${fixtureNumber}`,
        full_name: `Pagination Fixture Player ${fixtureNumber}`,
      })
      playerIds.push(player.id!)
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
    for (const playerId of playerIds) {
      await cleanupPlayer(playerId)
    }
    for (const teamId of teamIds) {
      await cleanupTeam(teamId)
    }
  })

  it('returns exact tournament pages from one stable ordering', async () => {
    const everything = await apiClient.default.getTournaments(WHOLE_LIST, 0) as ItemsWithPagination_TournamentApiModel_
    const firstPage = await apiClient.default.getTournaments(PAGE_SIZE, 0) as ItemsWithPagination_TournamentApiModel_
    const secondPage = await apiClient.default.getTournaments(PAGE_SIZE, PAGE_SIZE) as ItemsWithPagination_TournamentApiModel_
    const pastEnd = await apiClient.default.getTournaments(PAGE_SIZE, everything.total) as ItemsWithPagination_TournamentApiModel_

    expect(everything.items.map(tournament => tournament.id)).toEqual(expect.arrayContaining(tournamentIds))
    expect(firstPage).toEqual({ items: everything.items.slice(0, PAGE_SIZE), total: everything.total })
    expect(secondPage).toEqual({ items: everything.items.slice(PAGE_SIZE, PAGE_SIZE * 2), total: everything.total })
    expect(pastEnd).toEqual({ items: [], total: everything.total })
  })

  it('returns exact player leaderboard pages from one stable ordering', async () => {
    const everything = await apiClient.default.getPlayersStats(WHOLE_LIST, 0) as ItemsWithPagination_AllPlayerStats_
    const firstPage = await apiClient.default.getPlayersStats(PAGE_SIZE, 0) as ItemsWithPagination_AllPlayerStats_
    const secondPage = await apiClient.default.getPlayersStats(PAGE_SIZE, PAGE_SIZE) as ItemsWithPagination_AllPlayerStats_
    const pastEnd = await apiClient.default.getPlayersStats(PAGE_SIZE, everything.total) as ItemsWithPagination_AllPlayerStats_

    expect(everything.items.map((stats: AllPlayerStats) => stats.player.id)).toEqual(expect.arrayContaining(playerIds))
    expect(firstPage).toEqual({ items: everything.items.slice(0, PAGE_SIZE), total: everything.total })
    expect(secondPage).toEqual({ items: everything.items.slice(PAGE_SIZE, PAGE_SIZE * 2), total: everything.total })
    expect(pastEnd).toEqual({ items: [], total: everything.total })
  })

  it('returns exact team leaderboard pages from one stable ordering', async () => {
    const everything = await apiClient.default.getTeamsStats(WHOLE_LIST, 0) as ItemsWithPagination_TeamStats_
    const firstPage = await apiClient.default.getTeamsStats(PAGE_SIZE, 0) as ItemsWithPagination_TeamStats_
    const secondPage = await apiClient.default.getTeamsStats(PAGE_SIZE, PAGE_SIZE) as ItemsWithPagination_TeamStats_
    const pastEnd = await apiClient.default.getTeamsStats(PAGE_SIZE, everything.total) as ItemsWithPagination_TeamStats_

    expect(everything.items.map((stats: TeamStats) => stats.team.id)).toEqual(expect.arrayContaining(teamIds))
    expect(firstPage).toEqual({ items: everything.items.slice(0, PAGE_SIZE), total: everything.total })
    expect(secondPage).toEqual({ items: everything.items.slice(PAGE_SIZE, PAGE_SIZE * 2), total: everything.total })
    expect(pastEnd).toEqual({ items: [], total: everything.total })
  })
})

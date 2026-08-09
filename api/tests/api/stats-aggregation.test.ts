import { AllPlayerStats, TeamStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenPlayedMatchExists, cleanupPlayedMatch, PlayedMatchFixture } from '@tests/api/common-stats'
import { HOOK_TIMEOUT_MS, waitForCondition } from '@tests/api/common-utils'

/** Large enough to hold every team and player the suite could encounter. */
const WHOLE_LIST = 500
/** Page size used for the pagination checks. */
const PAGE_SIZE = 5
/** Long enough to outlast a stats cache entry populated before the fixture existed. */
const FIXTURE_VISIBLE_TIMEOUT_MS = 60_000
/** How often to re-read the leaderboard while waiting for the fixture to appear. */
const FIXTURE_POLL_EVERY_MS = 2_000

describe('Stats aggregation', () => {
  // GIVEN two full rosters that have played every game of one match
  let fixture: PlayedMatchFixture
  let allTeams: TeamStats[]
  let allPlayers: AllPlayerStats[]

  beforeAll(async () => {
    fixture = await givenPlayedMatchExists('AGGR')

    // The leaderboards are cached, so wait until the fixture's played match is
    // reflected rather than assuming invalidation has already happened. The
    // team appears as soon as it is created, so presence alone is not enough —
    // wait for its maps to show up.
    await waitForCondition(async () => {
      const page = await apiClient.default.getTeamsStats(WHOLE_LIST, 0)
      const listed = (page.items as TeamStats[]).find(entry => entry.team.id === fixture.match.team1_id)
      return listed !== undefined && listed.totalMapsPlayed > 0
    }, FIXTURE_VISIBLE_TIMEOUT_MS, FIXTURE_POLL_EVERY_MS)

    allTeams = (await apiClient.default.getTeamsStats(WHOLE_LIST, 0)).items as TeamStats[]
    allPlayers = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]
  }, HOOK_TIMEOUT_MS.PLAYED_MATCH_FIXTURE)

  afterAll(async () => {
    await cleanupPlayedMatch(fixture)
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)

  // ── Agreement with the per-entity endpoints ───────────────────────────────

  describe('agrees with the single-entity stats endpoints', () => {
    it('reports the same team totals as GET /teams/:id/stats', async () => {
      for (const teamId of [fixture.match.team1_id, fixture.match.team2_id]) {
        const single = await apiClient.default.getTeamStats(teamId) as TeamStats
        const listed = allTeams.find(entry => entry.team.id === teamId)

        expect(listed).toBeDefined()
        expect(listed!.totalMapsPlayed).toBe(single.totalMapsPlayed)
        expect(listed!.totalMapsWon).toBe(single.totalMapsWon)
        expect(listed!.totalMapsLost).toBe(single.totalMapsLost)
        expect(listed!.totalMatchesPlayed).toBe(single.totalMatchesPlayed)
        expect(listed!.totalMatchesWon).toBe(single.totalMatchesWon)
        expect(listed!.totalMatchesLost).toBe(single.totalMatchesLost)
        expect(listed!.tournamentsParticipated).toBe(single.tournamentsParticipated)
        expect(listed!.tournamentsWon).toBe(single.tournamentsWon)
        expect(listed!.winrate).toBe(single.winrate)
        expect(listed!.mapWinrate).toBe(single.mapWinrate)
      }
    })

    it('reports the same player counts as GET /players/:id/stats', async () => {
      const players = [...fixture.team1Players, ...fixture.team2Players]
      for (const player of players) {
        const single = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats
        const listed = allPlayers.find(entry => entry.player.id === player.id)

        expect(listed).toBeDefined()
        expect(listed!.totalMapsPlayed).toBe(single.totalMapsPlayed)
        expect(listed!.totalMapsWon).toBe(single.totalMapsWon)
        expect(listed!.totalMapsLost).toBe(single.totalMapsLost)
        expect(listed!.totalMatchesPlayed).toBe(single.totalMatchesPlayed)
        expect(listed!.totalMatchesWon).toBe(single.totalMatchesWon)
        expect(listed!.totalMatchesLost).toBe(single.totalMatchesLost)
        expect(listed!.totalKills).toBe(single.totalKills)
        expect(listed!.totalDeaths).toBe(single.totalDeaths)
        expect(listed!.totalAssists).toBe(single.totalAssists)
        expect(listed!.kda).toBe(single.kda)
      }
    })
  })

  // ── Ordering ──────────────────────────────────────────────────────────────

  describe('leaderboard ordering', () => {
    it('orders teams by the leaderboard criteria in priority order', () => {
      for (let position = 1; position < allTeams.length; position++) {
        const previous = allTeams[position - 1]
        const current = allTeams[position]
        const criteria: [number, number][] = [
          [previous.tournamentsWon, current.tournamentsWon],
          [previous.winrate, current.winrate],
          [previous.mapWinrate, current.mapWinrate],
          [previous.totalMatchesWon, current.totalMatchesWon],
          [previous.totalMapsWon, current.totalMapsWon],
        ]

        const firstDifference = criteria.find(([earlier, later]) => earlier !== later)
        if (firstDifference) {
          expect(firstDifference[0]).toBeGreaterThan(firstDifference[1])
        }
      }
    })

    it('orders players by the leaderboard criteria in priority order', () => {
      for (let position = 1; position < allPlayers.length; position++) {
        const previous = allPlayers[position - 1]
        const current = allPlayers[position]
        const criteria: [number, number][] = [
          [previous.kda, current.kda],
          [previous.totalKills, current.totalKills],
          [previous.winrate, current.winrate],
          [previous.mapWinrate, current.mapWinrate],
          [previous.totalAssists, current.totalAssists],
        ]

        const firstDifference = criteria.find(([earlier, later]) => earlier !== later)
        if (firstDifference) {
          expect(firstDifference[0]).toBeGreaterThan(firstDifference[1])
        }
      }
    })
  })

  // ── Pagination ────────────────────────────────────────────────────────────

  describe('pagination', () => {
    // Other suites create and delete entities in parallel, so each test reads
    // the full list and the page together rather than comparing against a
    // snapshot taken in beforeAll.
    it('returns a team page matching that slice of the full ordering', async () => {
      const everything = await apiClient.default.getTeamsStats(WHOLE_LIST, 0)
      const page = await apiClient.default.getTeamsStats(PAGE_SIZE, PAGE_SIZE)
      const expected = (everything.items as TeamStats[]).slice(PAGE_SIZE, PAGE_SIZE * 2)

      expect((page.items as TeamStats[]).map(entry => entry.team.id)).toEqual(expected.map(entry => entry.team.id))
    })

    it('returns a player page matching that slice of the full ordering', async () => {
      const everything = await apiClient.default.getPlayersStats(WHOLE_LIST, 0)
      const page = await apiClient.default.getPlayersStats(PAGE_SIZE, PAGE_SIZE)
      const expected = (everything.items as AllPlayerStats[]).slice(PAGE_SIZE, PAGE_SIZE * 2)

      expect((page.items as AllPlayerStats[]).map(entry => entry.player.id)).toEqual(expected.map(entry => entry.player.id))
    })

    it('reports a total independent of the requested page size', async () => {
      const singleRow = await apiClient.default.getTeamsStats(1, 0)
      const everything = await apiClient.default.getTeamsStats(WHOLE_LIST, 0)

      expect(singleRow.total).toBe(everything.total)
      expect(singleRow.items).toHaveLength(1)
      expect(everything.items.length).toBe(everything.total)
    })

    it('returns an empty page past the end without changing the total', async () => {
      const everything = await apiClient.default.getPlayersStats(WHOLE_LIST, 0)
      const page = await apiClient.default.getPlayersStats(PAGE_SIZE, everything.total + PAGE_SIZE)

      expect(page.items).toHaveLength(0)
      expect(page.total).toBe(everything.total)
    })
  })

  // ── Payload ───────────────────────────────────────────────────────────────

  describe('payload', () => {
    it('lists every fixture team and player', () => {
      for (const teamId of [fixture.match.team1_id, fixture.match.team2_id]) {
        expect(allTeams.some(entry => entry.team.id === teamId)).toBe(true)
      }
      for (const player of [...fixture.team1Players, ...fixture.team2Players]) {
        expect(allPlayers.some(entry => entry.player.id === player.id)).toBe(true)
      }
    })

    it('still embeds the player team so the ui needs no second call', () => {
      const listed = allPlayers.find(entry => entry.player.id === fixture.team1Players[0].id)!

      expect(listed.team).toBeDefined()
      expect(listed.team!.id).toBe(fixture.match.team1_id)
    })
  })
})

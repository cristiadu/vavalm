import { AllPlayerStats, PlayerApiModel, TeamStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import {
  givenPlayedMatchExists,
  cleanupPlayedMatch,
  splitByMatchResult,
  PlayedMatchFixture,
} from '@tests/api/common-stats'
import { formatPercentage, HOOK_TIMEOUT_MS } from '@tests/api/common-utils'

/** Every fixture player took part in exactly one match: the one that was played. */
const MATCHES_PLAYED = 1
/** Large enough to hold every player the suite could encounter. */
const WHOLE_LIST = 500
/** Page size used for the pagination checks. */
const PAGE_SIZE = 5
/**
 * Players other suites may create or delete between two reads. Nothing is
 * cached, so each read sees live data and two reads need not agree exactly.
 */
const TOTAL_DRIFT_TOLERANCE = 40

describe('GET /players/:id/stats', () => {
  // GIVEN two full rosters that have played every game of one match
  let fixture: PlayedMatchFixture
  let allPlayers: PlayerApiModel[]

  beforeAll(async () => {
    fixture = await givenPlayedMatchExists('PSTATS')
    allPlayers = [...fixture.team1Players, ...fixture.team2Players]
  }, HOOK_TIMEOUT_MS.PLAYED_MATCH_FIXTURE)

  afterAll(async () => {
    await cleanupPlayedMatch(fixture)
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)

  // ── Identity ──────────────────────────────────────────────────────────────

  describe('player identity', () => {
    it('returns the requested player with their team embedded', async () => {
      const player = fixture.team1Players[0]

      const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

      expect(stats.player.id).toBe(player.id)
      expect(stats.player.nickname).toBe(player.nickname)
      expect(stats.player.role).toBe(player.role)
      expect(stats.team).toBeDefined()
      expect(stats.team!.id).toBe(fixture.match.team1_id)
    })
  })

  // ── Totals ────────────────────────────────────────────────────────────────

  describe('match and map totals', () => {
    it('counts the single played match for every player on both sides', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        expect(stats.totalMatchesPlayed).toBe(MATCHES_PLAYED)
        // A match is a best-of, so the number of maps depends on how it went.
        expect(stats.totalMapsPlayed).toBeGreaterThan(0)
      }
    })

    it('splits matches and maps into wins and losses that add back up', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        expect(stats.totalMatchesWon + stats.totalMatchesLost).toBe(stats.totalMatchesPlayed)
        expect(stats.totalMapsWon + stats.totalMapsLost).toBe(stats.totalMapsPlayed)
      }
    })

    it('records the match as won for one side and lost for the other', async () => {
      const { winningPlayers, losingPlayers } = splitByMatchResult(fixture)

      for (const player of winningPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats
        expect(stats.totalMatchesWon).toBe(MATCHES_PLAYED)
        expect(stats.totalMatchesLost).toBe(0)
      }

      for (const player of losingPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats
        expect(stats.totalMatchesWon).toBe(0)
        expect(stats.totalMatchesLost).toBe(MATCHES_PLAYED)
      }
    })

    it('reports non-negative kill, death and assist totals', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        expect(stats.totalKills).toBeGreaterThanOrEqual(0)
        expect(stats.totalDeaths).toBeGreaterThanOrEqual(0)
        expect(stats.totalAssists).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // ── Derived percentages ───────────────────────────────────────────────────

  describe('derived percentages', () => {
    it('reports winrate as the match ratio scaled to a percentage', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        expect(stats.winrate).toBe(formatPercentage(stats.totalMatchesWon, stats.totalMatchesPlayed))
      }
    })

    it('reports mapWinrate as the map ratio scaled to a percentage', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        expect(stats.mapWinrate).toBe(formatPercentage(stats.totalMapsWon, stats.totalMapsPlayed))
      }
    })

    it('rounds percentages to two decimals rather than to whole percents', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        // Scaling before rounding keeps two decimals intact. Rounding the ratio
        // first quantises to whole percents and reintroduces float artefacts
        // such as 67.00000000000001.
        for (const percentage of [stats.winrate, stats.mapWinrate]) {
          expect(Number(percentage.toFixed(2))).toBe(percentage)
        }
      }
    })

    it('keeps percentages within the 0 to 100 range', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        for (const percentage of [stats.winrate, stats.mapWinrate]) {
          expect(percentage).toBeGreaterThanOrEqual(0)
          expect(percentage).toBeLessThanOrEqual(100)
        }
      }
    })

    it('reports kda as (kills + assists) / deaths, or 0 without deaths', async () => {
      for (const player of allPlayers) {
        const stats = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats

        const expected = stats.totalDeaths === 0
          ? 0
          : parseFloat(((stats.totalKills + stats.totalAssists) / stats.totalDeaths).toFixed(2))
        expect(stats.kda).toBe(expected)
      }
    })
  })

  // ── Result attribution ────────────────────────────────────────────────────

  describe('result attribution', () => {
    it('decides the match in favour of one of the two fixture teams', () => {
      expect(fixture.match.winner_id).toBeTruthy()
      expect([fixture.match.team1_id, fixture.match.team2_id]).toContain(fixture.match.winner_id)
    })

    it('agrees with the team stats for the same match', async () => {
      const { winningTeamId, winningPlayers } = splitByMatchResult(fixture)
      const teamStats = await apiClient.default.getTeamStats(winningTeamId) as TeamStats
      const playerStats = await apiClient.default.getPlayerStats(winningPlayers[0].id!) as AllPlayerStats

      expect(playerStats.totalMatchesWon).toBe(teamStats.totalMatchesWon)
      expect(playerStats.totalMapsWon).toBe(teamStats.totalMapsWon)
      expect(playerStats.totalMapsPlayed).toBe(teamStats.totalMapsPlayed)
    })

    it('keeps map wins attributed to the side the player played on', async () => {
      const { winningPlayers, losingPlayers } = splitByMatchResult(fixture)
      const winner = await apiClient.default.getPlayerStats(winningPlayers[0].id!) as AllPlayerStats
      const loser = await apiClient.default.getPlayerStats(losingPlayers[0].id!) as AllPlayerStats

      // Both sides played the same maps, so their counts must complement.
      expect(winner.totalMapsPlayed).toBe(loser.totalMapsPlayed)
      expect(winner.totalMapsWon).toBe(loser.totalMapsLost)
      expect(winner.totalMapsLost).toBe(loser.totalMapsWon)
    })

    it('keeps a played result with the team the player played for after a transfer', async () => {
      const { winningTeamId, losingTeamId, winningPlayers } = splitByMatchResult(fixture)
      const transferring = winningPlayers[0]
      const before = await apiClient.default.getPlayerStats(transferring.id!) as AllPlayerStats
      const player = await apiClient.default.getPlayer(transferring.id!) as PlayerApiModel

      // WHEN the player transfers to the team they just beat
      await apiClient.default.updatePlayer(transferring.id!, { ...player, team_id: losingTeamId })

      try {
        const after = await apiClient.default.getPlayerStats(transferring.id!) as AllPlayerStats

        // THEN the already-played match is still a win, because the side played
        // is stored per game rather than read from the player's current team.
        expect(after.totalMatchesWon).toBe(before.totalMatchesWon)
        expect(after.totalMatchesLost).toBe(before.totalMatchesLost)
        expect(after.totalMapsWon).toBe(before.totalMapsWon)
        expect(after.totalMapsLost).toBe(before.totalMapsLost)
        expect(after.winrate).toBe(before.winrate)
        expect(after.mapWinrate).toBe(before.mapWinrate)
      } finally {
        await apiClient.default.updatePlayer(transferring.id!, { ...player, team_id: winningTeamId })
      }
    })
  })

  // ── GET /players/stats (leaderboard) ──────────────────────────────────────

  describe('leaderboard', () => {
    it('lists every fixture player with the same totals as the per-player endpoint', async () => {
      const listed = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]

      for (const player of allPlayers) {
        const single = await apiClient.default.getPlayerStats(player.id!) as AllPlayerStats
        const entry = listed.find(item => item.player.id === player.id)

        expect(entry).toBeDefined()
        expect(entry!.totalMapsPlayed).toBe(single.totalMapsPlayed)
        expect(entry!.totalMapsWon).toBe(single.totalMapsWon)
        expect(entry!.totalMapsLost).toBe(single.totalMapsLost)
        expect(entry!.totalMatchesPlayed).toBe(single.totalMatchesPlayed)
        expect(entry!.totalMatchesWon).toBe(single.totalMatchesWon)
        expect(entry!.totalMatchesLost).toBe(single.totalMatchesLost)
        expect(entry!.totalKills).toBe(single.totalKills)
        expect(entry!.totalDeaths).toBe(single.totalDeaths)
        expect(entry!.totalAssists).toBe(single.totalAssists)
        expect(entry!.kda).toBe(single.kda)
        expect(entry!.winrate).toBe(single.winrate)
        expect(entry!.mapWinrate).toBe(single.mapWinrate)
      }
    })

    it('orders players by the leaderboard criteria in priority order', async () => {
      const listed = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]

      for (let position = 1; position < listed.length; position++) {
        const previous = listed[position - 1]
        const current = listed[position]
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

    it('returns a page matching that slice of the full ordering', async () => {
      const everything = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]
      const page = await apiClient.default.getPlayersStats(PAGE_SIZE, PAGE_SIZE)
      const expected = everything.slice(PAGE_SIZE, PAGE_SIZE * 2)

      expect((page.items as AllPlayerStats[]).map(entry => entry.player.id)).toEqual(expected.map(entry => entry.player.id))
    })

    it('reports a total independent of the requested page size', async () => {
      const singleRow = await apiClient.default.getPlayersStats(1, 0)
      const everything = await apiClient.default.getPlayersStats(WHOLE_LIST, 0)

      expect(singleRow.items).toHaveLength(1)
      expect(Math.abs(singleRow.total - everything.total)).toBeLessThanOrEqual(TOTAL_DRIFT_TOLERANCE)
    })

    it('returns an empty page past the end', async () => {
      const everything = await apiClient.default.getPlayersStats(WHOLE_LIST, 0)
      const page = await apiClient.default.getPlayersStats(PAGE_SIZE, everything.total + TOTAL_DRIFT_TOLERANCE)

      expect(page.items).toHaveLength(0)
    })

    it('embeds the player team so the ui needs no second call', async () => {
      const listed = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]
      const entry = listed.find(item => item.player.id === fixture.team1Players[0].id)!

      expect(entry.team).toBeDefined()
      expect(entry.team!.id).toBe(fixture.match.team1_id)
    })
  })

  // ── Freshness ─────────────────────────────────────────────────────────────

  describe('freshness', () => {
    it('reflects the played match without waiting for a cache to expire', async () => {
      const listed = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]
      const entry = listed.find(item => item.player.id === allPlayers[0].id)!

      expect(entry.totalMapsPlayed).toBeGreaterThan(0)
    })

    it('reflects a transfer on the next read', async () => {
      const { winningTeamId, losingTeamId, winningPlayers } = splitByMatchResult(fixture)
      const transferring = winningPlayers[0]
      const player = await apiClient.default.getPlayer(transferring.id!) as PlayerApiModel

      await apiClient.default.updatePlayer(transferring.id!, { ...player, team_id: losingTeamId })

      try {
        const listed = (await apiClient.default.getPlayersStats(WHOLE_LIST, 0)).items as AllPlayerStats[]
        const entry = listed.find(item => item.player.id === transferring.id)!
        expect(entry.team!.id).toBe(losingTeamId)
      } finally {
        await apiClient.default.updatePlayer(transferring.id!, { ...player, team_id: winningTeamId })
      }
    })
  })
})

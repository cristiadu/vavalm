import { AllPlayerStats, PlayerApiModel } from '@tests/generated/api'
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
})

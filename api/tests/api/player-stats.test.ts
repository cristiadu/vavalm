import { AllPlayerStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import {
  givenPlayedMatchExists,
  cleanupPlayedMatch,
  expectedPercentage,
  PlayedMatchFixture,
} from '@tests/api/common-stats'

describe('Player stats percentages', () => {
  let fixture: PlayedMatchFixture
  let allStats: AllPlayerStats[]

  beforeAll(async () => {
    fixture = await givenPlayedMatchExists('PWR')
    const playerIds = [...fixture.team1PlayerIds, ...fixture.team2PlayerIds]
    allStats = await Promise.all(
      playerIds.map(id => apiClient.default.getPlayerStats(id) as Promise<AllPlayerStats>),
    )
  }, 120_000)

  afterAll(async () => {
    await cleanupPlayedMatch(fixture)
  }, 60_000)

  it('reports players as having played the fixture match', () => {
    for (const stats of allStats) {
      expect(stats.totalMatchesPlayed).toBeGreaterThan(0)
      expect(stats.totalMapsPlayed).toBeGreaterThan(0)
    }
  })

  it('reports winrate as the match ratio scaled to a percentage', () => {
    for (const stats of allStats) {
      expect(stats.winrate).toBe(expectedPercentage(stats.totalMatchesWon, stats.totalMatchesPlayed))
    }
  })

  it('reports mapWinrate as the map ratio scaled to a percentage', () => {
    for (const stats of allStats) {
      expect(stats.mapWinrate).toBe(expectedPercentage(stats.totalMapsWon, stats.totalMapsPlayed))
    }
  })

  it('keeps both percentages within 0-100 and free of float artefacts', () => {
    for (const stats of allStats) {
      for (const value of [stats.winrate, stats.mapWinrate]) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
        // Rounding after scaling leaves at most two decimals; rounding the ratio
        // first and then multiplying by 100 reintroduces values like 67.00000000000001.
        expect(Number(value.toFixed(2))).toBe(value)
      }
    }
  })

})

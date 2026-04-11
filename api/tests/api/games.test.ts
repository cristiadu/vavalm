import { AllPlayerStats, ItemsWithPagination_AllPlayerStats_, ItemsWithPagination_TeamStats_, TeamStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it } from 'vitest'

describe('Games - Stats caching and pagination', () => {
  it('GET /players/stats should return a correctly shaped paginated response', async () => {
    const page = await apiClient.default.getPlayersStats(5, 0) as ItemsWithPagination_AllPlayerStats_
    expect(page.items).toBeDefined()
    expect(Array.isArray(page.items)).toBe(true)
    expect(page.items.length).toBeLessThanOrEqual(5)
    expect(typeof page.total).toBe('number')
  })

  it('GET /players/stats second page should differ from first when total > limit', async () => {
    const page1 = await apiClient.default.getPlayersStats(2, 0) as ItemsWithPagination_AllPlayerStats_
    const page2 = await apiClient.default.getPlayersStats(2, 2) as ItemsWithPagination_AllPlayerStats_

    expect(page1.total).toBe(page2.total)

    if (page1.total > 2) {
      const page1Ids = page1.items.map((s: AllPlayerStats) => s.player.id)
      const page2Ids = page2.items.map((s: AllPlayerStats) => s.player.id)
      expect(page1Ids).not.toEqual(page2Ids)
    }
  })

  it('GET /players/stats each item should have numeric kda', async () => {
    const stats = await apiClient.default.getPlayersStats(10, 0) as ItemsWithPagination_AllPlayerStats_
    for (const item of stats.items) {
      expect(typeof item.kda).toBe('number')
      expect(typeof item.totalKills).toBe('number')
      expect(item.player).toBeDefined()
    }
  })

  it('GET /teams/stats should return a correctly shaped paginated response', async () => {
    const page = await apiClient.default.getTeamsStats(5, 0) as ItemsWithPagination_TeamStats_
    expect(page.items).toBeDefined()
    expect(Array.isArray(page.items)).toBe(true)
    expect(page.items.length).toBeLessThanOrEqual(5)
    expect(typeof page.total).toBe('number')
  })

  it('GET /teams/stats second page should differ from first when total > limit', async () => {
    const page1 = await apiClient.default.getTeamsStats(2, 0) as ItemsWithPagination_TeamStats_
    const page2 = await apiClient.default.getTeamsStats(2, 2) as ItemsWithPagination_TeamStats_

    expect(page1.total).toBe(page2.total)

    if (page1.total > 2) {
      const page1Ids = page1.items.map((s: TeamStats) => s.team.id)
      const page2Ids = page2.items.map((s: TeamStats) => s.team.id)
      expect(page1Ids).not.toEqual(page2Ids)
    }
  })

  it('GET /teams/stats each item should have a team object with id', async () => {
    const stats = await apiClient.default.getTeamsStats(10, 0) as ItemsWithPagination_TeamStats_
    for (const item of stats.items) {
      expect(item.team).toBeDefined()
      expect(item.team.id).toBeDefined()
      expect(typeof item.winrate).toBe('number')
    }
  })
})

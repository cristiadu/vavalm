import { ItemsWithPagination_TeamApiModel_, ItemsWithPagination_TeamStats_, TeamApiModel, TeamStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

describe('Teams', () => {
  let createdTeamId: number

  beforeAll(async () => {
    const teams = await apiClient.default.createTeamsBulk([{
      short_name: 'TMTEST',
      full_name: 'Teams Test Team',
      country: 'Brazil',
      description: '',
    }])
    createdTeamId = teams[0].id!
  })

  afterAll(async () => {
    if (createdTeamId) await apiClient.default.deleteTeam(createdTeamId)
  })

  it('GET /teams should return a paginated teams list', async () => {
    const response = await apiClient.default.getTeams() as ItemsWithPagination_TeamApiModel_
    expect(response.items).toBeDefined()
    expect(Array.isArray(response.items)).toBe(true)
    expect(response.total).toBeGreaterThanOrEqual(1)
  })

  it('GET /teams should embed players array in each team', async () => {
    const response = await apiClient.default.getTeams(undefined, 50, 0) as ItemsWithPagination_TeamApiModel_
    const team = response.items.find((t: TeamApiModel) => t.id === createdTeamId)
    expect(team).toBeDefined()
    expect(Array.isArray(team?.players)).toBe(true)
  })

  it('GET /teams/:id should return the correct team with players', async () => {
    const team = await apiClient.default.getTeam(createdTeamId) as TeamApiModel
    expect(team.id).toBe(createdTeamId)
    expect(team.short_name).toBe('TMTEST')
    expect(team.country).toBe('Brazil')
    expect(Array.isArray(team.players)).toBe(true)
  })

  it('GET /teams/:id/stats should return numeric stats', async () => {
    const stats = await apiClient.default.getTeamStats(createdTeamId) as TeamStats
    expect(stats.team.id).toBe(createdTeamId)
    expect(typeof stats.winrate).toBe('number')
    expect(typeof stats.mapWinrate).toBe('number')
    expect(typeof stats.totalMatchesPlayed).toBe('number')
  })

  it('GET /teams/stats should return paginated stats', async () => {
    const stats = await apiClient.default.getTeamsStats(50, 0) as ItemsWithPagination_TeamStats_
    expect(stats.items).toBeDefined()
    expect(Array.isArray(stats.items)).toBe(true)
    expect(typeof stats.total).toBe('number')

    for (const item of stats.items) {
      expect(item.team).toBeDefined()
      expect(item.team.id).toBeDefined()
    }
  })

  it('GET /teams/stats pagination should return correct page size', async () => {
    const page = await apiClient.default.getTeamsStats(1, 0) as ItemsWithPagination_TeamStats_
    expect(page.items.length).toBeLessThanOrEqual(1)
    expect(typeof page.total).toBe('number')
  })
})

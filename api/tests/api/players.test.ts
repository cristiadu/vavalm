import { AllPlayerStats, ItemsWithPagination_AllPlayerStats_, ItemsWithPagination_PlayerApiModel_, PlayerApiModel, PlayerRole } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

describe('Players', () => {
  let createdTeamId: number
  let createdPlayerId: number

  beforeAll(async () => {
    const teams = await apiClient.default.createTeamsBulk([{
      short_name: 'PLTEST',
      full_name: 'Players Test Team',
      country: 'Portugal',
      description: '',
    }])
    createdTeamId = teams[0].id!

    const players = await apiClient.default.createPlayersBulk([{
      nickname: 'test_player_fixture',
      full_name: 'Test Player Fixture',
      age: 22,
      country: 'Portugal',
      role: PlayerRole.FLEX,
      team_id: createdTeamId,
      player_attributes: {
        clutch: 2, awareness: 2, aim: 2, positioning: 2,
        game_reading: 2, resilience: 2, confidence: 2, strategy: 2,
        adaptability: 2, communication: 2, unpredictability: 2,
        game_sense: 2, decision_making: 2, rage_fuel: 2,
        teamwork: 2, utility_usage: 2,
      },
    }])
    createdPlayerId = players[0].id!
  })

  afterAll(async () => {
    if (createdPlayerId) await apiClient.default.deletePlayer(createdPlayerId)
    if (createdTeamId) await apiClient.default.deleteTeam(createdTeamId)
  })

  it('GET /players should return a paginated players list', async () => {
    const response = await apiClient.default.getPlayers() as ItemsWithPagination_PlayerApiModel_
    expect(response.items).toBeDefined()
    expect(Array.isArray(response.items)).toBe(true)
    expect(response.total).toBeGreaterThanOrEqual(1)
  })

  it('GET /players/:id should return the correct player', async () => {
    const player = await apiClient.default.getPlayer(createdPlayerId) as PlayerApiModel
    expect(player.id).toBe(createdPlayerId)
    expect(player.nickname).toBe('test_player_fixture')
    expect(player.team_id).toBe(createdTeamId)
  })

  it('GET /players/:id/stats should return numeric stats', async () => {
    const stats = await apiClient.default.getPlayerStats(createdPlayerId) as AllPlayerStats
    expect(stats.player.id).toBe(createdPlayerId)
    expect(typeof stats.kda).toBe('number')
    expect(typeof stats.winrate).toBe('number')
    expect(typeof stats.totalKills).toBe('number')
  })

  it('GET /players/:id/stats should embed team data', async () => {
    const stats = await apiClient.default.getPlayerStats(createdPlayerId) as AllPlayerStats
    expect(stats.team).toBeDefined()
    expect(stats.team?.id).toBe(createdTeamId)
    expect(stats.team?.short_name).toBe('PLTEST')
  })

  it('GET /players/stats should return paginated stats with embedded team', async () => {
    const stats = await apiClient.default.getPlayersStats(50, 0) as ItemsWithPagination_AllPlayerStats_
    expect(stats.items).toBeDefined()
    expect(Array.isArray(stats.items)).toBe(true)
    expect(stats.total).toBeGreaterThanOrEqual(1)

    const entry = stats.items.find((s: AllPlayerStats) => s.player.id === createdPlayerId)
    expect(entry).toBeDefined()
    expect(entry?.team).toBeDefined()
    expect(entry?.team?.id).toBe(createdTeamId)
  })

  it('GET /players/stats pagination should return correct page size', async () => {
    const page = await apiClient.default.getPlayersStats(1, 0) as ItemsWithPagination_AllPlayerStats_
    expect(page.items.length).toBeLessThanOrEqual(1)
    expect(typeof page.total).toBe('number')
  })
})

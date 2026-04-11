import {
  AllPlayerStats,
  ItemsWithPagination_AllPlayerStats_,
  ItemsWithPagination_PlayerApiModel_,
  PlayerApiModel,
  PlayerRole,
} from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER, TEST_PLAYER_ATTRIBUTES } from './common-players'
import { givenTeamExists, cleanupTeam } from './common-teams'

describe('Players', () => {
  let teamId: number
  let playerId: number

  beforeAll(async () => {
    const team = await givenTeamExists({ short_name: 'PLFIX', full_name: 'Players Fixture Team', country: 'Portugal' })
    teamId = team.id!
    const player = await givenPlayerExists(teamId)
    playerId = player.id!
  })

  afterAll(async () => {
    await cleanupPlayer(playerId)
    await cleanupTeam(teamId)
  })

  // ── GET /players ──────────────────────────────────────────────────────────

  describe('GET /players', () => {
    it('returns a paginated list with correct shape', async () => {
      const response = await apiClient.default.getPlayers() as ItemsWithPagination_PlayerApiModel_
      expect(response.items).toBeDefined()
      expect(Array.isArray(response.items)).toBe(true)
      expect(typeof response.total).toBe('number')
      expect(response.total).toBeGreaterThanOrEqual(1)
    })

    it('respects limit and offset', async () => {
      const all = await apiClient.default.getPlayers(undefined, 100, 0) as ItemsWithPagination_PlayerApiModel_
      if (all.total > 1) {
        const page1 = await apiClient.default.getPlayers(undefined, 1, 0) as ItemsWithPagination_PlayerApiModel_
        const page2 = await apiClient.default.getPlayers(undefined, 1, 1) as ItemsWithPagination_PlayerApiModel_
        expect(page1.items).toHaveLength(1)
        expect(page2.items).toHaveLength(1)
        expect(page1.items[0].id).not.toBe(page2.items[0].id)
        expect(page1.total).toBe(page2.total)
      }
    })

    it('filters by teamId and only returns players from that team', async () => {
      const response = await apiClient.default.getPlayers(teamId, 100, 0) as ItemsWithPagination_PlayerApiModel_
      expect(response.items.length).toBeGreaterThanOrEqual(1)
      for (const player of response.items) {
        expect(player.team_id).toBe(teamId)
      }
    })

    it('each player item has all required fields', async () => {
      const response = await apiClient.default.getPlayers(teamId) as ItemsWithPagination_PlayerApiModel_
      const player = response.items.find(p => p.id === playerId)!
      expect(player).toBeDefined()
      expect(player.id).toBe(playerId)
      expect(player.nickname).toBe(TEST_PLAYER.nickname)
      expect(player.full_name).toBe(TEST_PLAYER.full_name)
      expect(player.age).toBe(TEST_PLAYER.age)
      expect(player.country).toBe(TEST_PLAYER.country)
      expect(player.role).toBe(PlayerRole.FLEX)
      expect(player.team_id).toBe(teamId)
      expect(player.player_attributes).toBeDefined()
    })
  })

  // ── GET /players/:id ──────────────────────────────────────────────────────

  describe('GET /players/:id', () => {
    it('returns the correct player with all fields', async () => {
      const player = await apiClient.default.getPlayer(playerId) as PlayerApiModel
      expect(player.id).toBe(playerId)
      expect(player.nickname).toBe(TEST_PLAYER.nickname)
      expect(player.full_name).toBe(TEST_PLAYER.full_name)
      expect(player.age).toBe(TEST_PLAYER.age)
      expect(player.country).toBe(TEST_PLAYER.country)
      expect(player.role).toBe(PlayerRole.FLEX)
      expect(player.team_id).toBe(teamId)
    })

    it('returns all player_attributes fields with correct values', async () => {
      const player = await apiClient.default.getPlayer(playerId) as PlayerApiModel
      const attrs = player.player_attributes
      expect(attrs.clutch).toBe(TEST_PLAYER_ATTRIBUTES.clutch)
      expect(attrs.awareness).toBe(TEST_PLAYER_ATTRIBUTES.awareness)
      expect(attrs.aim).toBe(TEST_PLAYER_ATTRIBUTES.aim)
      expect(attrs.positioning).toBe(TEST_PLAYER_ATTRIBUTES.positioning)
      expect(attrs.game_reading).toBe(TEST_PLAYER_ATTRIBUTES.game_reading)
      expect(attrs.resilience).toBe(TEST_PLAYER_ATTRIBUTES.resilience)
      expect(attrs.confidence).toBe(TEST_PLAYER_ATTRIBUTES.confidence)
      expect(attrs.strategy).toBe(TEST_PLAYER_ATTRIBUTES.strategy)
      expect(attrs.adaptability).toBe(TEST_PLAYER_ATTRIBUTES.adaptability)
      expect(attrs.communication).toBe(TEST_PLAYER_ATTRIBUTES.communication)
      expect(attrs.unpredictability).toBe(TEST_PLAYER_ATTRIBUTES.unpredictability)
      expect(attrs.game_sense).toBe(TEST_PLAYER_ATTRIBUTES.game_sense)
      expect(attrs.decision_making).toBe(TEST_PLAYER_ATTRIBUTES.decision_making)
      expect(attrs.rage_fuel).toBe(TEST_PLAYER_ATTRIBUTES.rage_fuel)
      expect(attrs.teamwork).toBe(TEST_PLAYER_ATTRIBUTES.teamwork)
      expect(attrs.utility_usage).toBe(TEST_PLAYER_ATTRIBUTES.utility_usage)
    })
  })

  // ── PUT /players/:id ──────────────────────────────────────────────────────

  describe('PUT /players/:id', () => {
    it('updates the player and the change is persisted', async () => {
      const updated = await apiClient.default.updatePlayer(playerId, {
        ...TEST_PLAYER,
        team_id: teamId,
        nickname: 'updated_fixture',
        full_name: 'Updated Fixture Player',
        age: 25,
      }) as PlayerApiModel
      expect(updated.id).toBe(playerId)
      expect(updated.nickname).toBe('updated_fixture')
      expect(updated.full_name).toBe('Updated Fixture Player')
      expect(updated.age).toBe(25)

      // Confirm persistence
      const fetched = await apiClient.default.getPlayer(playerId) as PlayerApiModel
      expect(fetched.nickname).toBe('updated_fixture')
      expect(fetched.age).toBe(25)
    })
  })

  // ── GET /players/:id/stats ────────────────────────────────────────────────

  describe('GET /players/:id/stats', () => {
    it('returns a correctly shaped stats object with all numeric fields', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId) as AllPlayerStats
      expect(stats.player).toBeDefined()
      expect(stats.player.id).toBe(playerId)
      expect(typeof stats.kda).toBe('number')
      expect(typeof stats.winrate).toBe('number')
      expect(typeof stats.mapWinrate).toBe('number')
      expect(typeof stats.totalKills).toBe('number')
      expect(typeof stats.totalDeaths).toBe('number')
      expect(typeof stats.totalAssists).toBe('number')
      expect(typeof stats.totalMatchesPlayed).toBe('number')
      expect(typeof stats.totalMatchesWon).toBe('number')
      expect(typeof stats.totalMatchesLost).toBe('number')
      expect(typeof stats.totalMapsPlayed).toBe('number')
      expect(typeof stats.totalMapsWon).toBe('number')
      expect(typeof stats.totalMapsLost).toBe('number')
    })

    it('embeds team data in the response', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId) as AllPlayerStats
      expect(stats.team).toBeDefined()
      expect(stats.team?.id).toBe(teamId)
      expect(stats.team?.short_name).toBe('PLFIX')
      expect(stats.team?.country).toBe('Portugal')
    })

    it('totalMatchesWon + totalMatchesLost equals totalMatchesPlayed', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId) as AllPlayerStats
      expect(stats.totalMatchesWon + stats.totalMatchesLost).toBe(stats.totalMatchesPlayed)
    })

    it('totalMapsWon + totalMapsLost equals totalMapsPlayed', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId) as AllPlayerStats
      expect(stats.totalMapsWon + stats.totalMapsLost).toBe(stats.totalMapsPlayed)
    })
  })

  // ── GET /players/stats ────────────────────────────────────────────────────

  describe('GET /players/stats', () => {
    it('returns a paginated stats list with correct shape', async () => {
      const stats = await apiClient.default.getPlayersStats(50, 0) as ItemsWithPagination_AllPlayerStats_
      expect(Array.isArray(stats.items)).toBe(true)
      expect(typeof stats.total).toBe('number')
      expect(stats.total).toBeGreaterThanOrEqual(1)
    })

    it('each stats item has all required fields', async () => {
      const stats = await apiClient.default.getPlayersStats(50, 0) as ItemsWithPagination_AllPlayerStats_
      for (const item of stats.items) {
        expect(item.player).toBeDefined()
        expect(item.player.id).toBeDefined()
        expect(typeof item.kda).toBe('number')
        expect(typeof item.winrate).toBe('number')
        expect(typeof item.mapWinrate).toBe('number')
        expect(typeof item.totalKills).toBe('number')
        expect(typeof item.totalDeaths).toBe('number')
        expect(typeof item.totalAssists).toBe('number')
        expect(typeof item.totalMatchesPlayed).toBe('number')
        expect(typeof item.totalMatchesWon).toBe('number')
        expect(typeof item.totalMatchesLost).toBe('number')
        expect(typeof item.totalMapsPlayed).toBe('number')
        expect(typeof item.totalMapsWon).toBe('number')
        expect(typeof item.totalMapsLost).toBe('number')
      }
    })

    it('embeds team data in each stats item', async () => {
      const stats = await apiClient.default.getPlayersStats(50, 0) as ItemsWithPagination_AllPlayerStats_
      const entry = stats.items.find((s: AllPlayerStats) => s.player.id === playerId)
      expect(entry).toBeDefined()
      expect(entry?.team).toBeDefined()
      expect(entry?.team?.id).toBe(teamId)
      expect(entry?.team?.short_name).toBeDefined()
    })

    it('respects limit — page size does not exceed requested limit', async () => {
      const limit = 2
      const page = await apiClient.default.getPlayersStats(limit, 0) as ItemsWithPagination_AllPlayerStats_
      expect(page.items.length).toBeLessThanOrEqual(limit)
    })

    it('pagination offset returns different players with same total', async () => {
      const all = await apiClient.default.getPlayersStats(100, 0) as ItemsWithPagination_AllPlayerStats_
      if (all.total > 2) {
        const page1 = await apiClient.default.getPlayersStats(2, 0) as ItemsWithPagination_AllPlayerStats_
        const page2 = await apiClient.default.getPlayersStats(2, 2) as ItemsWithPagination_AllPlayerStats_
        expect(page1.total).toBe(page2.total)
        const page1Ids = page1.items.map(s => s.player.id)
        const page2Ids = page2.items.map(s => s.player.id)
        expect(page1Ids).not.toEqual(page2Ids)
        // No overlap
        for (const id of page2Ids) {
          expect(page1Ids).not.toContain(id)
        }
      }
    })
  })

  // ── POST /players (single via createPlayer) ───────────────────────────────

  describe('POST /players', () => {
    let singlePlayerId: number

    afterAll(async () => cleanupPlayer(singlePlayerId))

    it('creates a player and returns it with a generated id', async () => {
      const created = await apiClient.default.createPlayer({
        nickname: 'single_create_test',
        full_name: 'Single Create Test',
        age: 20,
        country: 'Brazil',
        role: PlayerRole.DUELIST,
        team_id: teamId,
        player_attributes: TEST_PLAYER_ATTRIBUTES,
      }) as PlayerApiModel
      singlePlayerId = created.id!
      expect(created.id).toBeDefined()
      expect(created.nickname).toBe('single_create_test')
      expect(created.role).toBe(PlayerRole.DUELIST)
      expect(created.team_id).toBe(teamId)
    })
  })
})

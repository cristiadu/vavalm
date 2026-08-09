import {
  PlayerApiModel,
  PlayerRole,
} from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER, TEST_PLAYER_ATTRIBUTES } from '@tests/api/common-players'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'


describe('Players', () => {
  let teamId: number
  let playerId: number
  let paginationPlayerId: number

  beforeAll(async () => {
    const team = await givenTeamExists({ short_name: 'PLFIX', full_name: 'Players Fixture Team', country: 'Portugal' })
    teamId = team.id!
    const player = await givenPlayerExists(teamId)
    playerId = player.id!
    const paginationPlayer = await givenPlayerExists(teamId, { nickname: 'players_fixture_page_2' })
    paginationPlayerId = paginationPlayer.id!
  })

  afterAll(async () => {
    await cleanupPlayer(playerId)
    await cleanupPlayer(paginationPlayerId)
    await cleanupTeam(teamId)
  })

  // ── GET /players ──────────────────────────────────────────────────────────

  describe('GET /players', () => {
    it('returns a paginated list with correct shape', async () => {
      const response = await apiClient.default.getPlayers()
      expect(response.items).toBeDefined()
      expect(Array.isArray(response.items)).toBe(true)
      expect(typeof response.total).toBe('number')
      expect(response.total).toBeGreaterThanOrEqual(1)
    })

    it('respects limit and offset', async () => {
      const all = await apiClient.default.getPlayers(teamId, 100, 0)
      const page1 = await apiClient.default.getPlayers(teamId, 1, 0)
      const page2 = await apiClient.default.getPlayers(teamId, 1, 1)

      expect(all.total).toBe(2)
      expect(all.items.map(player => player.id)).toEqual([playerId, paginationPlayerId])
      expect(page1).toEqual({ items: all.items.slice(0, 1), total: 2 })
      expect(page2).toEqual({ items: all.items.slice(1, 2), total: 2 })
    })

    it('filters by teamId and only returns players from that team', async () => {
      const response = await apiClient.default.getPlayers(teamId, 100, 0)
      expect(response.total).toBe(2)
      expect(response.items.map(player => player.id)).toEqual([playerId, paginationPlayerId])
      for (const player of response.items) {
        expect(player.team_id).toBe(teamId)
      }
    })

    it('each player item has all required fields', async () => {
      const response = await apiClient.default.getPlayers(teamId)
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
      const player = await apiClient.default.getPlayer(playerId)
      expect(player.id).toBe(playerId)
      expect(player.nickname).toBe(TEST_PLAYER.nickname)
      expect(player.full_name).toBe(TEST_PLAYER.full_name)
      expect(player.age).toBe(TEST_PLAYER.age)
      expect(player.country).toBe(TEST_PLAYER.country)
      expect(player.role).toBe(PlayerRole.FLEX)
      expect(player.team_id).toBe(teamId)
    })

    it('returns all player_attributes fields with correct values', async () => {
      const player = await apiClient.default.getPlayer(playerId)
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
      const fetched = await apiClient.default.getPlayer(playerId)
      expect(fetched.nickname).toBe('updated_fixture')
      expect(fetched.age).toBe(25)
    })
  })

  // ── GET /players/:id/stats ────────────────────────────────────────────────

  describe('GET /players/:id/stats', () => {
    it('returns all stats as 0 for a player with no games played', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId)
      expect(stats.player.id).toBe(playerId)
      expect(stats.kda).toBe(0)
      expect(stats.winrate).toBe(0)
      expect(stats.mapWinrate).toBe(0)
      expect(stats.totalKills).toBe(0)
      expect(stats.totalDeaths).toBe(0)
      expect(stats.totalAssists).toBe(0)
      expect(stats.totalMatchesPlayed).toBe(0)
      expect(stats.totalMatchesWon).toBe(0)
      expect(stats.totalMatchesLost).toBe(0)
      expect(stats.totalMapsPlayed).toBe(0)
      expect(stats.totalMapsWon).toBe(0)
      expect(stats.totalMapsLost).toBe(0)
    })

    it('embeds the correct team in the response', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId)
      expect(stats.team?.id).toBe(teamId)
      expect(stats.team?.short_name).toBe('PLFIX')
      expect(stats.team?.country).toBe('Portugal')
    })

    it('totalMatchesWon + totalMatchesLost equals totalMatchesPlayed', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId)
      expect(stats.totalMatchesWon + stats.totalMatchesLost).toBe(stats.totalMatchesPlayed)
    })

    it('totalMapsWon + totalMapsLost equals totalMapsPlayed', async () => {
      const stats = await apiClient.default.getPlayerStats(playerId)
      expect(stats.totalMapsWon + stats.totalMapsLost).toBe(stats.totalMapsPlayed)
    })
  })

  // ── GET /players/stats ────────────────────────────────────────────────────

  describe('GET /players/stats', () => {
    it('returns a paginated stats list with correct shape', async () => {
      const stats = await apiClient.default.getPlayersStats(50, 0)
      expect(Array.isArray(stats.items)).toBe(true)
      expect(typeof stats.total).toBe('number')
      expect(stats.total).toBeGreaterThanOrEqual(1)
    })

    it('fixture player appears with zero stats and correct team embedded', async () => {
      const stats = await apiClient.default.getPlayersStats(200, 0)
      const entry = stats.items.find(item => item.player.id === playerId)
      const single = await apiClient.default.getPlayerStats(playerId)

      expect(entry).toEqual(single)
    })

    it('all items have non-negative stats and embedded player + team', async () => {
      const stats = await apiClient.default.getPlayersStats(50, 0)
      for (const item of stats.items) {
        expect(item.player.id).toBeGreaterThan(0)
        expect(item.kda).toBeGreaterThanOrEqual(0)
        expect(item.winrate).toBeGreaterThanOrEqual(0)
        expect(item.mapWinrate).toBeGreaterThanOrEqual(0)
        expect(item.totalKills).toBeGreaterThanOrEqual(0)
        expect(item.totalDeaths).toBeGreaterThanOrEqual(0)
        expect(item.totalAssists).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesPlayed).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesWon).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesLost).toBeGreaterThanOrEqual(0)
        expect(item.totalMapsPlayed).toBeGreaterThanOrEqual(0)
        expect(item.totalMapsWon).toBeGreaterThanOrEqual(0)
        expect(item.totalMapsLost).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesWon + item.totalMatchesLost).toBe(item.totalMatchesPlayed)
        expect(item.totalMapsWon + item.totalMapsLost).toBe(item.totalMapsPlayed)
      }
    })

    it('respects limit — page size does not exceed requested limit', async () => {
      const limit = 2
      const page = await apiClient.default.getPlayersStats(limit, 0)
      expect(page.items.length).toBeLessThanOrEqual(limit)
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

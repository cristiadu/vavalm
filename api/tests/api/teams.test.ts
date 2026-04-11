import {
  ItemsWithPagination_TeamApiModel_,
  ItemsWithPagination_TeamStats_,
  TeamApiModel,
  TeamStats,
} from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenTeamExists, cleanupTeam, TEST_TEAM } from './common-teams'
import { givenPlayerExists, cleanupPlayer } from './common-players'

describe('Teams', () => {
  let teamId: number
  let playerId: number

  beforeAll(async () => {
    const team = await givenTeamExists()
    teamId = team.id!
    const player = await givenPlayerExists(teamId)
    playerId = player.id!
  })

  afterAll(async () => {
    await cleanupPlayer(playerId)
    await cleanupTeam(teamId)
  })

  // ── GET /teams ─────────────────────────────────────────────────────────────

  describe('GET /teams', () => {
    it('returns a paginated list with correct shape', async () => {
      const response = await apiClient.default.getTeams() as ItemsWithPagination_TeamApiModel_
      expect(Array.isArray(response.items)).toBe(true)
      expect(typeof response.total).toBe('number')
      expect(response.total).toBeGreaterThanOrEqual(1)
    })

    it('embeds a players array in each team', async () => {
      const response = await apiClient.default.getTeams(undefined, 50, 0) as ItemsWithPagination_TeamApiModel_
      const team = response.items.find((t: TeamApiModel) => t.id === teamId)
      expect(team).toBeDefined()
      expect(Array.isArray(team?.players)).toBe(true)
      // Our fixture player must appear in the embedded list
      const embedded = team!.players!.find(p => p.id === playerId)
      expect(embedded).toBeDefined()
      expect(embedded?.team_id).toBe(teamId)
    })

    it('respects limit and offset', async () => {
      const all = await apiClient.default.getTeams(undefined, 100, 0) as ItemsWithPagination_TeamApiModel_
      if (all.total > 1) {
        const page1 = await apiClient.default.getTeams(undefined, 1, 0) as ItemsWithPagination_TeamApiModel_
        const page2 = await apiClient.default.getTeams(undefined, 1, 1) as ItemsWithPagination_TeamApiModel_
        expect(page1.items).toHaveLength(1)
        expect(page2.items).toHaveLength(1)
        expect(page1.items[0].id).not.toBe(page2.items[0].id)
        expect(page1.total).toBe(page2.total)
      }
    })

    it('filters by country', async () => {
      const response = await apiClient.default.getTeams(TEST_TEAM.country, 50, 0) as ItemsWithPagination_TeamApiModel_
      expect(response.items.length).toBeGreaterThanOrEqual(1)
      for (const team of response.items) {
        expect(team.country?.toLowerCase()).toContain(TEST_TEAM.country!.toLowerCase())
      }
    })

    it('each team item has all required fields', async () => {
      const response = await apiClient.default.getTeams(undefined, 50, 0) as ItemsWithPagination_TeamApiModel_
      const team = response.items.find(t => t.id === teamId)!
      expect(team.id).toBe(teamId)
      expect(team.short_name).toBe(TEST_TEAM.short_name)
      expect(team.full_name).toBe(TEST_TEAM.full_name)
      expect(team.country).toBe(TEST_TEAM.country)
      expect(typeof team.description).toBe('string')
    })
  })

  // ── GET /teams/:id ────────────────────────────────────────────────────────

  describe('GET /teams/:id', () => {
    it('returns the correct team with all fields', async () => {
      const team = await apiClient.default.getTeam(teamId) as TeamApiModel
      expect(team.id).toBe(teamId)
      expect(team.short_name).toBe(TEST_TEAM.short_name)
      expect(team.full_name).toBe(TEST_TEAM.full_name)
      expect(team.country).toBe(TEST_TEAM.country)
      expect(typeof team.description).toBe('string')
    })

    it('includes the players array with the fixture player', async () => {
      const team = await apiClient.default.getTeam(teamId) as TeamApiModel
      expect(Array.isArray(team.players)).toBe(true)
      const player = team.players!.find(p => p.id === playerId)
      expect(player).toBeDefined()
      expect(player?.team_id).toBe(teamId)
    })
  })

  // ── GET /teams/:id/players ─────────────────────────────────────────────────

  describe('GET /teams/:id/players', () => {
    it('returns only players belonging to the requested team', async () => {
      const players = await apiClient.default.getTeamPlayers(teamId)
      expect(Array.isArray(players)).toBe(true)
      expect(players.length).toBeGreaterThanOrEqual(1)
      for (const p of players) {
        expect(p.team_id).toBe(teamId)
      }
    })

    it('includes the fixture player with correct fields', async () => {
      const players = await apiClient.default.getTeamPlayers(teamId)
      const player = players.find(p => p.id === playerId)
      expect(player).toBeDefined()
      expect(player?.nickname).toBeDefined()
      expect(player?.role).toBeDefined()
    })
  })

  // ── GET /teams/:id/stats ──────────────────────────────────────────────────

  describe('GET /teams/:id/stats', () => {
    it('returns all stats as 0 for a team with no games played', async () => {
      const stats = await apiClient.default.getTeamStats(teamId) as TeamStats
      expect(stats.team.id).toBe(teamId)
      expect(stats.team.short_name).toBe(TEST_TEAM.short_name)
      expect(stats.winrate).toBe(0)
      expect(stats.mapWinrate).toBe(0)
      expect(stats.totalMatchesPlayed).toBe(0)
      expect(stats.totalMatchesWon).toBe(0)
      expect(stats.totalMatchesLost).toBe(0)
      expect(stats.totalMapsPlayed).toBe(0)
      expect(stats.totalMapsWon).toBe(0)
      expect(stats.totalMapsLost).toBe(0)
      expect(stats.tournamentsWon).toBe(0)
      expect(stats.tournamentsParticipated).toBe(0)
    })

    it('totalMatchesWon + totalMatchesLost equals totalMatchesPlayed', async () => {
      const stats = await apiClient.default.getTeamStats(teamId) as TeamStats
      expect(stats.totalMatchesWon + stats.totalMatchesLost).toBe(stats.totalMatchesPlayed)
    })

    it('totalMapsWon + totalMapsLost equals totalMapsPlayed', async () => {
      const stats = await apiClient.default.getTeamStats(teamId) as TeamStats
      expect(stats.totalMapsWon + stats.totalMapsLost).toBe(stats.totalMapsPlayed)
    })

    it('tournamentsWon does not exceed tournamentsParticipated', async () => {
      const stats = await apiClient.default.getTeamStats(teamId) as TeamStats
      expect(stats.tournamentsWon).toBeLessThanOrEqual(stats.tournamentsParticipated)
    })
  })

  // ── GET /teams/stats ──────────────────────────────────────────────────────

  describe('GET /teams/stats', () => {
    it('returns a paginated stats list with correct shape', async () => {
      const stats = await apiClient.default.getTeamsStats(50, 0) as ItemsWithPagination_TeamStats_
      expect(Array.isArray(stats.items)).toBe(true)
      expect(typeof stats.total).toBe('number')
      expect(stats.total).toBeGreaterThanOrEqual(1)
    })

    it('fixture team appears with zero stats', async () => {
      const stats = await apiClient.default.getTeamsStats(100, 0) as ItemsWithPagination_TeamStats_
      const entry = stats.items.find((s: TeamStats) => s.team.id === teamId)!
      expect(entry).toBeDefined()
      expect(entry.team.short_name).toBe(TEST_TEAM.short_name)
      expect(entry.winrate).toBe(0)
      expect(entry.mapWinrate).toBe(0)
      expect(entry.totalMatchesPlayed).toBe(0)
      expect(entry.totalMatchesWon).toBe(0)
      expect(entry.totalMatchesLost).toBe(0)
      expect(entry.totalMapsPlayed).toBe(0)
      expect(entry.totalMapsWon).toBe(0)
      expect(entry.totalMapsLost).toBe(0)
      expect(entry.tournamentsWon).toBe(0)
      expect(entry.tournamentsParticipated).toBe(0)
    })

    it('all items have non-negative stats and satisfy win+loss invariants', async () => {
      const stats = await apiClient.default.getTeamsStats(50, 0) as ItemsWithPagination_TeamStats_
      for (const item of stats.items) {
        expect(item.team.id).toBeGreaterThan(0)
        expect(item.team.short_name.length).toBeGreaterThan(0)
        expect(item.winrate).toBeGreaterThanOrEqual(0)
        expect(item.mapWinrate).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesPlayed).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesWon).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesLost).toBeGreaterThanOrEqual(0)
        expect(item.totalMapsPlayed).toBeGreaterThanOrEqual(0)
        expect(item.totalMapsWon).toBeGreaterThanOrEqual(0)
        expect(item.totalMapsLost).toBeGreaterThanOrEqual(0)
        expect(item.tournamentsWon).toBeGreaterThanOrEqual(0)
        expect(item.tournamentsParticipated).toBeGreaterThanOrEqual(0)
        expect(item.totalMatchesWon + item.totalMatchesLost).toBe(item.totalMatchesPlayed)
        expect(item.totalMapsWon + item.totalMapsLost).toBe(item.totalMapsPlayed)
        expect(item.tournamentsWon).toBeLessThanOrEqual(item.tournamentsParticipated)
      }
    })

    it('respects limit — page size does not exceed requested limit', async () => {
      const page = await apiClient.default.getTeamsStats(1, 0) as ItemsWithPagination_TeamStats_
      expect(page.items.length).toBeLessThanOrEqual(1)
      expect(page.total).toBeGreaterThanOrEqual(1)
    })

    it('pagination offset returns different teams with same total', async () => {
      const all = await apiClient.default.getTeamsStats(100, 0) as ItemsWithPagination_TeamStats_
      if (all.total > 2) {
        const page1 = await apiClient.default.getTeamsStats(2, 0) as ItemsWithPagination_TeamStats_
        const page2 = await apiClient.default.getTeamsStats(2, 2) as ItemsWithPagination_TeamStats_
        expect(page1.total).toBe(page2.total)
        const page1Ids = page1.items.map(s => s.team.id)
        const page2Ids = page2.items.map(s => s.team.id)
        expect(page1Ids).not.toEqual(page2Ids)
        for (const id of page2Ids) {
          expect(page1Ids).not.toContain(id)
        }
      }
    })

    it('includes the fixture team in the stats list', async () => {
      const stats = await apiClient.default.getTeamsStats(100, 0) as ItemsWithPagination_TeamStats_
      const entry = stats.items.find((s: TeamStats) => s.team.id === teamId)
      expect(entry).toBeDefined()
      expect(entry?.team.short_name).toBe(TEST_TEAM.short_name)
    })
  })
})

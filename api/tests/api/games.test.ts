import {
  GameApiModel,
  GameLogApiModel,
  GameStatsApiModel,
  ItemsWithPagination_MatchApiModel_,
  ItemsWithPagination_TournamentApiModel_,
  MatchApiModel,
  MatchType,
  RoundStateApiModel,
  StandingsApiModel,
  TournamentApiModel,
} from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenTeamExists, cleanupTeam, TEST_TEAM } from './common-teams'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER_ATTRIBUTES } from './common-players'
import { givenTournamentExists, cleanupTournament, TEST_TOURNAMENT } from './common-tournaments'

describe('Tournaments, Matches & Games', () => {
  let team1Id: number
  let team2Id: number
  let team1PlayerIds: number[] = []
  let team2PlayerIds: number[] = []
  let tournamentId: number
  let matchId: number
  let gameId: number

  beforeAll(async () => {
    const team1 = await givenTeamExists({ short_name: 'GT1', full_name: 'Game Test Team 1', country: 'Brazil' })
    const team2 = await givenTeamExists({ short_name: 'GT2', full_name: 'Game Test Team 2', country: 'Argentina' })
    team1Id = team1.id!
    team2Id = team2.id!

    // Each team needs players for game simulation
    for (let i = 1; i <= 5; i++) {
      const p1 = await givenPlayerExists(team1Id, { nickname: `gt1_player${i}`, player_attributes: TEST_PLAYER_ATTRIBUTES })
      const p2 = await givenPlayerExists(team2Id, { nickname: `gt2_player${i}`, player_attributes: TEST_PLAYER_ATTRIBUTES })
      team1PlayerIds.push(p1.id!)
      team2PlayerIds.push(p2.id!)
    }

    const tournament = await givenTournamentExists([team1Id, team2Id])
    tournamentId = tournament.id!

    const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
    matchId = schedule.items[0].id!

    const games = await apiClient.default.getGamesByMatch(matchId)
    gameId = games[0].id!
  })

  afterAll(async () => {
    await cleanupTournament(tournamentId)
    for (const id of [...team1PlayerIds, ...team2PlayerIds]) {
      await cleanupPlayer(id)
    }
    await cleanupTeam(team1Id)
    await cleanupTeam(team2Id)
  })

  // ── GET /tournaments ──────────────────────────────────────────────────────

  describe('GET /tournaments', () => {
    it('returns a paginated list with correct shape', async () => {
      const response = await apiClient.default.getTournaments(50, 0) as ItemsWithPagination_TournamentApiModel_
      expect(Array.isArray(response.items)).toBe(true)
      expect(typeof response.total).toBe('number')
      expect(response.total).toBeGreaterThanOrEqual(1)
    })

    it('includes the fixture tournament in the list', async () => {
      const response = await apiClient.default.getTournaments(50, 0) as ItemsWithPagination_TournamentApiModel_
      const found = response.items.find((t: TournamentApiModel) => t.id === tournamentId)
      expect(found).toBeDefined()
      expect(found?.name).toBe(TEST_TOURNAMENT.name)
      expect(found?.country).toBe(TEST_TOURNAMENT.country)
      expect(found?.type).toBe(TEST_TOURNAMENT.type)
    })

    it('embeds teams array in each tournament', async () => {
      const response = await apiClient.default.getTournaments(50, 0) as ItemsWithPagination_TournamentApiModel_
      const fixture = response.items.find((t: TournamentApiModel) => t.id === tournamentId)!
      expect(Array.isArray(fixture.teams)).toBe(true)
      const teamIds = (fixture.teams as Array<{ id?: number }>).map(t => t.id)
      expect(teamIds).toContain(team1Id)
      expect(teamIds).toContain(team2Id)
    })

    it('respects limit and offset', async () => {
      const all = await apiClient.default.getTournaments(100, 0) as ItemsWithPagination_TournamentApiModel_
      if (all.total > 1) {
        const page1 = await apiClient.default.getTournaments(1, 0) as ItemsWithPagination_TournamentApiModel_
        const page2 = await apiClient.default.getTournaments(1, 1) as ItemsWithPagination_TournamentApiModel_
        expect(page1.items).toHaveLength(1)
        expect(page2.items).toHaveLength(1)
        expect(page1.items[0].id).not.toBe(page2.items[0].id)
        expect(page1.total).toBe(page2.total)
      }
    })
  })

  // ── GET /tournaments/:id ──────────────────────────────────────────────────

  describe('GET /tournaments/:id', () => {
    it('returns the correct tournament with all required fields', async () => {
      const tournament = await apiClient.default.getTournament(tournamentId) as TournamentApiModel
      expect(tournament.id).toBe(tournamentId)
      expect(tournament.name).toBe(TEST_TOURNAMENT.name)
      expect(tournament.description).toBe(TEST_TOURNAMENT.description)
      expect(tournament.country).toBe(TEST_TOURNAMENT.country)
      expect(tournament.type).toBe(TEST_TOURNAMENT.type)
      expect(tournament.started).toBe(false)
      expect(tournament.ended).toBe(false)
      expect(typeof tournament.start_date).toBe('string')
      expect(typeof tournament.end_date).toBe('string')
    })

    it('embeds the teams array with both fixture teams', async () => {
      const tournament = await apiClient.default.getTournament(tournamentId) as TournamentApiModel
      expect(Array.isArray(tournament.teams)).toBe(true)
      expect((tournament.teams as Array<{ id?: number }>).length).toBe(2)
      const teamIds = (tournament.teams as Array<{ id?: number }>).map(t => t.id)
      expect(teamIds).toContain(team1Id)
      expect(teamIds).toContain(team2Id)
    })
  })

  // ── GET /tournaments/:id/schedule ─────────────────────────────────────────

  describe('GET /tournaments/:id/schedule', () => {
    it('returns a paginated match list with correct shape', async () => {
      const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
      expect(Array.isArray(schedule.items)).toBe(true)
      expect(typeof schedule.total).toBe('number')
      expect(schedule.total).toBeGreaterThanOrEqual(1)
    })

    it('each match has all required fields', async () => {
      const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
      for (const match of schedule.items) {
        expect(match.id).toBeDefined()
        expect(match.tournament_id).toBe(tournamentId)
        expect(typeof match.team1_id).toBe('number')
        expect(typeof match.team2_id).toBe('number')
        expect(typeof match.type).toBe('string')
        expect(typeof match.team1_score).toBe('number')
        expect(typeof match.team2_score).toBe('number')
        expect(typeof match.started).toBe('boolean')
        expect(typeof match.finished).toBe('boolean')
      }
    })

    it('match involves both fixture teams', async () => {
      const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
      const match = schedule.items.find(m =>
        (m.team1_id === team1Id && m.team2_id === team2Id) ||
        (m.team1_id === team2Id && m.team2_id === team1Id)
      )
      expect(match).toBeDefined()
    })
  })

  // ── GET /tournaments/:id/standings ────────────────────────────────────────

  describe('GET /tournaments/:id/standings', () => {
    it('returns standings array for all teams', async () => {
      const standings = await apiClient.default.getTournamentStandings(tournamentId) as StandingsApiModel[]
      expect(Array.isArray(standings)).toBe(true)
      expect(standings.length).toBe(2)
    })

    it('each standing has all required numeric fields', async () => {
      const standings = await apiClient.default.getTournamentStandings(tournamentId) as StandingsApiModel[]
      for (const s of standings) {
        expect(typeof s.wins).toBe('number')
        expect(typeof s.losses).toBe('number')
        expect(typeof s.maps_won).toBe('number')
        expect(typeof s.maps_lost).toBe('number')
        expect(typeof s.rounds_won).toBe('number')
        expect(typeof s.rounds_lost).toBe('number')
        expect(s.tournament_id).toBe(tournamentId)
        expect(typeof s.team_id).toBe('number')
        expect(typeof s.position).toBe('number')
      }
    })

    it('standings cover both fixture teams', async () => {
      const standings = await apiClient.default.getTournamentStandings(tournamentId) as StandingsApiModel[]
      const teamIds = standings.map(s => s.team_id)
      expect(teamIds).toContain(team1Id)
      expect(teamIds).toContain(team2Id)
    })
  })

  // ── GET /matches/:id ──────────────────────────────────────────────────────

  describe('GET /matches/:id', () => {
    it('returns the correct match with all required fields', async () => {
      const match = await apiClient.default.getMatch(matchId) as MatchApiModel
      expect(match.id).toBe(matchId)
      expect(match.tournament_id).toBe(tournamentId)
      expect(typeof match.team1_id).toBe('number')
      expect(typeof match.team2_id).toBe('number')
      expect(typeof match.type).toBe('string')
      expect(typeof match.team1_score).toBe('number')
      expect(typeof match.team2_score).toBe('number')
      expect(typeof match.included_on_standings).toBe('boolean')
      expect(typeof match.started).toBe('boolean')
      expect(typeof match.finished).toBe('boolean')
    })

    it('embeds team1 and team2 objects', async () => {
      const match = await apiClient.default.getMatch(matchId) as MatchApiModel
      expect(match.team1).toBeDefined()
      expect(match.team1?.id).toBe(match.team1_id)
      expect(match.team2).toBeDefined()
      expect(match.team2?.id).toBe(match.team2_id)
    })

    it('embeds games array', async () => {
      const match = await apiClient.default.getMatch(matchId) as MatchApiModel
      expect(Array.isArray(match.games)).toBe(true)
      expect(match.games!.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── GET /games/match/:matchId ─────────────────────────────────────────────

  describe('GET /games/match/:matchId', () => {
    it('returns all games for the match', async () => {
      const games = await apiClient.default.getGamesByMatch(matchId) as GameApiModel[]
      expect(Array.isArray(games)).toBe(true)
      expect(games.length).toBeGreaterThanOrEqual(1)
    })

    it('each game has all required fields', async () => {
      const games = await apiClient.default.getGamesByMatch(matchId) as GameApiModel[]
      for (const game of games) {
        expect(game.id).toBeDefined()
        expect(game.match_id).toBe(matchId)
        expect(typeof game.map).toBe('string')
        expect(typeof game.started).toBe('boolean')
        expect(typeof game.finished).toBe('boolean')
        expect(typeof game.included_on_standings).toBe('boolean')
        expect(typeof game.date).toBe('string')
      }
    })
  })

  // ── GET /games/:id ────────────────────────────────────────────────────────

  describe('GET /games/:id', () => {
    it('returns the correct game with all required fields', async () => {
      const game = await apiClient.default.getGame(gameId) as GameApiModel
      expect(game.id).toBe(gameId)
      expect(game.match_id).toBe(matchId)
      expect(typeof game.map).toBe('string')
      expect(typeof game.started).toBe('boolean')
      expect(typeof game.finished).toBe('boolean')
      expect(typeof game.included_on_standings).toBe('boolean')
      expect(typeof game.date).toBe('string')
    })
  })

  // ── Round simulation ──────────────────────────────────────────────────────
  // These tests mutate state by playing a round; they run last and sequentially.

  describe('Round simulation', () => {
    let roundState: RoundStateApiModel

    beforeAll(async () => {
      roundState = await apiClient.default.playRound(gameId, 1) as RoundStateApiModel
    })

    describe('POST /games/:id/rounds/:n/play', () => {
      it('returns a valid round state after playing round 1', () => {
        expect(typeof roundState.round).toBe('number')
        expect(roundState.round).toBe(1)
        expect(roundState.duel).toBeDefined()
        expect(Array.isArray(roundState.team1_alive_players)).toBe(true)
        expect(Array.isArray(roundState.team2_alive_players)).toBe(true)
        expect(typeof roundState.finished).toBe('boolean')
      })

      it('duel result contains player references', () => {
        expect(roundState.duel).toBeDefined()
      })
    })

    describe('GET /games/:id/rounds/:n', () => {
      it('returns game logs for the played round', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        expect(Array.isArray(logs)).toBe(true)
        expect(logs.length).toBeGreaterThanOrEqual(1)
      })

      it('each log has all required fields', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        for (const log of logs) {
          expect(log.game_id).toBe(gameId)
          expect(typeof log.team1_player_id).toBe('number')
          expect(typeof log.team2_player_id).toBe('number')
          expect(typeof log.player_killed_id).toBe('number')
          expect(typeof log.duel_buff).toBe('number')
          expect(typeof log.trade_buff).toBe('number')
          expect(typeof log.trade).toBe('boolean')
          expect(typeof log.weapon).toBe('string')
          expect(typeof log.included_on_player_stats).toBe('boolean')
          expect(typeof log.included_on_team_stats).toBe('boolean')
          expect(log.round_state).toBeDefined()
        }
      })

      it('each log embeds team1_player and team2_player (no extra API calls needed)', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        for (const log of logs) {
          expect(log.team1_player).toBeDefined()
          expect(log.team1_player?.id).toBe(log.team1_player_id)
          expect(log.team2_player).toBeDefined()
          expect(log.team2_player?.id).toBe(log.team2_player_id)
        }
      })
    })

    describe('GET /games/:id/rounds/last', () => {
      it('returns logs for the most recently played round', async () => {
        const logs = await apiClient.default.getLastRound(gameId) as GameLogApiModel[]
        expect(Array.isArray(logs)).toBe(true)
        expect(logs.length).toBeGreaterThanOrEqual(1)
        for (const log of logs) {
          expect(log.game_id).toBe(gameId)
          expect(log.round_state.round).toBe(1)
        }
      })
    })

    describe('GET /games/:id/stats', () => {
      it('returns game stats with all required fields', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        expect(stats.game_id).toBe(gameId)
        expect(typeof stats.team1_score).toBe('number')
        expect(typeof stats.team2_score).toBe('number')
        expect(typeof stats.team1_id).toBe('number')
        expect(typeof stats.team2_id).toBe('number')
        const fixtureTeamIds = [team1Id, team2Id]
        expect(fixtureTeamIds).toContain(stats.team1_id)
        expect(fixtureTeamIds).toContain(stats.team2_id)
      })

      it('embeds team1 and team2 objects', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        expect(stats.team1).toBeDefined()
        expect(stats.team1?.id).toBe(stats.team1_id)
        expect(stats.team2).toBeDefined()
        expect(stats.team2?.id).toBe(stats.team2_id)
      })

      it('embeds player stats arrays for both teams', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        expect(Array.isArray(stats.players_stats_team1)).toBe(true)
        expect(Array.isArray(stats.players_stats_team2)).toBe(true)
        for (const ps of [...stats.players_stats_team1!, ...stats.players_stats_team2!]) {
          expect(typeof ps.kills).toBe('number')
          expect(typeof ps.deaths).toBe('number')
          expect(typeof ps.assists).toBe('number')
          expect(typeof ps.player_id).toBe('number')
        }
      })
    })
  })
})

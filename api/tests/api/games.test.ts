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
import { givenTeamExists, cleanupTeam } from './common-teams'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER_ATTRIBUTES } from './common-players'
import { givenTournamentExists, cleanupTournament, TEST_TOURNAMENT } from './common-tournaments'

describe('Tournaments, Matches & Games', () => {
  let team1Id: number
  let team2Id: number
  const team1PlayerIds: number[] = []
  const team2PlayerIds: number[] = []
  let tournamentId: number
  let matchId: number
  let gameId: number

  beforeAll(async () => {
    const team1 = await givenTeamExists({ short_name: 'GT1', full_name: 'Game Test Team 1', country: 'Brazil' })
    const team2 = await givenTeamExists({ short_name: 'GT2', full_name: 'Game Test Team 2', country: 'Argentina' })
    team1Id = team1.id!
    team2Id = team2.id!

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
      expect(response.total).toBeGreaterThanOrEqual(1)
    })

    it('includes the fixture tournament with correct field values', async () => {
      const response = await apiClient.default.getTournaments(50, 0) as ItemsWithPagination_TournamentApiModel_
      const found = response.items.find((t: TournamentApiModel) => t.id === tournamentId)!
      expect(found).toBeDefined()
      expect(found.id).toBe(tournamentId)
      expect(found.name).toBe(TEST_TOURNAMENT.name)
      expect(found.description).toBe(TEST_TOURNAMENT.description)
      expect(found.country).toBe(TEST_TOURNAMENT.country)
      expect(found.type).toBe(TEST_TOURNAMENT.type)
      expect(found.started).toBe(false)
      expect(found.ended).toBe(false)
    })

    it('embeds teams array containing both fixture teams', async () => {
      const response = await apiClient.default.getTournaments(50, 0) as ItemsWithPagination_TournamentApiModel_
      const fixture = response.items.find((t: TournamentApiModel) => t.id === tournamentId)!
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
    it('returns the correct tournament with all field values', async () => {
      const tournament = await apiClient.default.getTournament(tournamentId) as TournamentApiModel
      expect(tournament.id).toBe(tournamentId)
      expect(tournament.name).toBe(TEST_TOURNAMENT.name)
      expect(tournament.description).toBe(TEST_TOURNAMENT.description)
      expect(tournament.country).toBe(TEST_TOURNAMENT.country)
      expect(tournament.type).toBe(TEST_TOURNAMENT.type)
      expect(tournament.started).toBe(false)
      expect(tournament.ended).toBe(false)
      expect(tournament.winner_id).toBeNull()
    })

    it('embeds the teams array with both fixture teams', async () => {
      const tournament = await apiClient.default.getTournament(tournamentId) as TournamentApiModel
      expect((tournament.teams as Array<unknown>).length).toBe(2)
      const teamIds = (tournament.teams as Array<{ id?: number }>).map(t => t.id)
      expect(teamIds).toContain(team1Id)
      expect(teamIds).toContain(team2Id)
    })
  })

  // ── GET /tournaments/:id/schedule ─────────────────────────────────────────

  describe('GET /tournaments/:id/schedule', () => {
    it('returns a paginated match list', async () => {
      const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
      expect(schedule.total).toBeGreaterThanOrEqual(1)
      expect(schedule.items.length).toBeGreaterThanOrEqual(1)
    })

    it('each match has correct field values for a not-yet-played match', async () => {
      const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
      for (const match of schedule.items) {
        expect(match.id).toBeGreaterThan(0)
        expect(match.tournament_id).toBe(tournamentId)
        expect(match.type).toBe(MatchType.BO3)
        expect(match.team1_score).toBe(0)
        expect(match.team2_score).toBe(0)
        expect(match.started).toBe(false)
        expect(match.finished).toBe(false)
        expect(match.included_on_standings).toBe(true) // matches are always included in standings from creation
      }
    })

    it('the match involves both fixture teams', async () => {
      const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
      const match = schedule.items.find(m =>
        (m.team1_id === team1Id && m.team2_id === team2Id) ||
        (m.team1_id === team2Id && m.team2_id === team1Id),
      )
      expect(match).toBeDefined()
      expect(match!.id).toBe(matchId)
    })
  })

  // ── GET /tournaments/:id/standings ────────────────────────────────────────

  describe('GET /tournaments/:id/standings', () => {
    it('returns exactly 2 standings entries (one per team)', async () => {
      const standings = await apiClient.default.getTournamentStandings(tournamentId) as StandingsApiModel[]
      expect(standings).toHaveLength(2)
    })

    it('each standing starts at zero with correct tournament and team IDs', async () => {
      const standings = await apiClient.default.getTournamentStandings(tournamentId) as StandingsApiModel[]
      for (const s of standings) {
        expect(s.tournament_id).toBe(tournamentId)
        expect(s.team_id).toBeGreaterThan(0)
        expect(s.wins).toBe(0)
        expect(s.losses).toBe(0)
        expect(s.maps_won).toBe(0)
        expect(s.maps_lost).toBe(0)
        expect(s.rounds_won).toBe(0)
        expect(s.rounds_lost).toBe(0)
        expect(s.position).toBeGreaterThan(0)
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
    it('returns the correct match with all field values', async () => {
      const match = await apiClient.default.getMatch(matchId) as MatchApiModel
      expect(match.id).toBe(matchId)
      expect(match.tournament_id).toBe(tournamentId)
      expect(match.type).toBe(MatchType.BO3)
      expect(match.team1_score).toBe(0)
      expect(match.team2_score).toBe(0)
      expect(match.started).toBe(false)
      expect(match.finished).toBe(false)
      expect(match.included_on_standings).toBe(false)
    })

    it('embeds team1 and team2 objects with correct IDs', async () => {
      const match = await apiClient.default.getMatch(matchId) as MatchApiModel
      expect(match.team1?.id).toBe(match.team1_id)
      expect(match.team1?.short_name?.length).toBeGreaterThan(0)
      expect(match.team2?.id).toBe(match.team2_id)
      expect(match.team2?.short_name?.length).toBeGreaterThan(0)
    })

    it('embeds games array with at least 1 game', async () => {
      const match = await apiClient.default.getMatch(matchId) as MatchApiModel
      expect(match.games!.length).toBeGreaterThanOrEqual(1)
      expect(match.games![0].id).toBe(gameId)
    })
  })

  // ── GET /games/match/:matchId ─────────────────────────────────────────────

  describe('GET /games/match/:matchId', () => {
    it('returns all games for the match', async () => {
      const games = await apiClient.default.getGamesByMatch(matchId) as GameApiModel[]
      expect(games.length).toBeGreaterThanOrEqual(1)
      for (const game of games) {
        expect(game.match_id).toBe(matchId)
      }
    })

    it('each unplayed game has correct initial field values', async () => {
      const games = await apiClient.default.getGamesByMatch(matchId) as GameApiModel[]
      for (const game of games) {
        expect(game.id).toBeGreaterThan(0)
        expect(game.started).toBe(false)
        expect(game.finished).toBe(false)
        expect(game.included_on_standings).toBe(false)
      }
    })
  })

  // ── GET /games/:id ────────────────────────────────────────────────────────

  describe('GET /games/:id', () => {
    it('returns the correct unplayed game with all field values', async () => {
      const game = await apiClient.default.getGame(gameId) as GameApiModel
      expect(game.id).toBe(gameId)
      expect(game.match_id).toBe(matchId)
      expect(game.started).toBe(false)
      expect(game.finished).toBe(false)
      expect(game.included_on_standings).toBe(false)
    })
  })

  // ── Round simulation ──────────────────────────────────────────────────────

  describe('Round simulation', () => {
    let roundState: RoundStateApiModel
    const allPlayerIds = [...([] as number[])]

    beforeAll(async () => {
      allPlayerIds.push(...team1PlayerIds, ...team2PlayerIds)
      roundState = await apiClient.default.playRound(gameId, 1) as RoundStateApiModel
    })

    describe('POST /games/:id/rounds/:n/play', () => {
      it('returns round 1 as the played round number', () => {
        expect(roundState.round).toBe(1)
      })

      it('returns alive players summing to less than the starting 10', () => {
        const aliveCount = roundState.team1_alive_players.length + roundState.team2_alive_players.length
        // One team is eliminated: total alive is at most 9 (winning team lost 0 players)
        expect(aliveCount).toBeGreaterThanOrEqual(1)
        expect(aliveCount).toBeLessThanOrEqual(9)
      })

      it('finished is true when one team is fully eliminated', () => {
        // A round ends when one side reaches 0 — team_won is set
        if (roundState.team1_alive_players.length === 0 || roundState.team2_alive_players.length === 0) {
          expect(roundState.finished).toBe(true)
          expect(roundState.team_won).not.toBeNull()
        }
      })

      it('team_won belongs to the fixture teams', () => {
        if (roundState.team_won) {
          expect([team1Id, team2Id]).toContain(roundState.team_won.id)
        }
      })
    })

    describe('GET /games/:id/rounds/:n', () => {
      it('returns at least 5 and at most 9 game logs for a 5v5 round', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        // Each duel kills one player; 5v5 round ends after 5–9 deaths
        expect(logs.length).toBeGreaterThanOrEqual(5)
        expect(logs.length).toBeLessThanOrEqual(9)
      })

      it('every log references the correct game and round', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        for (const log of logs) {
          expect(log.game_id).toBe(gameId)
          expect(log.round_state.round).toBe(1)
        }
      })

      it('every log has player IDs belonging to the fixture teams', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        for (const log of logs) {
          expect(allPlayerIds).toContain(log.team1_player_id)
          expect(allPlayerIds).toContain(log.team2_player_id)
          expect(allPlayerIds).toContain(log.player_killed_id)
        }
      })

      it('every log embeds team1_player and team2_player matching the IDs (no extra API calls needed)', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        for (const log of logs) {
          expect(log.team1_player?.id).toBe(log.team1_player_id)
          expect(log.team1_player?.nickname.length).toBeGreaterThan(0)
          expect(log.team2_player?.id).toBe(log.team2_player_id)
          expect(log.team2_player?.nickname.length).toBeGreaterThan(0)
        }
      })

      it('duel buffs are finite numbers and trade is a boolean', async () => {
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        for (const log of logs) {
          expect(Number.isFinite(log.duel_buff)).toBe(true)
          expect(Number.isFinite(log.trade_buff)).toBe(true)
          expect(typeof log.trade).toBe('boolean')
        }
      })
    })

    describe('GET /games/:id/rounds/last', () => {
      it('returns the same logs as getRound(gameId, 1) after only one round played', async () => {
        const lastLogs = await apiClient.default.getLastRound(gameId) as GameLogApiModel[]
        const roundLogs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        expect(lastLogs.length).toBe(roundLogs.length)
        expect(lastLogs.every(l => l.round_state.round === 1)).toBe(true)
      })
    })

    describe('GET /games/:id/stats', () => {
      it('returns game stats with one team having scored a round', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        expect(stats.game_id).toBe(gameId)
        // After one round, exactly one team scored
        expect(stats.team1_score + stats.team2_score).toBe(1)
        expect(stats.team1_score).toBeGreaterThanOrEqual(0)
        expect(stats.team2_score).toBeGreaterThanOrEqual(0)
      })

      it('embeds team1 and team2 objects matching the fixture teams', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        expect([team1Id, team2Id]).toContain(stats.team1_id)
        expect([team1Id, team2Id]).toContain(stats.team2_id)
        expect(stats.team1?.id).toBe(stats.team1_id)
        expect(stats.team1?.short_name?.length).toBeGreaterThan(0)
        expect(stats.team2?.id).toBe(stats.team2_id)
        expect(stats.team2?.short_name?.length).toBeGreaterThan(0)
      })

      it('embeds exactly 5 player stat entries per team', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        expect(stats.players_stats_team1).toHaveLength(5)
        expect(stats.players_stats_team2).toHaveLength(5)
      })

      it('total kills across all players equals the number of game log entries', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        const logs = await apiClient.default.getRound(gameId, 1) as GameLogApiModel[]
        const totalKills = [
          ...stats.players_stats_team1!,
          ...stats.players_stats_team2!,
        ].reduce((sum, ps) => sum + ps.kills, 0)
        expect(totalKills).toBe(logs.length)
      })

      it('each player stat has non-negative kills, deaths, and assists', async () => {
        const stats = await apiClient.default.getGameStats(gameId) as GameStatsApiModel
        for (const ps of [...stats.players_stats_team1!, ...stats.players_stats_team2!]) {
          expect(ps.kills).toBeGreaterThanOrEqual(0)
          expect(ps.deaths).toBeGreaterThanOrEqual(0)
          expect(ps.assists).toBeGreaterThanOrEqual(0)
          expect(allPlayerIds).toContain(ps.player_id)
        }
      })
    })
  })
})

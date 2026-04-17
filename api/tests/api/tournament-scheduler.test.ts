import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { apiClient } from '@tests/setup'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'
import {
  givenTournamentExists,
  cleanupTournament,
  waitForCondition,
  isValidDateString,
} from '@tests/api/common-tournaments'
import {
  AllPlayerStats,
  GameApiModel,
  GameStatsApiModel,
  ItemsWithPagination_MatchApiModel_,
  MatchType,
  MatchApiModel,
  TournamentApiModel,
  TournamentType,
} from '@tests/generated/api'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER_ATTRIBUTES } from '@tests/api/common-players'

interface TournamentScheduleFixture {
  name: string
  description: string
  startDate: Date
  endDate: Date
  teamIds: [number, number]
  shouldBePickedNow: boolean
  tournamentId?: number
  matchId?: number
}

describe('Tournament scheduling generation', () => {
  const teamIds: number[] = []
  const playerIds: number[] = []
  const teamToPlayerIds = new Map<number, number[]>()
  const fixtureTournaments: TournamentScheduleFixture[] = []

  beforeAll(async () => {
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

    // GIVEN: two teams with full rosters; reused across multiple tournaments.
    for (let index = 1; index <= 2; index += 1) {
      const team = await givenTeamExists({
        short_name: `TS${index}${suffix.slice(-3)}`,
        full_name: `Tournament Scheduler Team ${index} ${suffix}`,
        country: index % 2 === 0 ? 'Brazil' : 'Argentina',
      })
      teamIds.push(team.id!)
      teamToPlayerIds.set(team.id!, [])

      for (let playerIndex = 1; playerIndex <= 5; playerIndex += 1) {
        const player = await givenPlayerExists(team.id!, {
          nickname: `sched_${index}_${playerIndex}_${suffix}`,
          player_attributes: TEST_PLAYER_ATTRIBUTES,
        })
        playerIds.push(player.id!)
        teamToPlayerIds.get(team.id!)?.push(player.id!)
      }
    }

    fixtureTournaments.push(
      {
        name: `Scheduler Past Tournament A ${suffix}`,
        description: `Scheduler Past Tournament A ${suffix} fixture`,
        startDate: new Date('1900-01-01T00:00:00.000Z'),
        endDate: new Date('1900-01-02T00:00:00.000Z'),
        teamIds: [teamIds[0], teamIds[1]],
        shouldBePickedNow: true,
      },
      {
        name: `Scheduler Past Tournament B ${suffix}`,
        description: `Scheduler Past Tournament B ${suffix} fixture`,
        startDate: new Date('1900-01-03T00:00:00.000Z'),
        endDate: new Date('1900-01-04T00:00:00.000Z'),
        teamIds: [teamIds[0], teamIds[1]],
        shouldBePickedNow: true,
      },
      {
        name: `Scheduler Future Tournament ${suffix}`,
        description: `Scheduler Future Tournament ${suffix} fixture`,
        startDate: new Date('2100-03-10T00:00:00.000Z'),
        endDate: new Date('2100-03-11T00:00:00.000Z'),
        teamIds: [teamIds[0], teamIds[1]],
        shouldBePickedNow: false,
      },
    )

    for (const tournamentFixture of fixtureTournaments) {
      const tournament = await givenTournamentExists(tournamentFixture.teamIds, {
        name: tournamentFixture.name,
        description: tournamentFixture.description,
        start_date: tournamentFixture.startDate.toISOString(),
        end_date: tournamentFixture.endDate.toISOString(),
      })

      tournamentFixture.tournamentId = tournament.id

      const schedule = await apiClient.default.getTournamentSchedule(
        tournament.id!,
        10,
        0,
      ) as ItemsWithPagination_MatchApiModel_

      tournamentFixture.matchId = schedule.items[0]?.id
    }
  })

  afterAll(async () => {
    for (const tournamentFixture of fixtureTournaments) {
      await cleanupTournament(tournamentFixture.tournamentId)
    }

    for (const playerId of playerIds) {
      await cleanupPlayer(playerId)
    }

    for (const teamId of teamIds) {
      await cleanupTeam(teamId)
    }
  })

  it('creates one generated match per two-team tournament with dates inside each tournament window', async () => {
    // WHEN / THEN: every fixture tournament produces one schedulable match in-range.
    for (const tournamentFixture of fixtureTournaments) {
      const schedule = await apiClient.default.getTournamentSchedule(
        tournamentFixture.tournamentId!,
        10,
        0,
      ) as ItemsWithPagination_MatchApiModel_

      expect(schedule.total).toBe(1)
      expect(schedule.items.length).toBe(1)

      const generatedMatch = schedule.items[0]
      const generatedMatchDate = new Date(generatedMatch.date)

      expect(generatedMatch.id).toBeGreaterThan(0)
      expect(isValidDateString(generatedMatch.date)).toBe(true)
      expect(generatedMatch.id).toBe(tournamentFixture.matchId)
      expect(generatedMatch.tournament_id).toBe(tournamentFixture.tournamentId)
      expect(generatedMatch.team1_id).toBeGreaterThan(0)
      expect(generatedMatch.team2_id).toBeGreaterThan(0)
      expect(generatedMatch.team1_id).not.toBe(generatedMatch.team2_id)
      expect(generatedMatch.type).toBe(MatchType.BO3)
      expect(generatedMatch.team1_score).toBe(0)
      expect(generatedMatch.team2_score).toBe(0)
      expect(generatedMatch.standings_processed).toBe(false)
      expect(generatedMatch.started).toBe(false)
      expect(generatedMatch.finished).toBe(false)
      expect(generatedMatch.winner_id === undefined || generatedMatch.winner_id === null).toBe(true)
      expect(generatedMatch.team1).toBeUndefined()
      expect(generatedMatch.team2).toBeUndefined()
      expect(generatedMatch.games).toBeUndefined()
      expect(generatedMatchDate.getTime()).toBeGreaterThanOrEqual(tournamentFixture.startDate.getTime())
      expect(generatedMatchDate.getTime()).toBeLessThanOrEqual(tournamentFixture.endDate.getTime())
    }
  })

  it('returns all tournament and detailed match fields before scheduler processing', async () => {
    for (const tournamentFixture of fixtureTournaments) {
      const tournament = await apiClient.default.getTournament(tournamentFixture.tournamentId!) as TournamentApiModel
      expect(tournament.id).toBe(tournamentFixture.tournamentId)
      expect(tournament.name).toBe(tournamentFixture.name)
      expect(tournament.description).toBe(tournamentFixture.description)
      expect(tournament.country).toBe('Brazil')
      expect(tournament.type).toBe(TournamentType.SINGLE_GROUP)
      expect(tournament.start_date).toBe(tournamentFixture.startDate.toISOString())
      expect(tournament.end_date).toBe(tournamentFixture.endDate.toISOString())
      expect(tournament.started).toBe(false)
      expect(tournament.ended).toBe(false)
      expect(tournament.winner_id === undefined || tournament.winner_id === null).toBe(true)
      expect(tournament.teams).toBeDefined()
      expect(tournament.teams?.length).toBe(2)

      const tournamentTeamIds = (tournament.teams ?? []).flatMap(team => {
        return typeof team === 'number' ? [team] : [team.id!]
      })
      expect(tournamentTeamIds).toContain(tournamentFixture.teamIds[0])
      expect(tournamentTeamIds).toContain(tournamentFixture.teamIds[1])

      const detailedMatch = await apiClient.default.getMatch(tournamentFixture.matchId!) as MatchApiModel
      expect(detailedMatch.id).toBe(tournamentFixture.matchId)
      expect(isValidDateString(detailedMatch.date)).toBe(true)
      expect(detailedMatch.tournament_id).toBe(tournamentFixture.tournamentId)
      expect(detailedMatch.team1_id).toBeGreaterThan(0)
      expect(detailedMatch.team2_id).toBeGreaterThan(0)
      expect(detailedMatch.team1_id).not.toBe(detailedMatch.team2_id)
      expect(detailedMatch.type).toBe(MatchType.BO3)
      expect(detailedMatch.team1_score).toBe(0)
      expect(detailedMatch.team2_score).toBe(0)
      expect(detailedMatch.standings_processed).toBe(false)
      expect(detailedMatch.started).toBe(false)
      expect(detailedMatch.finished).toBe(false)
      expect(detailedMatch.winner_id === undefined || detailedMatch.winner_id === null).toBe(true)
      expect(detailedMatch.team1).toBeDefined()
      expect(detailedMatch.team1?.id).toBe(detailedMatch.team1_id)
      expect((detailedMatch.team1?.short_name ?? '').length).toBeGreaterThan(0)
      expect(detailedMatch.team1?.country).toBeUndefined()
      expect(detailedMatch.team2).toBeDefined()
      expect(detailedMatch.team2?.id).toBe(detailedMatch.team2_id)
      expect((detailedMatch.team2?.short_name ?? '').length).toBeGreaterThan(0)
      expect(detailedMatch.team2?.country).toBeUndefined()
      expect(detailedMatch.games).toBeDefined()
      expect((detailedMatch.games ?? []).length).toBeGreaterThan(0)

      const games = await apiClient.default.getGamesByMatch(tournamentFixture.matchId!) as GameApiModel[]
      expect(games.length).toBeGreaterThan(0)
      for (const game of games) {
        expect(game.id).toBeGreaterThan(0)
        expect(isValidDateString(game.date)).toBe(true)
        expect(game.match_id).toBe(tournamentFixture.matchId)
        expect((game.map ?? '').length).toBeGreaterThan(0)
        expect(game.standings_processed).toBe(false)
        expect(game.started).toBe(false)
        expect(game.finished).toBe(false)
        expect(game.stats).toBeDefined()
        expect(game.stats?.id).toBeGreaterThan(0)
        expect(game.stats?.game_id).toBe(game.id)
        expect(game.stats?.team1_id).toBeGreaterThan(0)
        expect(game.stats?.team2_id).toBeGreaterThan(0)
        expect(game.stats?.team1_id).not.toBe(game.stats?.team2_id)
        expect(game.stats?.team1_score).toBe(0)
        expect(game.stats?.team2_score).toBe(0)
        expect(game.stats?.winner_id === undefined || game.stats?.winner_id === null).toBe(true)
      }
    }
  })

  it('runner/worker picks due tournament matches and leaves future tournament queued', async () => {
    const pastTournamentFixtures = fixtureTournaments.filter(
      fixture => fixture.shouldBePickedNow,
    )
    const futureTournamentFixture = fixtureTournaments.find(
      fixture => !fixture.shouldBePickedNow,
    )

    expect(pastTournamentFixtures.length).toBe(2)
    expect(futureTournamentFixture).toBeDefined()

    const pastTeamIds = [...new Set(
      pastTournamentFixtures.flatMap(fixture => fixture.teamIds),
    )]
    const trackedPastPlayerIds = pastTeamIds.flatMap(teamId => teamToPlayerIds.get(teamId) ?? [])
    const baselineStatsByPlayerId = new Map<number, AllPlayerStats>()
    for (const playerId of trackedPastPlayerIds) {
      const baselineStats = await apiClient.default.getPlayerStats(playerId) as AllPlayerStats
      baselineStatsByPlayerId.set(playerId, baselineStats)
    }

    const allPastFinished = await waitForCondition(
      async (): Promise<boolean> => {
        for (const fixture of pastTournamentFixtures) {
          const match = await apiClient.default.getMatch(fixture.matchId!) as MatchApiModel
          if (!match.started || !match.finished || !match.winner_id) {
            return false
          }
        }
        return true
      },
      180000,
      2000,
    )

    expect(allPastFinished).toBe(true)

    for (const fixture of pastTournamentFixtures) {
      const match = await apiClient.default.getMatch(fixture.matchId!) as MatchApiModel
      expect(match.id).toBe(fixture.matchId)
      expect(isValidDateString(match.date)).toBe(true)
      expect(match.tournament_id).toBe(fixture.tournamentId)
      expect(match.team1_id).toBeGreaterThan(0)
      expect(match.team2_id).toBeGreaterThan(0)
      expect(match.team1_id).not.toBe(match.team2_id)
      expect(match.type).toBe(MatchType.BO3)
      expect(match.team1_score).toBeGreaterThanOrEqual(0)
      expect(match.team2_score).toBeGreaterThanOrEqual(0)
      expect(match.standings_processed).toBe(true)
      expect(match.started).toBe(true)
      expect(match.finished).toBe(true)
      expect(match.winner_id).toBeDefined()
      expect([match.team1_id, match.team2_id]).toContain(match.winner_id!)
      expect(match.team1).toBeDefined()
      expect(match.team2).toBeDefined()
      expect(match.games).toBeDefined()
      expect((match.games ?? []).length).toBeGreaterThan(0)
      expect((match.games ?? []).length).toBe(3)

      const gameStatsList: GameStatsApiModel[] = []
      for (const game of (match.games ?? [])) {
        const gameStats = await apiClient.default.getGameStats(game.id!) as GameStatsApiModel
        gameStatsList.push(gameStats)
      }

      const matchTeam1WinsFromGames = gameStatsList.filter(gameStats => gameStats.winner_id === match.team1_id).length
      const matchTeam2WinsFromGames = gameStatsList.filter(gameStats => gameStats.winner_id === match.team2_id).length
      expect(match.team1_score).toBe(matchTeam1WinsFromGames)
      expect(match.team2_score).toBe(matchTeam2WinsFromGames)
      expect(match.team1_score + match.team2_score).toBe(gameStatsList.length)
      expect(Math.max(match.team1_score, match.team2_score)).toBeGreaterThanOrEqual(2)
      expect(Math.min(match.team1_score, match.team2_score)).toBeLessThanOrEqual(1)
      if (match.winner_id === match.team1_id) {
        expect(match.team1_score).toBeGreaterThan(match.team2_score)
      } else {
        expect(match.team2_score).toBeGreaterThan(match.team1_score)
      }

      const tournament = await apiClient.default.getTournament(fixture.tournamentId!) as TournamentApiModel
      expect(tournament.started).toBe(true)
      expect(tournament.ended).toBe(true)
      expect(tournament.winner_id).toBeGreaterThan(0)
      expect(tournament.id).toBe(fixture.tournamentId)
      expect(tournament.name).toBe(fixture.name)
      expect(tournament.description).toBe(fixture.description)
      expect(tournament.country).toBe('Brazil')
      expect(tournament.type).toBe(TournamentType.SINGLE_GROUP)
      expect(tournament.start_date).toBe(fixture.startDate.toISOString())
      expect(tournament.end_date).toBe(fixture.endDate.toISOString())
      expect(tournament.teams).toBeDefined()
      expect(tournament.teams?.length).toBe(2)

      const games = await apiClient.default.getGamesByMatch(fixture.matchId!) as GameApiModel[]
      expect(games.length).toBeGreaterThan(0)
      let processedGames = 0
      for (const game of games) {
        expect(game.id).toBeGreaterThan(0)
        expect(isValidDateString(game.date)).toBe(true)
        expect(game.match_id).toBe(fixture.matchId)
        expect((game.map ?? '').length).toBeGreaterThan(0)
        expect(typeof game.standings_processed).toBe('boolean')
        expect(game.started).toBe(false)
        expect(typeof game.finished).toBe('boolean')
        expect(game.stats).toBeDefined()
        expect(game.stats?.id).toBeGreaterThan(0)
        expect(game.stats?.game_id).toBe(game.id)
        expect(game.stats?.team1_id).toBeGreaterThan(0)
        expect(game.stats?.team2_id).toBeGreaterThan(0)
        expect(game.stats?.team1_id).not.toBe(game.stats?.team2_id)
        expect(game.stats?.team1_score).toBeGreaterThanOrEqual(0)
        expect(game.stats?.team2_score).toBeGreaterThanOrEqual(0)
        const maxRounds = Math.max(game.stats?.team1_score ?? 0, game.stats?.team2_score ?? 0)
        const minRounds = Math.min(game.stats?.team1_score ?? 0, game.stats?.team2_score ?? 0)
        expect(maxRounds).toBeGreaterThanOrEqual(13)
        expect(maxRounds - minRounds).toBeGreaterThanOrEqual(2)
        const winnerId = game.stats?.winner_id
        expect(winnerId).toBeDefined()
        if (winnerId !== undefined && winnerId !== null) {
          expect([game.stats!.team1_id, game.stats!.team2_id]).toContain(winnerId)
          if (winnerId === game.stats!.team1_id) {
            expect(game.stats!.team1_score).toBeGreaterThan(game.stats!.team2_score)
          } else {
            expect(game.stats!.team2_score).toBeGreaterThan(game.stats!.team1_score)
          }
        }
        if (game.standings_processed) {
          processedGames += 1
        }
      }
      expect(processedGames).toBeGreaterThan(0)
    }

    for (const playerId of trackedPastPlayerIds) {
      const beforeStats = baselineStatsByPlayerId.get(playerId)!
      const afterStats = await apiClient.default.getPlayerStats(playerId) as AllPlayerStats
      expect(afterStats.totalMapsPlayed).toBeGreaterThan(beforeStats.totalMapsPlayed)
      expect(afterStats.totalMatchesPlayed).toBeGreaterThanOrEqual(beforeStats.totalMatchesPlayed)
      expect(afterStats.totalKills + afterStats.totalDeaths + afterStats.totalAssists)
        .toBeGreaterThan(beforeStats.totalKills + beforeStats.totalDeaths + beforeStats.totalAssists)
      expect(afterStats.kda).toBeGreaterThanOrEqual(0)
      expect(afterStats.winrate).toBeGreaterThanOrEqual(0)
      expect(afterStats.winrate).toBeLessThanOrEqual(100)
      expect(afterStats.mapWinrate).toBeGreaterThanOrEqual(0)
      expect(afterStats.mapWinrate).toBeLessThanOrEqual(100)
    }

    const futureMatch = await apiClient.default.getMatch(futureTournamentFixture!.matchId!) as MatchApiModel
    expect(futureMatch.id).toBe(futureTournamentFixture!.matchId)
    expect(isValidDateString(futureMatch.date)).toBe(true)
    expect(futureMatch.tournament_id).toBe(futureTournamentFixture!.tournamentId)
    expect(futureMatch.team1_id).toBeGreaterThan(0)
    expect(futureMatch.team2_id).toBeGreaterThan(0)
    expect(futureMatch.team1_id).not.toBe(futureMatch.team2_id)
    expect(futureMatch.type).toBe(MatchType.BO3)
    expect(futureMatch.team1_score).toBe(0)
    expect(futureMatch.team2_score).toBe(0)
    expect(futureMatch.standings_processed).toBe(false)
    expect(futureMatch.started).toBe(false)
    expect(futureMatch.finished).toBe(false)
    expect(futureMatch.winner_id === undefined || futureMatch.winner_id === null).toBe(true)
    expect(futureMatch.team1).toBeDefined()
    expect(futureMatch.team2).toBeDefined()
    expect(futureMatch.games).toBeDefined()
    expect((futureMatch.games ?? []).length).toBeGreaterThan(0)

    const futureTournament = await apiClient.default.getTournament(futureTournamentFixture!.tournamentId!) as TournamentApiModel
    expect(futureTournament.id).toBe(futureTournamentFixture!.tournamentId)
    expect(futureTournament.name).toBe(futureTournamentFixture!.name)
    expect(futureTournament.description).toBe(futureTournamentFixture!.description)
    expect(futureTournament.country).toBe('Brazil')
    expect(futureTournament.type).toBe(TournamentType.SINGLE_GROUP)
    expect(futureTournament.start_date).toBe(futureTournamentFixture!.startDate.toISOString())
    expect(futureTournament.end_date).toBe(futureTournamentFixture!.endDate.toISOString())
    expect(futureTournament.started).toBe(false)
    expect(futureTournament.ended).toBe(false)
    expect(futureTournament.winner_id === undefined || futureTournament.winner_id === null).toBe(true)
    expect(futureTournament.teams).toBeDefined()
    expect(futureTournament.teams?.length).toBe(2)

    const futureGames = await apiClient.default.getGamesByMatch(futureTournamentFixture!.matchId!) as GameApiModel[]
    expect(futureGames.length).toBeGreaterThan(0)
    for (const game of futureGames) {
      expect(game.id).toBeGreaterThan(0)
      expect(isValidDateString(game.date)).toBe(true)
      expect(game.match_id).toBe(futureTournamentFixture!.matchId)
      expect((game.map ?? '').length).toBeGreaterThan(0)
      expect(game.standings_processed).toBe(false)
      expect(game.started).toBe(false)
      expect(game.finished).toBe(false)
      expect(game.stats).toBeDefined()
      expect(game.stats?.id).toBeGreaterThan(0)
      expect(game.stats?.game_id).toBe(game.id)
      expect(game.stats?.team1_id).toBeGreaterThan(0)
      expect(game.stats?.team2_id).toBeGreaterThan(0)
      expect(game.stats?.team1_id).not.toBe(game.stats?.team2_id)
      expect(game.stats?.team1_score).toBe(0)
      expect(game.stats?.team2_score).toBe(0)
      expect(game.stats?.winner_id === undefined || game.stats?.winner_id === null).toBe(true)
    }
  }, 190000)
})

import { afterAll, describe, expect, it } from 'vitest'
import { apiClient } from '@tests/setup'
import { GenerateDataResult, TeamApiModel } from '@tests/generated/api'

describe('Data generation', () => {
  const batches: GenerateDataResult[] = []

  afterAll(async () => {
    for (const batch of batches) {
      for (const id of batch.tournamentIds) await apiClient.default.deleteTournament(id)
      for (const id of batch.playerIds) await apiClient.default.deletePlayer(id)
      for (const id of batch.teamIds) await apiClient.default.deleteTeam(id)
    }
  })

  it('creates complete rosters, tournament membership, standings and playable games', async () => {
    const result = await apiClient.default.generateData({ teamCount: 2, tournamentCount: 2, start_date: '2100-06-01T10:00:00.000Z', end_date: '2100-06-08T18:00:00.000Z' })
    batches.push(result)

    expect(result.teamIds).toHaveLength(2)
    expect(result.playerIds).toHaveLength(10)
    expect(result.tournamentIds).toHaveLength(2)
    for (const id of result.teamIds) {
      const team = await apiClient.default.getTeam(id)
      expect(team.players).toHaveLength(5)
      expect(new Set(team.players?.map(player => player.role)).size).toBe(5)
      for (const player of team.players ?? []) {
        expect(player.team_id).toBe(id)
        expect(result.playerIds).toContain(player.id)
        expect(Object.values(player.player_attributes)).toHaveLength(16)
        for (const value of Object.values(player.player_attributes)) {
          expect(Number.isInteger(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(3)
        }
      }
    }
    const tournament = await apiClient.default.getTournament(result.tournamentIds[0])
    expect(tournament.teams?.map(team => (team as TeamApiModel).id).sort()).toEqual([...result.teamIds].sort())
    const standings = await apiClient.default.getTournamentStandings(result.tournamentIds[0])
    expect(standings.map(row => row.team_id).sort()).toEqual([...result.teamIds].sort())
    expect(standings.map(row => row.wins)).toEqual([0, 0])
    const schedule = await apiClient.default.getTournamentSchedule(result.tournamentIds[0])
    expect(schedule.total).toBe(1)
    expect(schedule.items[0]).toMatchObject({
      team1_id: result.teamIds[0], team2_id: result.teamIds[1], type: 'BO3',
      started: false, finished: false, team1_score: 0, team2_score: 0,
    })
    const games = await apiClient.default.getGamesByMatch(schedule.items[0].id!)
    expect(games).toHaveLength(3)
    expect(tournament.started).toBe(false)
    expect(tournament.ended).toBe(false)
    expect(tournament.start_date).toBe('2100-06-01T10:00:00.000Z')
    expect(tournament.end_date).toBe('2100-06-08T18:00:00.000Z')
    const secondTournament = await apiClient.default.getTournament(result.tournamentIds[1])
    expect(secondTournament.start_date).toBe(tournament.start_date)
    expect(secondTournament.end_date).toBe(tournament.end_date)
    expect(new Date(schedule.items[0].date).getTime()).toBeGreaterThanOrEqual(new Date(tournament.start_date).getTime())
    expect(new Date(schedule.items[0].date).getTime()).toBeLessThanOrEqual(new Date(tournament.end_date).getTime())
  })

  it('allows repeated generation without changing earlier batches', async () => {
    const first = await apiClient.default.generateData({ teamCount: 2, tournamentCount: 0 })
    batches.push(first)
    const second = await apiClient.default.generateData({ teamCount: 2, tournamentCount: 0 })
    batches.push(second)

    expect(first.tournamentIds).toEqual([])
    expect(second.tournamentIds).toEqual([])
    expect(new Set([...first.teamIds, ...second.teamIds]).size).toBe(4)
    expect(new Set([...first.playerIds, ...second.playerIds]).size).toBe(20)
    for (const id of first.teamIds) {
      expect((await apiClient.default.getTeam(id)).players).toHaveLength(5)
    }
  })

  it.each([
    { teamCount: 1, tournamentCount: 0 },
    { teamCount: 33, tournamentCount: 0 },
    { teamCount: 2.5, tournamentCount: 0 },
    { teamCount: 2, tournamentCount: -1 },
    { teamCount: 2, tournamentCount: 11 },
    { teamCount: 2, tournamentCount: 0.5 },
  ])('rejects invalid generation counts: %j', async request => {
    await expect(apiClient.default.generateData(request)).rejects.toMatchObject({
      status: 400,
      body: { status: 400, message: 'Validation Failed', code: 'VALIDATION_ERROR' },
    })
  })
})

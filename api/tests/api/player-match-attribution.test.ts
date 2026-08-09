import { AllPlayerStats, PlayerApiModel, TeamStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenPlayedMatchExists, cleanupPlayedMatch, getPlayedMatch, PlayedMatchFixture } from '@tests/api/common-stats'

describe('Player match win attribution', () => {
  let fixture: PlayedMatchFixture
  let winnerTeamId: number | undefined
  let winningPlayerId: number
  let losingPlayerId: number

  beforeAll(async () => {
    fixture = await givenPlayedMatchExists('PMA')
    const match = await getPlayedMatch(fixture.matchId)
    winnerTeamId = match.winner_id

    const team1Won = winnerTeamId === fixture.team1Id
    winningPlayerId = team1Won ? fixture.team1PlayerIds[0] : fixture.team2PlayerIds[0]
    losingPlayerId = team1Won ? fixture.team2PlayerIds[0] : fixture.team1PlayerIds[0]
  }, 120_000)

  afterAll(async () => {
    await cleanupPlayedMatch(fixture)
  }, 60_000)

  it('produces a decided match', () => {
    expect(winnerTeamId).toBeTruthy()
    expect([fixture.team1Id, fixture.team2Id]).toContain(winnerTeamId)
  })

  it('credits the win only to players on the winning team', async () => {
    const winner = await apiClient.default.getPlayerStats(winningPlayerId) as AllPlayerStats
    const loser = await apiClient.default.getPlayerStats(losingPlayerId) as AllPlayerStats

    expect(winner.totalMatchesPlayed).toBe(1)
    expect(winner.totalMatchesWon).toBe(1)
    expect(winner.totalMatchesLost).toBe(0)

    expect(loser.totalMatchesPlayed).toBe(1)
    expect(loser.totalMatchesWon).toBe(0)
    expect(loser.totalMatchesLost).toBe(1)
  })

  it('agrees with the team stats for the same match', async () => {
    const teamStats = await apiClient.default.getTeamStats(winnerTeamId!) as TeamStats
    const playerStats = await apiClient.default.getPlayerStats(winningPlayerId) as AllPlayerStats

    expect(playerStats.totalMatchesWon).toBe(teamStats.totalMatchesWon)
    expect(playerStats.totalMapsWon).toBe(teamStats.totalMapsWon)
    expect(playerStats.totalMapsPlayed).toBe(teamStats.totalMapsPlayed)
  })

  it('keeps historical results with the team the player actually played for after a transfer', async () => {
    const before = await apiClient.default.getPlayerStats(winningPlayerId) as AllPlayerStats
    const player = await apiClient.default.getPlayer(winningPlayerId) as PlayerApiModel
    const otherTeamId = winnerTeamId === fixture.team1Id ? fixture.team2Id : fixture.team1Id

    // WHEN the player transfers to the team they beat
    await apiClient.default.updatePlayer(winningPlayerId, { ...player, team_id: otherTeamId })

    try {
      const after = await apiClient.default.getPlayerStats(winningPlayerId) as AllPlayerStats

      // THEN the already-played match is still recorded as a win, because the
      // side they played on is stored per game rather than read from the
      // player's current team.
      expect(after.totalMatchesWon).toBe(before.totalMatchesWon)
      expect(after.totalMatchesLost).toBe(before.totalMatchesLost)
      expect(after.totalMapsWon).toBe(before.totalMapsWon)
      expect(after.totalMapsLost).toBe(before.totalMapsLost)
      expect(after.winrate).toBe(before.winrate)
      expect(after.mapWinrate).toBe(before.mapWinrate)
    } finally {
      await apiClient.default.updatePlayer(winningPlayerId, { ...player, team_id: winnerTeamId! })
    }
  })
})

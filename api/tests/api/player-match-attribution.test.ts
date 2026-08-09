import { AllPlayerStats, PlayerApiModel, TeamStats } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import {
  givenPlayedMatchExists,
  cleanupPlayedMatch,
  splitByMatchResult,
  PlayedMatchFixture,
} from '@tests/api/common-stats'
import { HOOK_TIMEOUT_MS } from '@tests/api/common-utils'

/** Every fixture player took part in exactly one match: the one that was played. */
const MATCHES_PLAYED = 1

describe('Player result attribution', () => {
  // GIVEN two full rosters that have played every game of one match
  let fixture: PlayedMatchFixture
  let winningPlayer: PlayerApiModel
  let losingPlayer: PlayerApiModel
  let winningTeamId: number
  let losingTeamId: number

  beforeAll(async () => {
    fixture = await givenPlayedMatchExists('PATTR')
    const result = splitByMatchResult(fixture)
    winningPlayer = result.winningPlayers[0]
    losingPlayer = result.losingPlayers[0]
    winningTeamId = result.winningTeamId
    losingTeamId = result.losingTeamId
  }, HOOK_TIMEOUT_MS.PLAYED_MATCH_FIXTURE)

  afterAll(async () => {
    await cleanupPlayedMatch(fixture)
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)

  it('decides the match in favour of one of the two fixture teams', () => {
    expect(fixture.match.winner_id).toBeTruthy()
    expect([fixture.match.team1_id, fixture.match.team2_id]).toContain(fixture.match.winner_id)
  })

  it('credits the match win to the winning side only', async () => {
    const winner = await apiClient.default.getPlayerStats(winningPlayer.id!) as AllPlayerStats
    const loser = await apiClient.default.getPlayerStats(losingPlayer.id!) as AllPlayerStats

    expect(winner.totalMatchesPlayed).toBe(MATCHES_PLAYED)
    expect(winner.totalMatchesWon).toBe(MATCHES_PLAYED)
    expect(winner.totalMatchesLost).toBe(0)

    expect(loser.totalMatchesPlayed).toBe(MATCHES_PLAYED)
    expect(loser.totalMatchesWon).toBe(0)
    expect(loser.totalMatchesLost).toBe(MATCHES_PLAYED)
  })

  it('agrees with the team stats for the same match', async () => {
    const teamStats = await apiClient.default.getTeamStats(winningTeamId) as TeamStats
    const playerStats = await apiClient.default.getPlayerStats(winningPlayer.id!) as AllPlayerStats

    expect(playerStats.totalMatchesWon).toBe(teamStats.totalMatchesWon)
    expect(playerStats.totalMapsWon).toBe(teamStats.totalMapsWon)
    expect(playerStats.totalMapsPlayed).toBe(teamStats.totalMapsPlayed)
  })

  it('keeps a played result with the team the player played for after a transfer', async () => {
    const before = await apiClient.default.getPlayerStats(winningPlayer.id!) as AllPlayerStats
    const player = await apiClient.default.getPlayer(winningPlayer.id!) as PlayerApiModel

    // WHEN the player transfers to the team they just beat
    await apiClient.default.updatePlayer(winningPlayer.id!, { ...player, team_id: losingTeamId })

    try {
      const after = await apiClient.default.getPlayerStats(winningPlayer.id!) as AllPlayerStats

      // THEN the already-played match is still a win, because the side played is
      // stored per game rather than read from the player's current team.
      expect(after.totalMatchesWon).toBe(before.totalMatchesWon)
      expect(after.totalMatchesLost).toBe(before.totalMatchesLost)
      expect(after.totalMapsWon).toBe(before.totalMapsWon)
      expect(after.totalMapsLost).toBe(before.totalMapsLost)
      expect(after.winrate).toBe(before.winrate)
      expect(after.mapWinrate).toBe(before.mapWinrate)
    } finally {
      await apiClient.default.updatePlayer(winningPlayer.id!, { ...player, team_id: winningTeamId })
    }
  })

  it('keeps map wins attributed to the side the player played on', async () => {
    const winner = await apiClient.default.getPlayerStats(winningPlayer.id!) as AllPlayerStats
    const loser = await apiClient.default.getPlayerStats(losingPlayer.id!) as AllPlayerStats

    // The two sides played the same maps, so their map counts must complement.
    expect(winner.totalMapsPlayed).toBe(loser.totalMapsPlayed)
    expect(winner.totalMapsWon).toBe(loser.totalMapsLost)
    expect(winner.totalMapsLost).toBe(loser.totalMapsWon)
  })
})

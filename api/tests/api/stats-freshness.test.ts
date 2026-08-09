import {
  AllPlayerStats,
  GameApiModel,
  ItemsWithPagination_MatchApiModel_,
  PlayerApiModel,
  TeamApiModel,
  TeamStats,
} from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER_ATTRIBUTES } from '@tests/api/common-players'
import { givenTournamentExists, cleanupTournament } from '@tests/api/common-tournaments'
import { HOOK_TIMEOUT_MS } from '@tests/api/common-utils'

/** Large enough to hold every team and player the suite could encounter. */
const WHOLE_LIST = 500
/** A full Valorant side. */
const PLAYERS_PER_TEAM = 5

/**
 * Reads one team's entry out of the paginated leaderboard.
 *
 * @param teamId - The team to look for.
 * @returns That team's stats, or undefined when it is not listed.
 */
const readTeamFromLeaderboard = async (teamId: number): Promise<TeamStats | undefined> => {
  const page = await apiClient.default.getTeamsStats(WHOLE_LIST, 0)
  return (page.items as TeamStats[]).find(entry => entry.team.id === teamId)
}

/**
 * Reads one player's entry out of the paginated leaderboard.
 *
 * @param playerId - The player to look for.
 * @returns That player's stats, or undefined when they are not listed.
 */
const readPlayerFromLeaderboard = async (playerId: number): Promise<AllPlayerStats | undefined> => {
  const page = await apiClient.default.getPlayersStats(WHOLE_LIST, 0)
  return (page.items as AllPlayerStats[]).find(entry => entry.player.id === playerId)
}

describe('Stats leaderboard freshness', () => {
  let team1: TeamApiModel
  let team2: TeamApiModel
  let players: PlayerApiModel[]
  let tournamentId: number

  afterAll(async () => {
    await cleanupTournament(tournamentId)
    for (const player of players) {
      await cleanupPlayer(player.id)
    }
    await cleanupTeam(team1.id)
    await cleanupTeam(team2.id)
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)

  beforeAll(async () => {
    // GIVEN the leaderboards have already been read once
    await apiClient.default.getTeamsStats(WHOLE_LIST, 0)
    await apiClient.default.getPlayersStats(WHOLE_LIST, 0)
    players = []
  }, HOOK_TIMEOUT_MS.PLAYED_MATCH_FIXTURE)

  it('lists a team as soon as it is created', async () => {
    // WHEN a team is created after the leaderboard was already read
    team1 = await givenTeamExists({ short_name: 'CINV1', full_name: 'Cache Invalidation 1', country: 'Brazil' })
    team2 = await givenTeamExists({ short_name: 'CINV2', full_name: 'Cache Invalidation 2', country: 'Argentina' })

    // THEN it shows up on the next read
    expect(await readTeamFromLeaderboard(team1.id!)).toBeDefined()
    expect(await readTeamFromLeaderboard(team2.id!)).toBeDefined()
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)

  it('lists a player as soon as they are created', async () => {
    // WHEN players are created after the leaderboard was already read
    for (let position = 1; position <= PLAYERS_PER_TEAM; position++) {
      players.push(await givenPlayerExists(team1.id!, {
        nickname: `cinv1_player${position}`,
        player_attributes: TEST_PLAYER_ATTRIBUTES,
      }))
      players.push(await givenPlayerExists(team2.id!, {
        nickname: `cinv2_player${position}`,
        player_attributes: TEST_PLAYER_ATTRIBUTES,
      }))
    }

    // THEN they show up immediately, with no games recorded yet
    const listed = await readPlayerFromLeaderboard(players[0].id!)
    expect(listed).toBeDefined()
    expect(listed!.totalMatchesPlayed).toBe(0)
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)

  it('reflects a played match in both leaderboards straight away', async () => {
    // GIVEN a scheduled match between the two teams, and leaderboards showing
    // no games played for either of them
    const tournament = await givenTournamentExists([team1.id!, team2.id!])
    tournamentId = tournament.id!

    const schedule = await apiClient.default.getTournamentSchedule(tournamentId, 10, 0) as ItemsWithPagination_MatchApiModel_
    const matchId = schedule.items[0].id!

    expect((await readTeamFromLeaderboard(team1.id!))!.totalMapsPlayed).toBe(0)
    expect((await readPlayerFromLeaderboard(players[0].id!))!.totalMapsPlayed).toBe(0)

    // WHEN every game of that match is played
    const games = await apiClient.default.getGamesByMatch(matchId) as GameApiModel[]
    for (const game of games) {
      await apiClient.default.playGame(game.id!)
    }

    // THEN the very next read reflects it
    expect((await readTeamFromLeaderboard(team1.id!))!.totalMapsPlayed).toBeGreaterThan(0)
    expect((await readTeamFromLeaderboard(team2.id!))!.totalMapsPlayed).toBeGreaterThan(0)
    expect((await readPlayerFromLeaderboard(players[0].id!))!.totalMapsPlayed).toBeGreaterThan(0)
  }, HOOK_TIMEOUT_MS.PLAYED_MATCH_FIXTURE)

  it('reflects a player transfer in the leaderboard straight away', async () => {
    // GIVEN a player currently listed against their original team
    const player = players[0]
    expect((await readPlayerFromLeaderboard(player.id!))!.team!.id).toBe(team1.id)

    // WHEN they transfer
    await apiClient.default.updatePlayer(player.id!, { ...player, team_id: team2.id! })

    try {
      // THEN the leaderboard shows the new team on the next read
      expect((await readPlayerFromLeaderboard(player.id!))!.team!.id).toBe(team2.id)
    } finally {
      await apiClient.default.updatePlayer(player.id!, { ...player, team_id: team1.id! })
    }
  }, HOOK_TIMEOUT_MS.FIXTURE_CLEANUP)
})

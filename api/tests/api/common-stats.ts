import {
  GameApiModel,
  ItemsWithPagination_MatchApiModel_,
  MatchApiModel,
  PlayerApiModel,
} from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { givenTeamExists, cleanupTeam } from '@tests/api/common-teams'
import { givenPlayerExists, cleanupPlayer, TEST_PLAYER_ATTRIBUTES } from '@tests/api/common-players'
import { givenTournamentExists, cleanupTournament } from '@tests/api/common-tournaments'

/** A full Valorant side, so both fixture teams can field a complete roster. */
const PLAYERS_PER_TEAM = 5

/**
 * The entities behind a fully played match.
 *
 * The match and the rosters are the generated api models, so assertions can
 * read `match.winner_id` or `player.team_id` directly. Only the grouping of the
 * three is local — there is no generated model for "a fixture".
 */
export interface PlayedMatchFixture {
  /** The match whose games have all been simulated. */
  match: MatchApiModel
  /** Roster fielded by the match's first team. */
  team1Players: PlayerApiModel[]
  /** Roster fielded by the match's second team. */
  team2Players: PlayerApiModel[]
}

/**
 * GIVEN: two teams with full rosters have played every game of a match.
 *
 * Creates the teams, players and tournament, then plays games through the API
 * until the first scheduled match is decided.
 *
 * @param fixturePrefix - Short prefix applied to the created team short_names
 *                        and player nicknames, so fixtures from different test
 *                        files cannot collide on those unique columns.
 * @returns The played match and both rosters.
 */
export const givenPlayedMatchExists = async (fixturePrefix: string): Promise<PlayedMatchFixture> => {
  const team1 = await givenTeamExists({
    short_name: `${fixturePrefix}1`,
    full_name: `${fixturePrefix} Team 1`,
    country: 'Brazil',
  })
  const team2 = await givenTeamExists({
    short_name: `${fixturePrefix}2`,
    full_name: `${fixturePrefix} Team 2`,
    country: 'Argentina',
  })

  const team1Players: PlayerApiModel[] = []
  const team2Players: PlayerApiModel[] = []
  for (let position = 1; position <= PLAYERS_PER_TEAM; position++) {
    team1Players.push(await givenPlayerExists(team1.id!, {
      nickname: `${fixturePrefix}1_player${position}`,
      player_attributes: TEST_PLAYER_ATTRIBUTES,
    }))
    team2Players.push(await givenPlayerExists(team2.id!, {
      nickname: `${fixturePrefix}2_player${position}`,
      player_attributes: TEST_PLAYER_ATTRIBUTES,
    }))
  }

  const tournament = await givenTournamentExists([team1.id!, team2.id!])
  const schedule = await apiClient.default.getTournamentSchedule(tournament.id!, 10, 0) as ItemsWithPagination_MatchApiModel_
  const scheduledMatch = schedule.items[0]

  const games = await apiClient.default.getGamesByMatch(scheduledMatch.id!) as GameApiModel[]
  for (const game of games) {
    await apiClient.default.playGame(game.id!)
    const match = await apiClient.default.getMatch(scheduledMatch.id!) as MatchApiModel
    if (match.finished && match.winner_id) {
      break
    }
  }

  return {
    match: await apiClient.default.getMatch(scheduledMatch.id!) as MatchApiModel,
    team1Players,
    team2Players,
  }
}

/**
 * Cleanup helper — removes the tournament, players and teams created by
 * givenPlayedMatchExists. Matches and games cascade from the tournament.
 *
 * @param fixture - The fixture returned by givenPlayedMatchExists.
 */
export const cleanupPlayedMatch = async (fixture: PlayedMatchFixture): Promise<void> => {
  await cleanupTournament(fixture.match.tournament_id)
  for (const player of [...fixture.team1Players, ...fixture.team2Players]) {
    await cleanupPlayer(player.id)
  }
  await cleanupTeam(fixture.match.team1_id)
  await cleanupTeam(fixture.match.team2_id)
}

/**
 * Splits a fixture's rosters into the side that won the match and the side that
 * lost it, so tests can assert on each without repeating the lookup.
 *
 * @param fixture - A fixture whose match has been decided.
 * @returns The winning and losing rosters, and their team ids.
 */
export const splitByMatchResult = (fixture: PlayedMatchFixture): {
  winningTeamId: number
  losingTeamId: number
  winningPlayers: PlayerApiModel[]
  losingPlayers: PlayerApiModel[]
} => {
  const team1Won = fixture.match.winner_id === fixture.match.team1_id

  return {
    winningTeamId: team1Won ? fixture.match.team1_id : fixture.match.team2_id,
    losingTeamId: team1Won ? fixture.match.team2_id : fixture.match.team1_id,
    winningPlayers: team1Won ? fixture.team1Players : fixture.team2Players,
    losingPlayers: team1Won ? fixture.team2Players : fixture.team1Players,
  }
}

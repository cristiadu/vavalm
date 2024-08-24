import { Op } from "sequelize"
import Match from "../models/Match"
import { MatchType } from "../models/enums"
import GameService from "./GameService"
import Tournament from "../models/Tournament"
import { getRandomDateBetweenInterval } from "../base/DateUtils"
import Team from "../models/Team"
import Game from "../models/Game"

const MatchService = {
  /**
   * Returns a match by its id.
   *
   * @param id The ID of the match.
   * @returns The match with the given id.
   *
   */
  getMatch: async (id: number): Promise<Match | null> => {
    return await Match.findByPk(id, {
      include: [
        {
          model: Game,
          as: "games",
        },
        {
          model: Tournament,
          as: "tournament",
        },
        {
          model: Team,
          as: "team1",
        },
        {
          model: Team,
          as: "team2",
        },
      ],
    })
  },

  /**
   * Returns a match by its game id.
   *
   * @param gameId The ID of the game.
   * @returns The match with the given game id.
   */
  getMatchByGameId: async (gameId: number): Promise<Match | null> => {
    return await Match.findOne({
      where: {
        game_id: gameId,
      },
    })
  },

  /**
   * Creates team matches for a tournament if needed.
   *
   * @param teamIds ids of the teams to create matches for
   * @param tournamentId id of the tournament to create matches for
   * @param matchType type of the matches to create
   * @returns {Promise<void>} A promise that resolves when the matches have been created.
   */
  createTeamMatchesForTournamentIfNeeded: async (
    teamIds: number[],
    tournament: Tournament,
    matchType: MatchType
  ): Promise<void> => {
    // Create matches for the tournament, all teams play against each other
    // Create only needed matches, however, if a match already exists, it will not be created again
    // Create games inside matches based on the matchType (bo3, bo5, etc).
    teamIds.forEach((team1Id: number, index: number) => {
      teamIds.slice(index + 1).forEach(async (team2Id: number) => {
        // Check if the match already exists
        const existingMatch = await Match.findOne({
          where: {
            tournament_id: tournament.id,
            [Op.or]: [
              {
                [Op.and]: [{ team1_id: team1Id }, { team2_id: team2Id }],
              },
              {
                [Op.and]: [{ team1_id: team2Id }, { team2_id: team1Id }],
              },
            ],
          },
        })
        if (existingMatch) {
          return
        }
        // Create the match
        const match = await Match.create({
          date: getRandomDateBetweenInterval(
            tournament.start_date,
            tournament.end_date
          ),
          tournament_id: tournament.id,
          team1_id: team1Id,
          team1_score: 0,
          team2_score: 0,
          team2_id: team2Id,
          match_type: matchType,
          included_on_standings: false,
        })

        // Create the games for the match
        await GameService.createGamesForMatch(match)
      })
    })
  },

  /**
   * Returns the number of games for a given match type.
   *
   * @param matchType The type of the match.
   * @returns The number of games for the match type.
   * @throws {Error} If the match type is invalid.
   * @returns {number} The number of games for the match type.
   *
   */
  numberOfGamesForMatchType: (matchType: MatchType): number => {
    switch (matchType) {
    case MatchType.BO1:
    case MatchType.FRIENDLY:
    case MatchType.SHOWMATCH:
      return 1
    case MatchType.BO3:
      return 3
    case MatchType.BO5:
      return 5
    default:
      throw new Error("Invalid match type")
    }
  },

  /**
   * Deletes all matches for a given tournament for the specified teams.
   *
   * @param {number} tournamentId - The ID of the tournament to delete matches for.
   * @param {number[]} teamIds - The IDs of the teams to delete matches for.
   * @returns {Promise<void>} A promise that resolves when the matches have been deleted.
   */
  deleteTeamsMatchesFromTournament: async (
    teamIds: number[],
    tournamentId: number
  ): Promise<void> => {
    // Delete the matches by the tournament id.
    await Match.destroy({
      where: {
        tournament_id: tournamentId,
        [Op.or]: [
          { team1_id: { [Op.in]: teamIds } },
          { team2_id: { [Op.in]: teamIds } },
        ],
      },
    })
  },
}

export default MatchService

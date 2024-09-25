import { Op } from "sequelize"

import { getRandomDateBetweenInterval } from "../base/DateUtils"

import Team from "../models/Team"
import Tournament from "../models/Tournament"
import Match from "../models/Match"
import { MatchType } from "../models/enums"
import Game from "../models/Game"

import GameService from "./GameService"
import { ItemsWithPagination } from "../base/types"

const MatchService = {
  getMatchesFromTournament: async (tournamentId: number, limit: number, offset: number): Promise<ItemsWithPagination<Match>> => {
    // Get count of all matches from tournament, then get the matches with limit and offset
    const tournamentMatches = await Match.findAndCountAll({
      where: { tournament_id: tournamentId },
      limit,
      offset,
    })

    return {
      items: tournamentMatches.rows,
      total: tournamentMatches.count,
    } as ItemsWithPagination<Match>
  },

  /**
   * Plays a full match, playing all games in the match in the order they're supposed to be played.
   *
   * @param matchId The ID of the match to play.
   * @returns A promise that resolves when the match has been played.
   * @throws {Error} If the match is not found.
   */
  playFullMatch: async (matchId: number): Promise<void> => {
    const matchWithGamesOrderedByDate = await Match.findByPk(matchId, {
      include: [
        {
          model: Game,
          as: "games",
          where: {
            started: false,
          },
        },
      ],
      order: [[{ model: Game, as: "games" }, "date", "ASC"]],
    })

    if (!matchWithGamesOrderedByDate) {
      throw new Error("Match not found")
    }

    const minMatchesToWin = MatchService.numberOfGamesToWinForMatchType(matchWithGamesOrderedByDate.type)

    // Play all games in the match
    let team1GamesWon = 0
    let team2GamesWon = 0
    for (const game of matchWithGamesOrderedByDate.games) {
      game.started = true
      await game.save()
      const {team1_rounds, team2_rounds} = await GameService.playFullGame(game.id)
      game.finished = true
      await game.save()

      if (team1_rounds > team2_rounds) {
        team1GamesWon++
      } else {
        team2GamesWon++
      }

      if (team1GamesWon >= minMatchesToWin || team2GamesWon >= minMatchesToWin) {
        break
      }
    }
  },

  /**
   * Retrieves all matches that should be played based on a before date.
   * It limits the number of matches to 10 at at time.
   * 
   * @param {Date} before - A date that represents the maximum date for the matches to be played.
   * @returns {Promise<Match[]>} A promise that resolves to an array of games that should be played.
   */
  getMatchesToBePlayed: async (before: Date): Promise<Match[]> => {
    return await Match.findAll({
      where: {
        date: {
          [Op.lte]: before,
        },
        started: false,
      },
      order: [['date', 'ASC']],
      limit: 10,
    })
  },

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
          attributes: ["id", "date", "map"],
        },
        {
          model: Tournament,
          as: "tournament",
          attributes: ["id", "name", "country"],
        },
        {
          model: Team,
          as: "team1",
          attributes: ["id", "short_name", "logo_image_file"],
        },
        {
          model: Team,
          as: "team2",
          attributes: ["id", "short_name", "logo_image_file"],
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
    return await Match.findOne({ include: [{ model: Game, as: "games", where: { id: gameId } }] })
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
          type: matchType,
          included_on_standings: false,
        })

        // Create the games for the match
        await GameService.createGamesForMatch(match)
      })
    })
  },

  /**
   * Returns the winner of a match based on its type.
   *
   * @param match The match to get the winner for.
   * @returns The ID of the winning team or null if there is no winner yet.
   *
   */
  getWinnerForMatchType: (match: Match): number | null => {
    const gamesToWin = MatchService.numberOfGamesToWinForMatchType(match.type)

    if (match.team1_score >= gamesToWin) {
      return match.team1_id
    } else if (match.team2_score >= gamesToWin) {
      return match.team2_id
    } else {
      return null
    }
  },


  /**
   * Returns the number of games to be defined a winner when having a given match type.
   *
   * @param matchType The type of the match.
   * @returns The number of games in order to win.
   * @throws {Error} If the match type is invalid.
   *
   */
  numberOfGamesToWinForMatchType: (matchType: MatchType): number => {
    switch (matchType) {
    case MatchType.BO1:
    case MatchType.FRIENDLY:
    case MatchType.SHOWMATCH:
      return 1
    case MatchType.BO3:
      return 2
    case MatchType.BO5:
      return 3
    default:
      throw new Error("Invalid match type")
    }
  },

  /**
   * Returns the number of games for a given match type.
   *
   * @param matchType The type of the match.
   * @returns The number of games for the match type.
   * @throws {Error} If the match type is invalid.
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

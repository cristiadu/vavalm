import { Op } from "sequelize"
import { Transaction } from "sequelize"

import { getRandomDateBetweenInterval } from '@/base/DateUtils'

import Team from '@/models/Team'
import Tournament from '@/models/Tournament'
import Match from '@/models/Match'
import { MatchType } from '@/models/enums'
import Game from '@/models/Game'

import GameService from '@/services/GameService'
import { ItemsWithPagination } from '@/base/types'
import db from '@/models/db'
import TournamentService from '@/services/TournamentService'
import { MAX_CONCURRENT_MATCHES } from '@/models/constants'

const MatchService = {
  /**
   * Get matches from a tournament with pagination
   * @param tournamentId The tournament ID
   * @param limit Number of matches to return
   * @param offset Number of matches to skip
   * @returns A paginated list of matches
   */
  getMatchesFromTournament: async (tournamentId: number, limit: number, offset: number): Promise<ItemsWithPagination<Match>> => {
    // Get count of all matches from tournament, then get the matches with limit and offset
    const tournamentMatches = await Match.findAndCountAll({
      where: { tournament_id: tournamentId },
      order: [['date', 'ASC'], ['id', 'ASC']],
      limit,
      offset,
    })

    return new ItemsWithPagination<Match>(tournamentMatches.rows, tournamentMatches.count)
  },

  /**
   * Fully plays a match by simulating its games until one team wins the series.
   * Uses database transactions to ensure data consistency.
   * 
   * @param {number} matchId - The ID of the match to be played.
   * @returns {Promise<void>} A promise that resolves when all games have been played.
   * @throws {Error} If the match is not found.
   */
  playFullMatch: async (matchId: number): Promise<void> => {
    let tournamentId: number | null = null

    await db.sequelize.transaction(async (transaction: Transaction) => {
      const match = await Match.findByPk(matchId, { transaction })
      if (!match) {
        throw new Error('Match not found')
      }
      tournamentId = match.tournament_id

      // Ensure all expected games exist for this match type.
      await GameService.createGamesForMatch(match)

      // Get all games for the match
      const matchGames = await Game.findAll({
        where: { match_id: matchId },
        order: [['date', 'ASC'], ['id', 'ASC']],
        transaction,
      })

      const gamesToWin = MatchService.numberOfGamesToWinForMatchType(match.type)
      let team1Wins = 0
      let team2Wins = 0

      // Loop through games in order. Once the series is decided, mark the
      // remaining games as finished without playing them.
      for (const game of matchGames) {
        const seriesIsDecided = team1Wins >= gamesToWin || team2Wins >= gamesToWin
        if (seriesIsDecided) {
          if (!game.finished) {
            game.finished = true
            await game.save({ transaction })
          }
          continue
        }

        const { team1_rounds, team2_rounds } = await GameService.playFullGame(game.id)

        const isTeam1GameWinner = team1_rounds > team2_rounds
        const isTeam2GameWinner = team2_rounds > team1_rounds

        if (!isTeam1GameWinner && !isTeam2GameWinner) {
          throw new Error(`Invalid game result for game ${game.id}: tied rounds`)
        }

        team1Wins += isTeam1GameWinner ? 1 : 0
        team2Wins += isTeam2GameWinner ? 1 : 0
      }

      match.team1_score = team1Wins
      match.team2_score = team2Wins
      match.finished = true
      const winnerId = MatchService.getWinnerForMatchType(match)
      if (winnerId !== null) {
        match.winner_id = winnerId
      }

      await match.save({ transaction })
    })

    // Update tournament standings only after match updates are committed.
    if (tournamentId) {
      await TournamentService.updateStandingsAndWinner(tournamentId)
    }
  },

  /**
   * Updates a match's status fields
   * 
   * @param {number} matchId - The ID of the match to update
   * @param {object} statusUpdate - The status fields to update
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  updateMatchStatus: async (matchId: number, statusUpdate: {
    started?: boolean;
    finished?: boolean;
  }): Promise<boolean> => {
    try {
      const match = await Match.findByPk(matchId)
      if (!match) {
        console.error(`Match ${matchId} not found for status update`)
        return false
      }

      // Update the fields that were provided
      if (typeof statusUpdate.started !== 'undefined') {
        match.started = statusUpdate.started
      }

      if (typeof statusUpdate.finished !== 'undefined') {
        match.finished = statusUpdate.finished
      }

      await match.save()
      return true
    } catch (error) {
      console.error(`Error updating match ${matchId} status:`, error)
      return false
    }
  },

  /**
   * Retrieves the next batch of unstarted matches up to MAX_CONCURRENT_MATCHES,
   * ordered by date ascending across all tournaments.
   *
   * @param {Date} before - Upper bound for the match date (inclusive).
   * @returns {Promise<Match[]>} Matches to play next.
   */
  getMatchesToBePlayed: async (before: Date): Promise<Match[]> => {
    return await Match.findAll({
      where: {
        date: { [Op.lte]: before },
        started: false,
      },
      order: [['date', 'ASC'], ['id', 'ASC']],
      limit: MAX_CONCURRENT_MATCHES,
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
          separate: true,
          order: [['date', 'ASC'], ['id', 'ASC']],
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
    matchType: MatchType,
  ): Promise<void> => {
    // Create matches for the tournament, all teams play against each other
    // Create only needed matches, however, if a match already exists, it will not be created again
    // Create games inside matches based on the matchType (bo3, bo5, etc).
    for (let index = 0; index < teamIds.length; index++) {
      const team1Id = teamIds[index]
      for (const team2Id of teamIds.slice(index + 1)) {
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
          continue
        }
        // Create the match
        const match = await Match.create({
          date: getRandomDateBetweenInterval(
            tournament.start_date,
            tournament.end_date,
          ),
          tournament_id: tournament.id,
          team1_id: team1Id,
          team1_score: 0,
          team2_id: team2Id,
          team2_score: 0,
          type: matchType,
          winner_id: null,
          standings_processed: false,
          started: false,
          finished: false,
        })

        // Create the games
        const bestOf = MatchService.numberOfGamesForMatchType(matchType)
        for (let i = 0; i < bestOf; i++) {
          await GameService.createGameForMatch(match, GameService.getRandomMap())
        }
      }
    }
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
    tournamentId: number,
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

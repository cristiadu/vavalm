import Game from "../models/Game"
import GameStats from "../models/GameStats"
import Player from "../models/Player"
import PlayerGameStats from "../models/PlayerGameStats"
import Team from "../models/Team"
import RoundService from "./RoundService"
import Tournament from "../models/Tournament"
import { Op } from "sequelize"
import GameStatsService from "./GameStatsService"
import { GameMap } from "../models/enums"
import { getRandomDateThisYear } from "../base/DateUtils"
import TournamentService from "./TournamentService"

const GameService = {
  getGame: async (game_id: number): Promise<Game> => {
    const game = await Game.findByPk(game_id, {
      include: [
        {
          model: GameStats,
          as: 'stats',
          include: [
            { model: Team, as: 'team1' },
            { model: Team, as: 'team2' },
            { model: Team, as: 'winner' },
            { model: PlayerGameStats, as: 'players_stats_team1', include: [{ model: Player, as: 'player' }] },
            { model: PlayerGameStats, as: 'players_stats_team2', include: [{ model: Player, as: 'player' }] },
          ],
        },
        {
          model: Tournament,
          as: 'tournament',
          foreignKey: 'tournament_id',
        },
      ],
    })
    if (!game) {
      throw new Error('Game not found')
    }

    return game
  },

  createTeamGamesForTournamentIfNeeded: async (teamIds: number[], tournamentId: number): Promise<void> => {
    // Create games for the tournament, all teams play against each other
    // Create only needed games, however, if a game already exists, it will not be created again
    teamIds.forEach((team1Id: number, index: number) => {
      teamIds.slice(index + 1).forEach(async (team2Id: number) => {
        // Check if the game already exists
        // Check if the game already exists
        const existingGame = await Game.findOne({
          where: {
            tournament_id: tournamentId,
          },
          include: [ 
            { 
              model: GameStats, 
              as: 'stats', 
              where: {
                [Op.or]: [
                  {
                    [Op.and]: [
                      { team1_id: team1Id },
                      { team1_id: team2Id },
                    ],
                  },
                  {
                    [Op.and]: [
                      { team1_id: team2Id },
                      { team1_id: team1Id },
                    ],
                  },
                ],
              },
            },
          ],
        })

        if (existingGame) {
          return
        }

        const maps = Object.values(GameMap)
        const randomMap = maps[Math.floor(Math.random() * maps.length)]

        const game = await Game.create({
          date: getRandomDateThisYear(),
          map: randomMap,
          tournament_id: tournamentId,
          stats: {
            team1_id: team1Id,
            team2_id: team2Id,
            team1_score: 0,
            team2_score: 0,
          },
        }, {
          include: [
            { model: GameStats, as: 'stats', include: [{ model: PlayerGameStats, as: 'players_stats_team1' }, { model: PlayerGameStats, as: 'players_stats_team2' }] },
          ],
        })
      })
    })
  },

  /**
   * Deletes all games for a given tournament for the specified teams.
   * 
   * @param {number} tournamentId - The ID of the tournament to delete games for.
   * @param {number[]} teamIds - The IDs of the teams to delete games for.
   * @returns {Promise<void>} A promise that resolves when the games have been deleted.
   */
  deleteTeamsGamesFromTournament: async (teamIds: number[], tournamentId: number): Promise<void> => {
    // Find all games for the specified teams in the tournament
    const games = await Game.findAll({
      where: {
        tournament_id: tournamentId,
      },
      include: [{
        model: GameStats,
        as: 'stats',
        where: {
          [Op.or]: [
            { team1_id: { [Op.in]: teamIds } },
            { team2_id: { [Op.in]: teamIds } },
          ],
        },
      }],
    })

    // Extract the IDs of the games to delete
    const gameIds = games.map(game => game.id)

    // Delete the games by their IDs
    await Game.destroy({
      where: {
        id: { [Op.in]: gameIds },
      },
    })
  },

  /**
   * Fully plays an unplayed game based on its ID. 
   * It will count the number of rounds to determine which team won the game.
   * The first team to get 13 rounds wins.
   * 
   * @param {number} game_id - The ID of the game to be played.
   * @returns {Promise<void>} A promise that resolves when the game has been fully played and stats have been updated.
   * @throws {Error} If the game or game stats are not found.
   */
  playFullGame: async (game_id: number): Promise<void> => {
    // Get the game
    const game = await Game.findByPk(game_id)
    if (!game) {
      throw new Error('Game not found')
    }

    // Play the game
    const { team1_rounds, team2_rounds } = await RoundService.playRoundsUntilWin(game_id)

    // Ensure rounds are defined
    if (team1_rounds === undefined || team2_rounds === undefined) {
      throw new Error('Failed to determine the number of rounds won by each team')
    }

    // Update player and game stats
    await GameStatsService.updateAllStats(game_id)

    // Update tournament standings if the game is finished
    await TournamentService.updateStandings(game.tournament_id)
  },


  /**
  * Retrieves the full game statistics along with associated players and teams.
  *
  * This function fetches the game statistics for a given game ID, including detailed information about the teams and players involved.
  *
  * @param {number} game_id - The ID of the game to retrieve statistics for.
  * @returns {Promise<GameStats | null>} - A promise that resolves to the game statistics, or null if no game is found.
  */
  getGameFullStatsWithPlayersAndTeams: async (game_id: number): Promise<GameStats | null> => {
    return await GameStats.findOne({
      where: { game_id: game_id },
      include: [
        { model: Team, as: 'team1', include: [{ model: Player, as: 'players', include: [{ model: Team, as: 'team' }] }] },
        { model: Team, as: 'team2', include: [{ model: Player, as: 'players', include: [{ model: Team, as: 'team' }] }] },
        { model: PlayerGameStats, as: 'players_stats_team1', include: [{ model: Player, as: 'player', include: [{ model: Team, as: 'team' }] }] },
        { model: PlayerGameStats, as: 'players_stats_team2', include: [{ model: Player, as: 'player', include: [{ model: Team, as: 'team' }] }] },
      ],
    })
  },
}

export default GameService

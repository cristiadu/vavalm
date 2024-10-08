import { getRandomTimeBetweenHourInterval } from "../base/DateUtils"

import Team from "../models/Team"
import Player from "../models/Player"
import Match from "../models/Match"
import Game from "../models/Game"
import GameStats from "../models/GameStats"
import { GameMap } from "../models/enums"
import PlayerGameStats from "../models/PlayerGameStats"

import TournamentService from "./TournamentService"
import MatchService from "./MatchService"
import GameStatsService from "./GameStatsService"
import RoundService from "./RoundService"

const GameService = {
  /**
   * Retrieves a game based on its ID.
   * 
   * @param {number} game_id - The ID of the game to retrieve.
   * @returns {Promise<Game>} A promise that resolves to the retrieved game.
   * @throws {Error} If the game is not found.
   * 
   */
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
          model: Match,
          as: 'match',
          foreignKey: 'match_id',
        },
      ],
    })
    if (!game) {
      throw new Error('Game not found')
    }

    return game
  },

  /**
   * Creates a game for a match.
   * 
   * @param {Match} match - The match to create a game for.
   * @returns {Promise<Game>} A promise that resolves to the created game.
   */
  createGameForMatch: async (match: Match, map: GameMap): Promise<Game> => {
    return await Game.create({
      date: getRandomTimeBetweenHourInterval(match.date, 1),
      map: map,
      match_id: match.id,
      stats: {
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        team1_score: 0,
        team2_score: 0,
        included_on_standings: false,
      },
    }, {
      include: [
        { model: GameStats, as: 'stats', include: [{ model: PlayerGameStats, as: 'players_stats_team1' }, { model: PlayerGameStats, as: 'players_stats_team2' }] },
      ],
    })
  },

  /**
   * Creates the necessary games for a match based on its type.
   * 
   * @param {Match} match - The match to create games for.
   * @returns {Promise<Game[]>} A promise that resolves to an array of the created games.
   */
  createGamesForMatch: async (match: Match): Promise<Game[]> => {
    const gamesNumber = MatchService.numberOfGamesForMatchType(match.type)
    const existingGames = await Game.count({
      where: {
        match_id: match.id,
      },
    }) ?? 0 
    const games = []
  
    let maps = Object.values(GameMap)
    for (let i = existingGames; i < gamesNumber; i++) {
      const randomIndex = Math.floor(Math.random() * maps.length)
      const randomMap = maps[randomIndex]
      const game = await GameService.createGameForMatch(match, randomMap)
      games.push(game)
      maps.splice(randomIndex, 1) // Remove the selected map from the list of options
    }
  
    return games
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
  playFullGame: async (game_id: number): Promise<{team1_rounds: number, team2_rounds: number}> => {
    // Get the game
    const game = await Game.findByPk(game_id, {
      include: [{ model: Match, as: 'match' }],
    })
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
    await TournamentService.updateStandingsAndWinner(game.match.tournament_id)

    return { team1_rounds, team2_rounds }
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

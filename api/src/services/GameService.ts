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
import CacheService from "./CacheService"

// Cache TTL constants
const CACHE_TTL = {
  GAME: 60, // 1 minute
  GAME_STATS: 120, // 2 minutes
}

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
    // Try to get from cache first
    const cacheKey = `game-${game_id}`
    const cachedGame = CacheService.get<Game>(cacheKey)
    
    if (cachedGame) {
      return cachedGame
    }
    
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
    
    // Cache the result
    CacheService.set(cacheKey, game, CACHE_TTL.GAME)
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

    // Invalidate caches for this game
    CacheService.delete(`game-${game_id}`)
    CacheService.delete(`game-stats-${game_id}`)

    return { team1_rounds, team2_rounds }
  },

  /**
   * Retrieves the basic game statistics without loading all associated player data.
   * This is a lightweight version of getGameFullStatsWithPlayersAndTeams to reduce memory usage.
   *
   * @param {number} game_id - The ID of the game to retrieve statistics for.
   * @returns {Promise<GameStats | null>} - A promise that resolves to the basic game statistics.
   */
  getBasicGameStats: async (game_id: number): Promise<GameStats | null> => {
    // Try to get from cache first
    const cacheKey = `game-basic-stats-${game_id}`
    const cachedStats = CacheService.get<GameStats | null>(cacheKey)
    
    if (cachedStats) {
      return cachedStats
    }
    
    // Get only the basic game stats without any nested relations
    const data = await GameStats.findOne({
      where: { game_id: game_id },
      attributes: ['id', 'game_id', 'team1_id', 'team2_id', 'team1_score', 'team2_score', 'winner_id'],
    })
    
    // Cache the result
    if (data) {
      CacheService.set(cacheKey, data, CACHE_TTL.GAME_STATS)
    }
    
    return data
  },

  /**
  * Retrieves the full game statistics along with associated players and teams.
  *
  * This function fetches the game statistics for a given game ID, including detailed information about the teams and players involved.
  *
  * @param {number} game_id - The ID of the game to retrieve statistics for.
  * @param {number} page - The page number for pagination (default: 1).
  * @param {number} limit - The number of items per page for pagination (default: 20).
  * @returns {Promise<{ data: GameStats | null, meta: { totalItems: number, totalPages: number, currentPage: number }}>} - A promise that resolves to the game statistics and pagination metadata.
  */
  getGameFullStatsWithPlayersAndTeams: async (
    game_id: number, 
    page = 1, 
    limit = 20,
  ): Promise<{ 
    data: GameStats | null, 
    meta: { 
      totalItems: number, 
      totalPages: number, 
      currentPage: number, 
    },
  }> => {
    // Try to get from cache first
    const cacheKey = `game-stats-${game_id}-page-${page}-limit-${limit}`
    const cachedStats = CacheService.get<{ data: GameStats | null, meta: any }>(cacheKey)
    
    if (cachedStats) {
      return cachedStats
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Get game stats with associated players and teams
    // Note: findOne doesn't support limit and offset directly on includes
    const data = await GameStats.findOne({
      where: { game_id: game_id },
      include: [
        { 
          model: Team, 
          as: 'team1', 
          include: [{ 
            model: Player, 
            as: 'players',
            include: [{ model: Team, as: 'team' }], 
          }], 
        },
        { 
          model: Team, 
          as: 'team2', 
          include: [{ 
            model: Player, 
            as: 'players',
            include: [{ model: Team, as: 'team' }], 
          }], 
        },
        { 
          model: PlayerGameStats, 
          as: 'players_stats_team1',
          include: [{ 
            model: Player, 
            as: 'player', 
            include: [{ model: Team, as: 'team' }], 
          }], 
        },
        { 
          model: PlayerGameStats, 
          as: 'players_stats_team2',
          include: [{ 
            model: Player, 
            as: 'player', 
            include: [{ model: Team, as: 'team' }], 
          }], 
        },
      ],
    })
    
    // Count total items for pagination metadata
    const gameStats = await GameStats.findOne({
      where: { game_id: game_id },
    })
    
    let totalTeam1Players = 0
    let totalTeam2Players = 0
    
    if (gameStats) {
      totalTeam1Players = await Player.count({ 
        where: { team_id: gameStats.team1_id }, 
      })
      
      totalTeam2Players = await Player.count({ 
        where: { team_id: gameStats.team2_id }, 
      })
    }
    
    const totalItems = Math.max(totalTeam1Players, totalTeam2Players)
    const totalPages = Math.ceil(totalItems / limit)
    
    const result = {
      data,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
      },
    }
    
    // Cache the result
    CacheService.set(cacheKey, result, CACHE_TTL.GAME_STATS)
    
    return result
  },
}

export default GameService

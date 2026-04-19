import { getRandomTimeBetweenHourInterval } from "@/base/DateUtils"

import Team from "@/models/Team"
import Player from "@/models/Player"
import Match from "@/models/Match"
import Game from "@/models/Game"
import GameStats from "@/models/GameStats"
import { GameMap } from "@/models/enums"
import PlayerGameStats from "@/models/PlayerGameStats"

import TournamentService from "@/services/TournamentService"
import MatchService from "@/services/MatchService"
import GameStatsService from "@/services/GameStatsService"
import RoundService from "@/services/RoundService"
import CacheService from "@/services/CacheService"
import { CACHE_TTL } from "@/base/CacheConstants"

/**
 * Retrieves a game with its match relation or throws if not found.
 *
 * @param {number} gameId - The game ID.
 * @returns {Promise<Game>} The game with its match relation.
 * @throws {Error} If the game is not found.
 */
const getGameWithMatchOrThrow = async (gameId: number): Promise<Game> => {
  const game = await Game.findByPk(gameId, {
    include: [{ model: Match, as: 'match' }],
  })

  if (!game) {
    throw new Error('Game not found')
  }

  return game
}

/**
 * Retrieves the game stats row for a game or throws if not found.
 *
 * @param {number} gameId - The game ID.
 * @returns {Promise<GameStats>} The game stats row.
 * @throws {Error} If game stats are not found.
 */
const getGameStatsOrThrow = async (gameId: number): Promise<GameStats> => {
  const gameStats = await GameStats.findOne({
    where: { game_id: gameId },
  })

  if (!gameStats) {
    throw new Error('Game stats not found')
  }

  return gameStats
}

/**
 * Retrieves all games from a match in deterministic play order.
 *
 * @param {number} matchId - The match ID.
 * @returns {Promise<Game[]>} Ordered games with winner stats.
 */
const getOrderedMatchGames = async (matchId: number): Promise<Game[]> => {
  return await Game.findAll({
    where: { match_id: matchId },
    order: [['date', 'ASC'], ['id', 'ASC']],
    include: [{ model: GameStats, as: 'stats', attributes: ['winner_id'] }],
  })
}

/**
 * Returns the next playable game id for a match in scheduled order.
 *
 * @param {Match} match - The parent match.
 * @param {Game[]} matchGames - Ordered games from the match.
 * @returns {number | null} Next playable game id, or null when series is decided.
 * @throws {Error} If a game has an invalid winner id.
 */
const getNextPlayableGameId = (match: Match, matchGames: Game[]): number | null => {
  const gamesToWin = MatchService.numberOfGamesToWinForMatchType(match.type)
  let team1Wins = 0
  let team2Wins = 0
  let nextUnplayedGameId: number | null = null

  for (const matchGame of matchGames) {
    const winnerId = matchGame.stats?.winner_id
    if (winnerId === null || winnerId === undefined) {
      nextUnplayedGameId = matchGame.id
      break
    }

    if (winnerId === match.team1_id) {
      team1Wins += 1
      continue
    }

    if (winnerId === match.team2_id) {
      team2Wins += 1
      continue
    }

    throw new Error(`Invalid winner ${winnerId} for game ${matchGame.id}`)
  }

  if (team1Wins >= gamesToWin || team2Wins >= gamesToWin) {
    return null
  }

  return nextUnplayedGameId
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
        standings_processed: false,
      },
    }, {
      include: [
        { model: GameStats, as: 'stats', include: [{ model: PlayerGameStats, as: 'players_stats_team1' }, { model: PlayerGameStats, as: 'players_stats_team2' }] },
      ],
    })
  },

  /**
   * Retrieves all games for a given match.
   * 
   * @param {number} match_id - The ID of the match to retrieve games for.
   * @returns {Promise<Game[]>} A promise that resolves to an array of games.
   */
  getGamesFromMatch: async (match_id: number): Promise<Game[]> => {
    return await Game.findAll({
      where: {
        match_id: match_id,
      },
      order: [['date', 'ASC'], ['id', 'ASC']],
      include: [
        { model: GameStats, as: 'stats' },
        { model: Match, as: 'match' },
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
  
    const maps = Object.values(GameMap)
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
   * Enforces match map order so only the next scheduled unplayed game can be played.
   * 
   * @param {number} game_id - The ID of the game to be played.
   * @returns {Promise<{team1_rounds: number, team2_rounds: number}>} A promise that resolves to the number of rounds won by each team.
   * @throws {Error} If the game or game stats are not found.
   */
  playFullGame: async (game_id: number): Promise<{team1_rounds: number, team2_rounds: number}> => {
    const game = await getGameWithMatchOrThrow(game_id)
    const currentGameStats = await getGameStatsOrThrow(game.id)

    // Idempotency for already finished games.
    if (currentGameStats.winner_id !== null && currentGameStats.winner_id !== undefined) {
      if (!game.finished) {
        game.finished = true
        await game.save()
      }

      return {
        team1_rounds: currentGameStats.team1_score,
        team2_rounds: currentGameStats.team2_score,
      }
    }

    const matchGames = await getOrderedMatchGames(game.match_id)
    const nextPlayableGameId = getNextPlayableGameId(game.match, matchGames)

    if (nextPlayableGameId === null) {
      if (!game.finished) {
        game.finished = true
        await game.save()
      }

      CacheService.delete(`game-${game_id}`)

      return {
        team1_rounds: currentGameStats.team1_score,
        team2_rounds: currentGameStats.team2_score,
      }
    }

    if (nextPlayableGameId !== game.id) {
      return {
        team1_rounds: currentGameStats.team1_score,
        team2_rounds: currentGameStats.team2_score,
      }
    }

    // Play the game
    const { team1_rounds, team2_rounds } = await RoundService.playRoundsUntilWin(game_id)

    // Ensure rounds are defined
    if (team1_rounds === undefined || team2_rounds === undefined) {
      throw new Error('Failed to determine the number of rounds won by each team')
    }

    // Update player and game stats
    await GameStatsService.updateAllStats(game_id)

    game.finished = true
    await game.save()

    // Update tournament standings if the game is finished
    await TournamentService.updateStandingsAndWinner(game.match.tournament_id)

    // Invalidate caches for this game and stats
    CacheService.delete(`game-${game_id}`)
    CacheService.delete(`game-stats-${game_id}`)
    CacheService.delete(`game-basic-stats-${game_id}`)
    CacheService.delete(`game-full-stats-${game_id}`)

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
   * Get a specific game's statistics with pagination support.
   * 
   * @param {number} game_id - The ID of the game to retrieve stats for.
   * @returns {Promise<{ data: GameStats | null }>} - Game statistics.
   */
  getGameStats: async (
    game_id: number,
  ): Promise<GameStats | null> => {
    // Try to get from cache first
    const cacheKey = `game-stats-${game_id}`
    const cachedStats = CacheService.get<GameStats | null>(cacheKey)
    
    if (cachedStats) {
      return cachedStats
    }
        
    // First, get the game stats without pagination
    const gameStats = await GameStats.findOne({
      where: { game_id: game_id },
      include: [
        { model: Team, as: 'team1' },
        { model: Team, as: 'team2' },
        { model: Team, as: 'winner' },
        { model: PlayerGameStats, as: 'players_stats_team1', include: [{ model: Player, as: 'player' }] },
        { model: PlayerGameStats, as: 'players_stats_team2', include: [{ model: Player, as: 'player' }] },
      ],
    })
    
    if (!gameStats) {
      return null
    }
    
    const gameStatsWithTransformerMethods = gameStats.clone()

    // Cache the result
    CacheService.set(cacheKey, gameStatsWithTransformerMethods, CACHE_TTL.GAME_STATS)
    
    return gameStatsWithTransformerMethods
  },

  /**
   * Get all game statistics with players and teams fully loaded.
   * This is used for updating player statistics.
   * 
   * @param {number} game_id - The ID of the game to retrieve stats for.
   * @returns {Promise<{ data: GameStats | null }>} - Complete game statistics with all players and teams.
   */
  getGameFullStatsWithPlayersAndTeams: async (
    game_id: number,
  ): Promise<{
    data: GameStats | null
  }> => {
    // Try to get from cache first
    const cacheKey = `game-full-stats-${game_id}`
    const cachedStats = CacheService.get<{
      data: GameStats | null
    }>(cacheKey)
    
    if (cachedStats) {
      return cachedStats
    }
    
    // Get complete game stats with all relations
    const data = await GameStats.findOne({
      where: { game_id: game_id },
      include: [
        { model: Team, as: 'team1', include: [{ model: Player, as: 'players' }] },
        { model: Team, as: 'team2', include: [{ model: Player, as: 'players' }] },
        { model: Team, as: 'winner' },
        {
          model: PlayerGameStats,
          as: 'players_stats_team1',
          include: [{ model: Player, as: 'player' }],
        },
        {
          model: PlayerGameStats, 
          as: 'players_stats_team2',
          include: [{ model: Player, as: 'player' }],
        },
      ],
    })
    
    const result = {
      data,
    }
    
    // Cache the result
    if (data) {
      CacheService.set(cacheKey, result, CACHE_TTL.GAME_STATS)
    }
    
    return result
  },

  /**
   * Returns a random map from the GameMap enum.
   * 
   * @returns {GameMap} A random map from the GameMap enum.
   */
  getRandomMap: (): GameMap => {
    return Object.values(GameMap)[Math.floor(Math.random() * Object.values(GameMap).length)]
  },
}

export default GameService

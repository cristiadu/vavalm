import Game from "../models/Game"
import GameLog from "../models/GameLog"
import GameStats from "../models/GameStats"
import Player from "../models/Player"
import PlayerGameStats from "../models/PlayerGameStats"
import Team from "../models/Team"
import RoundService from "./RoundService"
import Tournament from "../models/Tournament"

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
    await GameService.updateAllStats(game_id)
  },

  /**
   * Updates all statistics for a given game, including game stats and player stats.
   * 
   * @param {number} game_id - The ID of the game to update statistics for.
   * @returns {Promise<void>} - A promise that resolves when all statistics have been updated.
   */
  updateAllStats: async (game_id: number): Promise<void> => {
    // Update the game stats
    await GameService.updateGameStats(game_id)

    // Update player stats
    await GameService.updatePlayerStats(game_id)
  },

  /**
   * Updates the game statistics for a given game by counting the rounds won by each team.
   * 
   * @param {number} game_id - The ID of the game to update statistics for.
   * @throws Will throw an error if game statistics are not found for the given game ID.
   * @returns {Promise<void>} - A promise that resolves when the game statistics have been updated.
   */
  updateGameStats: async (game_id: number): Promise<void> => {
    const gameStats = await GameStats.findOne({
      where: {
        game_id: game_id,
      },
    })

    if (!gameStats) {
      throw new Error('Game stats not found for updating round count for each team. game_id:' + game_id)
    }

    // Get the logs from the last duel of each round
    const gameLogs = await GameLog.findAll({
      where: {
        game_id: game_id,
        included_on_team_stats: false,
        'round_state.finished': true,
      },
      order: [['round_state.round_number', 'ASC']],
    })

    let team1_rounds = 0
    let team2_rounds = 0
    for (const log of gameLogs) {
      if (log.round_state.team_won) {
        if (log.round_state.team_won.id === gameStats.team1_id) {
          team1_rounds++
        } else if (log.round_state.team_won.id === gameStats.team2_id) {
          team2_rounds++
        }
        log.included_on_team_stats = true
        await log.save()
      }
    }

    if (team1_rounds > 0 || team2_rounds > 0) {
      gameStats.team1_score += team1_rounds
      gameStats.team2_score += team2_rounds

      // If a team has won 13 rounds, they might be the winner
      // However, there's a possibility of overtime, so we need to check that if one team has 13 rounds, the other team has to have at most 11 rounds for the first team to be declared the winner
      // If both teams have 12 rounds, overtime is played to determine the winner, winner is the first team to win 2 rounds in a row (that being 14-12 or 15-13, or 16-14, etc)
      if (gameStats.team1_score >= 13 || gameStats.team2_score >= 13) {
        if (gameStats.team1_score >= (gameStats.team2_score + 2)) {
          gameStats.winner_id = gameStats.team1_id
        } else if (gameStats.team2_score >= (gameStats.team1_score + 2)) {
          gameStats.winner_id = gameStats.team2_id
        }
      }

      await gameStats.save()
    }
  },

  /**
   * Retrieves a map of player IDs to their game stats for a given game.
   * If a player does not have game stats for the specified game, it initializes them with default values.
   * 
   * @param {Player[]} players - The list of players to initialize stats for.
   * @param {number} gameStatsId - The ID of the game stats.
   * @returns {Promise<Map<number, PlayerGameStats>>} A map of player IDs to their game stats.
   */
  getPlayerIdToStatsMap: async (players: Player[], gameStatsId: number, team1Or2: number): Promise<Map<number, PlayerGameStats>> => {
    const playerIdToStats: Map<number, PlayerGameStats> = new Map()
    for (const player of players) {
      const playerGameStats: PlayerGameStats = await PlayerGameStats.findOne({
        where: {
          player_id: player.id,
          [team1Or2 === 1 ? 'game_stats_player1_id' : 'game_stats_player2_id']: gameStatsId,
        },
      })
        || new PlayerGameStats({
          player_id: player.id,
          [team1Or2 === 1 ? 'game_stats_player1_id' : 'game_stats_player2_id']: gameStatsId,
          kills: 0,
          deaths: 0,
          assists: 0,
        })

      await playerGameStats.save()
      playerIdToStats.set(player.id, playerGameStats)
    }
    return playerIdToStats
  },

  /**
   * Updates the player statistics based on game logs.
   * 
   * @param {GameStats} gameStats - The game stats object containing information about the game.
   * @returns {Promise<void>} A promise that resolves when the player stats have been updated.
   * 
   * This function performs the following steps:
   * 1. Retrieves all game logs for the given game.
   * 2. Retrieves or initializes the PlayerGameStats objects for all players involved in the game.
   * 3. Updates the player stats based on the game logs, but only for logs that have not been included in player stats yet.
   * 4. Saves the updated player stats to the database.
   */
  updatePlayerStats: async (game_id: number): Promise<void> => {
    try {
      const gameStats = await GameService.getGameFullStatsWithPlayersAndTeams(game_id)

      if (!gameStats) {
        throw new Error('Game stats not found for updating player stats for each team. game_id:' + game_id)
      }

      // get all the game logs that were not included in player stats
      const gameLogs = await GameLog.findAll({
        where: {
          game_id: gameStats.game_id,
          included_on_player_stats: false,
        },
        include: [
          { model: Player, as: 'team1_player' },
          { model: Player, as: 'team2_player' },
          { model: Player, as: 'player_killed' },
        ],
      })

      console.log('Updating player stats for game:', gameStats.game_id)

      // Create the PlayerGameStats object for all players involved in this game, but dont save it yet.
      const playerIdToStatsTeam1 = await GameService.getPlayerIdToStatsMap(gameStats.team1.players as Player[], gameStats.id as number, 1)
      const playerIdToStatsTeam2 = await GameService.getPlayerIdToStatsMap(gameStats.team2.players as Player[], gameStats.id as number, 2)

      // Update the player stats
      for (const log of gameLogs) {
        // Create the PlayerGameStats for all players involved in this game
        const playerStatsTeam1 = playerIdToStatsTeam1.get(log.team1_player_id)
        const playerStatsTeam2 = playerIdToStatsTeam2.get(log.team2_player_id)
        if (playerStatsTeam1 && playerStatsTeam2) {
          playerStatsTeam1.kills += log.team1_player_id !== log.player_killed_id ? 1 : 0
          playerStatsTeam1.deaths += log.team1_player_id === log.player_killed_id ? 1 : 0
          playerStatsTeam1.assists += log.trade && log.team1_player_id === log.player_killed_id ? 1 : 0

          playerStatsTeam2.kills += log.team2_player_id !== log.player_killed_id ? 1 : 0
          playerStatsTeam2.deaths += log.team2_player_id === log.player_killed_id ? 1 : 0
          playerStatsTeam2.assists += log.trade && log.team2_player_id === log.player_killed_id ? 1 : 0

          log.included_on_player_stats = true
          await log.save()
        } else {
          console.log(`Log ${log} already included on player stats`)
        }
      }

      // Save the player stats
      for (const playerStats of playerIdToStatsTeam1.values()) {
        await playerStats.save()
      }

      for (const playerStats of playerIdToStatsTeam2.values()) {
        await playerStats.save()
      }
    } catch (error) {
      console.error('Error updating player stats:', error)
    }
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

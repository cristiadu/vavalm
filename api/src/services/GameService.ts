import Game from "../models/Game"
import GameLog from "../models/GameLog"
import GameStats from "../models/GameStats"
import Player from "../models/Player"
import PlayerGameStats from "../models/PlayerGameStats"
import Team from "../models/Team"
import RoundService from "./RoundService"

const GameService = {
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

    // Get the game stats
    const gameStats = await GameService.getGameFullStatsWithPlayersAndTeams(game_id)
    if (!gameStats) {
      throw new Error('Game stats not found')
    }

    // Play the game
    const { team1_rounds, team2_rounds } = await RoundService.playRoundsUntilWin(game_id)

    // Ensure rounds are defined
    if (team1_rounds === undefined || team2_rounds === undefined) {
      throw new Error('Failed to determine the number of rounds won by each team')
    }

    // Update the game stats
    await GameService.updateGameStats(gameStats, team1_rounds, team2_rounds)

    // Update player stats
    await GameService.updatePlayerStats(gameStats)
  },

  /**
   * Updates the game stats with the final scores and winner.
   * 
   * @param {GameStats} gameStats - The game stats object.
   * @param {number} team1_rounds - The number of rounds won by team 1.
   * @param {number} team2_rounds - The number of rounds won by team 2.
   * @returns {Promise<void>} A promise that resolves when the game stats have been updated.
   */
  updateGameStats: async (gameStats: GameStats, team1_rounds: number, team2_rounds: number): Promise<void> => {
    gameStats.team1_score = team1_rounds
    gameStats.team2_score = team2_rounds
    if (team1_rounds === 13 || team2_rounds === 13) {
      gameStats.winner_id = team1_rounds == 13 ? gameStats.team1_id : gameStats.team2_id
    }
    await gameStats.save()
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
        where: { player_id: player.id, [team1Or2 === 1 ? 'game_stats_player1_id' : 'game_stats_player2_id']: gameStatsId },
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
  updatePlayerStats: async (gameStats: GameStats): Promise<void> => {
    try {
      // get all the game logs
      const gameLogs = await GameLog.findAll({
        where: { game_id: gameStats.game_id }, include: [
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
        if (!log.included_on_player_stats) {
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

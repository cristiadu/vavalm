import GameLog from '@/models/GameLog'
import GameStats from '@/models/GameStats'
import Player from '@/models/Player'
import PlayerGameStats from '@/models/PlayerGameStats'

type GameStatsTeam = 1 | 2

const GameStatsService = {
  /**
   * Updates all statistics for a given game, including game stats and player stats.
   * 
   * @param {number} game_id - The ID of the game to update statistics for.
   */
  updateAllStats: async (game_id: number): Promise<void> => {
    // Update the game stats
    await GameStatsService.updateGameStats(game_id)

    // Update player stats
    await GameStatsService.updatePlayerStats(game_id)
  },

  /**
   * Updates the game statistics for a given game by counting the rounds won by each team.
   * 
   * @param {number} game_id - The ID of the game to update statistics for.
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
      order: [['round_state.round', 'ASC']],
    })

    let team1_rounds = 0
    let team2_rounds = 0
    const processedLogIds: number[] = []
    for (const log of gameLogs) {
      if (log.round_state.team_won) {
        if (log.round_state.team_won.id === gameStats.team1_id) {
          team1_rounds++
        } else if (log.round_state.team_won.id === gameStats.team2_id) {
          team2_rounds++
        }
        if (log.id !== undefined) {
          processedLogIds.push(log.id)
        }
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

      await Promise.all([
        gameStats.save(),
        GameLog.update(
          { included_on_team_stats: true },
          { where: { id: processedLogIds } },
        ),
      ])
    }
  },

  /**
   * Retrieves a map of player IDs to their game stats for a given game.
   * If a player does not have game stats for the specified game, it initializes them with default values.
   * 
   * @param {Player[]} players - The list of players to initialize stats for.
   * @param {number} gameStatsId - The ID of the game stats.
   * @param {GameStatsTeam} team1Or2 - The team number (1 or 2) to initialize stats for.
   * @returns {Promise<Map<number, PlayerGameStats>>} A map of player IDs to their game stats.
   */
  getPlayerIdToStatsMap: async (players: Player[], gameStatsId: number, team1Or2: GameStatsTeam): Promise<Map<number, PlayerGameStats>> => {
    const gameStatsForeignKey = team1Or2 === 1 ? 'game_stats_player1_id' : 'game_stats_player2_id'
    const existingPlayerStats = await PlayerGameStats.findAll({
      where: {
        [gameStatsForeignKey]: gameStatsId,
      },
    })
    const existingPlayerIds = new Set(existingPlayerStats.map(playerStats => playerStats.player_id))
    const missingPlayerStats = await PlayerGameStats.bulkCreate(
      players
        .filter(player => !existingPlayerIds.has(player.id))
        .map(player => ({
          player_id: player.id,
          [gameStatsForeignKey]: gameStatsId,
          kills: 0,
          deaths: 0,
          assists: 0,
        })),
    )

    const playerIdToStats: Map<number, PlayerGameStats> = new Map()
    for (const playerGameStats of [...existingPlayerStats, ...missingPlayerStats]) {
      playerIdToStats.set(playerGameStats.player_id, playerGameStats)
    }

    return playerIdToStats
  },

  /**
   * Updates the player statistics based on game logs.
   * 
   * @param {number} game_id - The ID of the game to update player stats for.
   */
  updatePlayerStats: async (game_id: number): Promise<void> => {
    try {
      const gameStats = await GameStats.findOne({ where: { game_id } })

      if (!gameStats) {
        throw new Error('Game stats not found for updating player stats for each team. game_id:' + game_id)
      }

      const [team1Players, team2Players] = await Promise.all([
        Player.findAll({ where: { team_id: gameStats.team1_id } }),
        Player.findAll({ where: { team_id: gameStats.team2_id } }),
      ])

      const [playerIdToStatsTeam1, playerIdToStatsTeam2] = await Promise.all([
        GameStatsService.getPlayerIdToStatsMap(team1Players, gameStats.id as number, 1),
        GameStatsService.getPlayerIdToStatsMap(team2Players, gameStats.id as number, 2),
      ])

      // Get all the game logs that haven't been included in player stats yet
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

      const processedLogIds: number[] = []
      for (const log of gameLogs) {
        // Get the PlayerGameStats for players involved in this game
        const playerStatsTeam1 = playerIdToStatsTeam1.get(log.team1_player_id)
        const playerStatsTeam2 = playerIdToStatsTeam2.get(log.team2_player_id)

        if (playerStatsTeam1 && playerStatsTeam2) {
          playerStatsTeam1.kills += log.team1_player_id !== log.player_killed_id ? 1 : 0
          playerStatsTeam1.deaths += log.team1_player_id === log.player_killed_id ? 1 : 0
          playerStatsTeam2.kills += log.team2_player_id !== log.player_killed_id ? 1 : 0
          playerStatsTeam2.deaths += log.team2_player_id === log.player_killed_id ? 1 : 0

          if(log.trade && log.round_state.previous_duel) {
            const winnerId = log.round_state.previous_duel.winner?.id ?? 0
            const loserId = log.round_state.previous_duel.loser?.id ?? 0
            const tradedPlayerStatsTeam1 = playerIdToStatsTeam1.get(winnerId) || playerIdToStatsTeam1.get(loserId)
            const tradedPlayerStatsTeam2 = playerIdToStatsTeam2.get(winnerId) || playerIdToStatsTeam2.get(loserId)

            if (tradedPlayerStatsTeam1 && tradedPlayerStatsTeam2) {
              tradedPlayerStatsTeam1.assists += log.trade && log.team1_player.team_id !== log.player_killed.team_id ? 1 : 0
              tradedPlayerStatsTeam2.assists += log.trade && log.team2_player.team_id !== log.player_killed.team_id ? 1 : 0
            }
          }

          if (log.id !== undefined) {
            processedLogIds.push(log.id)
          }
        } else {
          console.error('Internal Error while updating player stats for game:', gameStats.game_id)
        }
      }

      await Promise.all([
        ...Array.from(playerIdToStatsTeam1.values(), playerStats => playerStats.save()),
        ...Array.from(playerIdToStatsTeam2.values(), playerStats => playerStats.save()),
        GameLog.update(
          { included_on_player_stats: true },
          { where: { id: processedLogIds } },
        ),
      ])
    } catch (error) {
      console.error('Error updating player stats:', error)
    }
  },
}

export default GameStatsService

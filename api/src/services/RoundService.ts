import Team from "../models/Team"
import Player, { PlayerDuelResults } from "../models/Player"
import GameLog, { RoundState } from "../models/GameLog"
import GameStats from "../models/GameStats"

import DuelService from "./DuelService"

const RoundService = {
  /**
   * Retrieves the last round played in a game.
   * 
   * @param {number} game_id - The ID of the game.
   * @returns {Promise<GameLog[]>} - A promise that resolves to an array of game logs for the last round played.
   */
  getLastRound: async (game_id: number): Promise<GameLog[]> => {
    // Get the last game log to determine the last round played
    const lastGameLog = await GameLog.findOne({
      where: { game_id },
      order: [['id', 'DESC']],
    })

    if (!lastGameLog) {
      console.warn(`No game logs found for game_id: ${game_id}`)
      return []
    }

    return await RoundService.getRound(game_id, lastGameLog.round_state.round)
  },
  
  /**
   * Retrieves a specific round from a game.
   * 
   * @param {number} game_id - The ID of the game.
   * @param {number} round_number - The number of the round to retrieve.
   * @returns {Promise<GameLog[]>} - A promise that resolves to an array of game logs for the specified round.
   */
  getRound: async (game_id: number, round_number: number): Promise<GameLog[]> => {
    return await GameLog.findAll({
      where: {
        game_id: game_id,
        'round_state.round': round_number,
      },
      order: [['id', 'DESC']],
      include: [
        { model: Player, as: 'team1_player' },
        { model: Player, as: 'team2_player' },
      ],
    })
  },
  /**
   * Plays rounds until one team wins 13 rounds or 2 rounds more than the enemy if both get to 12-12 without a winner.
   * 
   * @param {number} game_id - The ID of the game.
   * @returns {Promise<{team1_rounds: number, team2_rounds: number}>} The number of rounds won by each team.
   */
  playRoundsUntilWin: async (game_id: number): Promise<{ team1_rounds: number, team2_rounds: number }> => {
    let round = 1
    let team1_rounds = 0
    let team2_rounds = 0
    let currentRound = null

    while ((team1_rounds < 13 && team2_rounds < 13) || (Math.abs(team1_rounds - team2_rounds) < 2)) {
      currentRound = await RoundService.playFullRound(game_id, round)

      // Ensure currentRound is valid
      if (!currentRound || !currentRound.team1_alive_players || !currentRound.team2_alive_players) {
        throw new Error(`Invalid round data for round ${round - 1}`)
      }

      round += 1
      if (currentRound.team1_alive_players.length === 0) {
        team2_rounds += 1
      } else if (currentRound.team2_alive_players.length === 0) {
        team1_rounds += 1
      }
    }

    return { team1_rounds, team2_rounds }
  },

  /**
   * Plays a full round of the game until the round is finished.
   * 
   * This function will repeatedly call `playRoundStep` until the round is marked as finished.
   * 
   * @param {number} game_id - The ID of the game.
   * @param {number} [round_number=1] - The number of the round to play. Defaults to 1 if not provided.
   * @returns {Promise<RoundState>} - The final state of the round after it is finished.
   */
  playFullRound: async (game_id: number, round_number: number = 1): Promise<RoundState> => {
    // Start the game
    let currentRound: RoundState = await RoundService.createRoundState(game_id, round_number)

    // Check if the initial round state is valid
    if (!currentRound) {
      throw new Error(`Failed to start the round for game_id: ${game_id}, round_number: ${round_number}`)
    }

    // Play the round
    while (!currentRound.finished) {
      currentRound = await DuelService.pickAndPlayDuel(game_id, currentRound)
      // Check if the round state is valid
      if (!currentRound) {
        throw new Error(`Failed to continue the round for game_id: ${game_id}, round_number: ${round_number}`)
      }

      console.debug('round number=', currentRound.round, "isFinished=", currentRound.finished, "team1_alive_players=", currentRound.team1_alive_players.length, "team2_alive_players=", currentRound.team2_alive_players.length)

    }

    // Return the last RoundInfo
    return currentRound
  },

  /**
   * Orchestrates the execution of a single duel and updates the round state.
   *
   * This function retrieves the latest game log for the specified round and continues the round execution from there.
   * If no current round state is found and the round number is 1, it initializes the first round.
   * If the current round is finished or not found, it initializes the next round.
   * It then executes another duel and returns the updated round state for subsequent calls.
   *
   * @param {number} game_id - The ID of the game.
   * @param {number} round_number - The number of the round to play.
   * @returns {Promise<RoundState>} - A promise that resolves to the updated state of the round.
   */
  playRoundStep: async (game_id: number, round_number: number): Promise<RoundState> => {
    // Retrieve the latest game log for the specified round
    try {
      const currentGameLog = await GameLog.findOne({
        where: {
          game_id: game_id,
          'round_state.round': round_number,
        },
        order: [['id', 'DESC']],
        include: [
          { model: Player, as: 'team1_player', include: [{ model: Team, as: 'team' }] },
          { model: Player, as: 'team2_player', include: [{ model: Team, as: 'team' }] },
          { model: Player, as: 'player_killed', include: [{ model: Team, as: 'team' }] },
        ],
      })

      // Determine the current round state
      let currentRound = currentGameLog?.round_state

      if (currentRound == null && round_number === 1) {
        console.info('Starting round: ', round_number)
        currentRound = await RoundService.createRoundState(game_id, round_number)
      } else if (currentRound == null || currentRound.finished) {
        console.info('Starting round: ', round_number + 1)
        currentRound = await RoundService.createRoundState(game_id, round_number + 1)
      }


      // Check if the current round state is valid
      if (!currentRound) {
        throw new Error(`Failed to create/retrieve a valid round state for game_id: ${game_id}, round_number: ${round_number}`)
      }

      // Execute a duel and return the updated round state
      return await DuelService.pickAndPlayDuel(game_id, currentRound)
    } catch (error) {
      console.error('Error playing round step:', error)
      throw error
    }
  },

  /**
   * Creates the initial state for a new round of the game.
   *
   * @param {number} game_id - The ID of the game.
   * @param {number} round_number - The number of the round to start.
   * @returns {Promise<RoundState>} - The initial state of the round.
   */
  createRoundState: async (game_id: number, round_number: number): Promise<RoundState> => {
    const gameStats = await GameStats.findOne({
      where: {game_id: game_id}, 
      include: [
        {model: Team, as: 'team1', include: [{model: Player, as: 'players', include: [{model: Team, as: 'team'}]}]}, 
        {model: Team, as: 'team2', include: [{model: Player, as: 'players', include: [{model: Team, as: 'team'}]}]},
      ],
    })

    if (!gameStats) {
      throw new Error(`Game stats not found for game_id: ${game_id}`)
    }

    return {
      round: round_number,
      duel: {
        winner: null,
        loser: null,
        startedTradeDuel: false,
      } as PlayerDuelResults,
      previous_duel: null,
      team1_alive_players: gameStats.team1.players?.slice(0, 5) || [],
      team2_alive_players: gameStats.team2.players?.slice(0, 5) || [],
      team_won: null,
      finished: false,
    }
  },
}

export default RoundService

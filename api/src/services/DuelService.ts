import GameLog, { RoundState } from "../models/GameLog"
import Player, { PlayerDuel, PlayerDuelResults } from "../models/Player"
import ChanceService from "./ChanceService"

const BASE_TRADE_CHANCE_PERCENTAGE: number = 0.10

const DuelService = {
  /**
   * Randomly picks a player from each team and plays a duel between them.
   * Uses duelSelectBuff and tradeSelectBuff to increase the chances of a player being picked.
   * Duplicates the player in the array to increase the chances of being picked.
   *
   * @param {number} game_id - The ID of the game.
   * @param {RoundState} currentRound - The current state of the round.
   * @returns {Promise<RoundState>} - The updated state of the round after the duel.
   * @throws {Error} - Throws an error if no players are alive in one of the teams or if no players are available for selection.
   */
  pickAndPlayDuel: async (game_id: number, currentRound: RoundState): Promise<RoundState> => {
    if(currentRound.team1_alive_players.length === 0 || currentRound.team2_alive_players.length === 0) {
      throw new Error('No players alive in one of the teams')
    }

    // Randomly pick a player from each team
    // Use duelSelectBuff and tradeSelectBuff to increase the chances of a player being picked
    // So we duplicate the player in the array to increase the chances of being picked
    const team1PlayerAliveChances = currentRound.team1_alive_players.map(player => {
      const selectBuff = (currentRound.isTradeHappening 
        ? ChanceService.getTradeSelectBuffByPlayerRole(player) 
        : ChanceService.getDuelSelectBuffByPlayerRole(player))
      return Array(Math.floor(selectBuff * 100)).fill(player)
    }).flat()

    const team2PlayerAliveChances = currentRound.team2_alive_players.map(player => {
      const selectBuff = (currentRound.isTradeHappening 
        ? ChanceService.getTradeSelectBuffByPlayerRole(player) 
        : ChanceService.getDuelSelectBuffByPlayerRole(player))
      return Array(Math.floor(selectBuff * 100)).fill(player)
    }).flat()

    if (team1PlayerAliveChances.length === 0 || team2PlayerAliveChances.length === 0) {
      throw new Error('No players available for selection')
    }

    // Randomly pick a player from each team based on the calculated chances
    const team1PlayerIndex = Math.floor(Math.random() * team1PlayerAliveChances.length)
    const team2PlayerIndex = Math.floor(Math.random() * team2PlayerAliveChances.length)
    const team1Player = team1PlayerAliveChances[team1PlayerIndex]
    const team2Player = team2PlayerAliveChances[team2PlayerIndex]

    // Pick the player that won
    const duelResults = await DuelService.pickDuelWinner({
      player1: team1Player, 
      player2: team2Player, 
      isTrade: currentRound.isTradeHappening,
    })

    // Ensure duelResults is valid
    if (!duelResults || !duelResults.loser || !duelResults.winner) {
      throw new Error('Invalid duel results')
    }

    // Update the alive players after the duel
    const updatedTeam1AlivePlayers = currentRound.team1_alive_players.filter(player => player.id !== duelResults.loser.id)
    const updatedTeam2AlivePlayers = currentRound.team2_alive_players.filter(player => player.id !== duelResults.loser.id)

    // Check if the round is finished after the duel
    const lastDuelOfRound = updatedTeam1AlivePlayers.length === 0 || updatedTeam2AlivePlayers.length === 0

    // Create the updated round state
    const playedRound = {
      round: currentRound.round,
      isTradeHappening: duelResults.startedTradeDuel,
      team1_alive_players: updatedTeam1AlivePlayers,
      team2_alive_players: updatedTeam2AlivePlayers,
      team_won: lastDuelOfRound ? (updatedTeam1AlivePlayers.length > 0 ? updatedTeam1AlivePlayers[0].team : updatedTeam2AlivePlayers[0].team) : null,
      finished: lastDuelOfRound,
    } as RoundState

    // Save a GameLog with the duel results
    await GameLog.create({
      round_state: playedRound,
      last_duel_of_round: playedRound.finished,
      duel_buff: ChanceService.getDuelWinBuffByPlayerRole(duelResults.winner), 
      trade_buff: ChanceService.getTradeWinBuffByPlayerRole(duelResults.winner), 
      trade: currentRound.isTradeHappening, 
      player_killed: duelResults.loser, 
      game_id: game_id, 
      team1_player_id: team1Player.id, 
      team2_player_id: team2Player.id, 
      player_killed_id: duelResults.loser.id,
    })

    return playedRound
  },

  /**
   * Determines the winner of a duel between two players based on their chances and buffs.
   * 
   * @param duel - The duel object containing the two players and their respective chances.
   * @returns {PlayerDuelResults} - The results of the duel, including the winner, loser, and whether a trade duel should start.
   */
  pickDuelWinner: (duel: PlayerDuel): PlayerDuelResults => {
    // Retrieve the duel chances for both players, including any buffs
    const duelChances = DuelService.getDuelChancesWithBuffs(duel)

    if (!duelChances || 
      !Number.isFinite(duelChances.chancesPlayer1) || 
      !Number.isFinite(duelChances.chancesPlayer2)) {
      throw new Error('Invalid duel chances: chancesPlayer1 and chancesPlayer2 must be valid finite numbers')
    }

    // Generate a random number between 0 and the sum of both players' chances
    const randomNumber = Math.random() * (duelChances.chancesPlayer1 + duelChances.chancesPlayer2)
    console.log(`Chance of winning for ${duel.player1.nickname}: ${duelChances.chancesPlayer1}`)
    console.log(`Chance of winning for ${duel.player2.nickname}: ${duelChances.chancesPlayer2}`)
    console.log(`Random number: ${randomNumber}`)

    // Determine the winner based on the random number
    const winner = randomNumber < duelChances.chancesPlayer1 ? duel.player1 : duel.player2
    console.log(`Player ${winner.nickname} won the duel against ${winner === duel.player1 ? duel.player2.nickname : duel.player1.nickname}!`)
    return {
      winner: winner,
      loser: winner === duel.player1 ? duel.player2 : duel.player1,
      startedTradeDuel: DuelService.shouldTradeHappen(winner),
    }
  },

  /**
   * Determines if a trade should happen after a player wins a duel.
   * The decision is based on a base chance and an additional buff specific to the player's role.
   * 
   * @param duelWinner - The player who won the duel.
   * @returns {boolean} - True if a trade should happen, false otherwise.
   */
  shouldTradeHappen(duelWinner: Player): boolean {
    // Calculate the total trade chance
    const tradeChance = Math.min(BASE_TRADE_CHANCE_PERCENTAGE + ChanceService.getTradeSelectBuffByPlayerRole(duelWinner), 1)

    // Determine if a trade should happen based on the calculated chance
    return Math.random() < tradeChance
  },

  /**
   * Calculates the chances of winning for each player in a duel, considering buffs based on player roles and whether the duel is a trade.
   *
   * This function first determines the appropriate buffs for each player based on their roles and whether the duel is a trade.
   * It then calculates the base chances of winning for each player using their attributes and applies the buffs to these chances.
   *
   * @param {PlayerDuel} duel - The duel object containing information about the players and whether the duel is a trade.
   * @param {Player} duel.player1 - The first player in the duel.
   * @param {Player} duel.player2 - The second player in the duel.
   * @param {boolean} duel.isTrade - Indicates whether the duel is a trade.
   * @returns {{chancesPlayer1: number, chancesPlayer2: number}} - An object containing the chances of winning for each player.
   */
  getDuelChancesWithBuffs: (duel: PlayerDuel): {chancesPlayer1: number, chancesPlayer2: number} => {
    const player1DuelBuff = !duel.isTrade ? ChanceService.getDuelWinBuffByPlayerRole(duel.player1): 0
    const player1TradeBuff = duel.isTrade ? ChanceService.getTradeWinBuffByPlayerRole(duel.player1): 0
    const player2DuelBuff = !duel.isTrade ? ChanceService.getDuelWinBuffByPlayerRole(duel.player2): 0
    const player2TradeBuff = duel.isTrade ? ChanceService.getTradeWinBuffByPlayerRole(duel.player2): 0
    
    const duelChances = ChanceService.getSumOfAttributesChances(duel.player1, duel.player2)
    duelChances.chancesPlayer1 = Math.max(1, duelChances.chancesPlayer1 * (1 + player1DuelBuff + player1TradeBuff))
    duelChances.chancesPlayer2 = Math.max(1, duelChances.chancesPlayer2 * (1 + player2DuelBuff + player2TradeBuff))

    return duelChances
  },

}

export default DuelService

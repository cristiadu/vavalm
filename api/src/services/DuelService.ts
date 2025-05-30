import { randomInt } from "crypto"

import GameLog, { RoundState } from "@/models/GameLog"
import Player, { PlayerDuel, PlayerDuelResults } from "@/models/Player"
import ChanceService from "@/services/ChanceService"
import { Weapon } from "@/models/enums"

const BASE_TRADE_CHANCE_PERCENTAGE: number = 0.10

const DuelService = {
  /**
   * Retrieves the last duel played in a game.
   *  
   * @param {number} game_id - The ID of the game.
   * @returns {Promise<GameLog | null>} - A promise that resolves to the game log for the last duel played or null if none found.
   */
  getLastDuel: async (game_id: number): Promise<GameLog | null> => {
    const lastDuelLog = await GameLog.findOne({
      where: { game_id },
      order: [['id', 'DESC']],
    })

    if (!lastDuelLog) {
      console.warn(`No game logs found for game_id: ${game_id}`)
      return null
    }

    return lastDuelLog
  },

  /**
   * Randomly picks a player from each team to play a duel.
   * Uses duelSelectBuff and tradeSelectBuff to increase the chances of a player being picked.
   * Duplicates the player in the array to increase the chances of being picked.
   * 
   * @param {RoundState} currentRound - The current state of the round.
   * @returns {{team1Player: Player, team2Player: Player}} - The players selected to play the duel.
   * @throws {Error} - Throws an error if no players are alive in one of the teams or if no players are available for selection.
   **/
  chooseDuelPlayers: async (currentRound: RoundState): Promise<{ team1Player: Player, team2Player: Player }> => {
    // If it's a trade duel, we select the winner from the currently finished duel as a player for the next duel
    // Need to account that player can be on team1_alive_players or team2_alive_players
    let team1Player = null
    let team2Player = null
    const currentDuel = currentRound.duel
    if(currentDuel && currentDuel.startedTradeDuel) {
      const duelWinner = currentDuel.winner
      team1Player = currentRound.team1_alive_players.find(player => player.id === duelWinner?.id)
      team2Player = currentRound.team2_alive_players.find(player => player.id === duelWinner?.id)
    }

    let team1PlayerAliveChances = []
    if (!team1Player) {
      team1PlayerAliveChances = currentRound.team1_alive_players.map(player => {
        const selectBuff = (currentDuel?.startedTradeDuel
          ? ChanceService.getTradeSelectBuffByPlayerRole(player)
          : ChanceService.getDuelSelectBuffByPlayerRole(player))
        return Array(Math.floor(selectBuff * 100)).fill(player)
      }).flat()

      const team1PlayerIndex = randomInt(0, team1PlayerAliveChances.length)
      team1Player = team1PlayerAliveChances[team1PlayerIndex]
    }

    let team2PlayerAliveChances = []
    if(!team2Player) {
      team2PlayerAliveChances = currentRound.team2_alive_players.map(player => {
        const selectBuff = (currentDuel?.startedTradeDuel
          ? ChanceService.getTradeSelectBuffByPlayerRole(player)
          : ChanceService.getDuelSelectBuffByPlayerRole(player))
        return Array(Math.floor(selectBuff * 100)).fill(player)
      }).flat()

      const team2PlayerIndex = randomInt(0, team2PlayerAliveChances.length)
      team2Player = team2PlayerAliveChances[team2PlayerIndex]
    }

    // Randomly pick a player from each team based on the calculated chances
    return { team1Player, team2Player }
  },

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
    if (currentRound.team1_alive_players.length === 0 || currentRound.team2_alive_players.length === 0) {
      throw new Error('No players alive in one of the teams')
    }

    const { team1Player, team2Player } = await DuelService.chooseDuelPlayers(currentRound)

    // Pick the player that won
    const duelResults = await DuelService.pickDuelWinner({
      player1: team1Player,
      player2: team2Player,
      isTrade: currentRound.duel?.startedTradeDuel || false,
    })

    // Ensure duelResults is valid
    if (!duelResults || !duelResults.loser || !duelResults.winner) {
      throw new Error('Invalid duel results')
    }

    // Update the alive players after the duel
    const updatedTeam1AlivePlayers = currentRound.team1_alive_players.filter(player => player.id !== duelResults.loser?.id)
    const updatedTeam2AlivePlayers = currentRound.team2_alive_players.filter(player => player.id !== duelResults.loser?.id)

    // Check if the round is finished after the duel
    const lastDuelOfRound = updatedTeam1AlivePlayers.length === 0 || updatedTeam2AlivePlayers.length === 0

    // Create the updated round state
    const playedRound = {
      round: currentRound.round,
      duel: duelResults,
      previous_duel: currentRound.duel,
      team1_alive_players: updatedTeam1AlivePlayers,
      team2_alive_players: updatedTeam2AlivePlayers,
      team_won: lastDuelOfRound ? (updatedTeam1AlivePlayers.length > 0 ? updatedTeam1AlivePlayers[0].team : updatedTeam2AlivePlayers[0].team) : null,
      finished: lastDuelOfRound,
    } as RoundState

    // Save a GameLog with the duel results
    await GameLog.create({
      round_state: playedRound,
      last_duel_of_round: playedRound.finished,
      duel_buff: ChanceService.getDuelWinBuffByPlayerRole(await duelResults.winner.toEntityModel()),
      trade_buff: ChanceService.getTradeWinBuffByPlayerRole(await duelResults.winner.toEntityModel()),
      trade: currentRound.duel?.startedTradeDuel && currentRound.duel.loser?.team_id === playedRound.duel?.winner?.team_id || false,
      game_id: game_id,
      team1_player_id: team1Player.id,
      team2_player_id: team2Player.id,
      player_killed_id: duelResults.loser.id,
      weapon: DuelService.randomValorantWeapon(),
    })
      .then(log => console.debug('GameLog created:', log.game_id, log.team1_player_id, log.team2_player_id, log.player_killed_id, log.round_state.round, log.trade))
      .catch(error => console.error('Error creating GameLog:', error))

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
    const randomNumber = randomInt(0, Math.ceil(duelChances.chancesPlayer1 + duelChances.chancesPlayer2))

    // Determine the winner based on the random number
    const winner = randomNumber < duelChances.chancesPlayer1 ? duel.player1 : duel.player2
    console.debug(`Player ${winner.nickname} won the duel against ${winner === duel.player1 ? duel.player2.nickname : duel.player1.nickname}!`)
    return {
      winner: winner.toApiModel(),
      loser: winner === duel.player1 ? duel.player2.toApiModel() : duel.player1.toApiModel(),
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
    return randomInt(0, 100) < tradeChance * 100
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
  getDuelChancesWithBuffs: (duel: PlayerDuel): { chancesPlayer1: number, chancesPlayer2: number } => {
    const player1DuelBuff = !duel.isTrade ? ChanceService.getDuelWinBuffByPlayerRole(duel.player1) : 0
    const player1TradeBuff = duel.isTrade ? ChanceService.getTradeWinBuffByPlayerRole(duel.player1) : 0
    const player2DuelBuff = !duel.isTrade ? ChanceService.getDuelWinBuffByPlayerRole(duel.player2) : 0
    const player2TradeBuff = duel.isTrade ? ChanceService.getTradeWinBuffByPlayerRole(duel.player2) : 0

    const duelChances = ChanceService.getSumOfAttributesChances(duel.player1, duel.player2)
    duelChances.chancesPlayer1 = Math.max(1, duelChances.chancesPlayer1 * (1 + player1DuelBuff + player1TradeBuff))
    duelChances.chancesPlayer2 = Math.max(1, duelChances.chancesPlayer2 * (1 + player2DuelBuff + player2TradeBuff))

    return duelChances
  },

  /**
   * Randomly selects a weapon from the list of available Valorant weapons.
   * 
   * @returns {Weapon} - The randomly selected Valorant weapon.
   * 
   **/
  randomValorantWeapon: (): Weapon =>  {
    const weapons = Object.values(Weapon)
    return weapons[Math.floor(Math.random() * weapons.length)]
  },
}

export default DuelService

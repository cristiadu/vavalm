import { randomInt } from "crypto"

import GameLog, { RoundState } from "@/models/GameLog"
import Player, { PlayerDuel, PlayerDuelResults } from "@/models/Player"
import ChanceService from "@/services/ChanceService"
import { Weapon } from "@/models/enums"

/** Flat chance that any duel win starts a trade. Select buffs only affect who is picked for that trade. */
const BASE_TRADE_CHANCE_PERCENTAGE: number = 0.10

/**
 * Baseline added to the raw attribute score before role win buffs so equal-attribute
 * duels still reflect duel/trade win buffs instead of collapsing to a 1-vs-1 coin flip.
 */
const BASE_DUEL_CHANCE: number = 1

/** Divisor used to turn a crypto integer into a random number in [0, 1). */
const RANDOM_ZERO_TO_ONE_MAX: number = 1_000_000_000

const DuelService = {
  /**
   * Builds the exact weighted player pool used for duel selection.
   *
   * @param players - Alive players eligible for selection.
   * @param isTrade - Whether trade selection buffs apply.
   * @returns Players repeated according to their role's selection weight.
   */
  getPlayerSelectionPool: (players: Player[], isTrade: boolean): Player[] => {
    return players.flatMap(player => {
      const selectBuff = isTrade
        ? ChanceService.getTradeSelectBuffByPlayerRole(player)
        : ChanceService.getDuelSelectBuffByPlayerRole(player)

      return Array(Math.floor(selectBuff * 100)).fill(player) as Player[]
    })
  },

  /**
   * Calculates the chance that a duel winner starts a trade duel.
   * Trade occurrence uses a flat base rate; trade select buffs only weight who answers the trade.
   *
   * @param _duelWinner - Winner of the prior duel (reserved for callers; not used for rate).
   * @returns Trade probability from zero to one.
   */
  getTradeChance: (_duelWinner: Player): number => {
    return BASE_TRADE_CHANCE_PERCENTAGE
  },

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

    if (!team1Player) {
      const team1PlayerAliveChances = DuelService.getPlayerSelectionPool(
        currentRound.team1_alive_players,
        currentDuel?.startedTradeDuel || false,
      )

      const team1PlayerIndex = randomInt(0, team1PlayerAliveChances.length)
      team1Player = team1PlayerAliveChances[team1PlayerIndex]
    }

    if(!team2Player) {
      const team2PlayerAliveChances = DuelService.getPlayerSelectionPool(
        currentRound.team2_alive_players,
        currentDuel?.startedTradeDuel || false,
      )

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
    const playedRound = new RoundState(
      currentRound.round,
      duelResults,
      updatedTeam1AlivePlayers,
      updatedTeam2AlivePlayers,
      lastDuelOfRound ? (updatedTeam1AlivePlayers.length > 0 ? updatedTeam1AlivePlayers[0].team : updatedTeam2AlivePlayers[0].team) : null,
      lastDuelOfRound,
      currentRound.duel,
    )

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
   * @param duel - The duel object containing the two players and whether this is a trade.
   * @returns The results of the duel, including the winner, loser, and whether a trade duel should start.
   */
  pickDuelWinner: (duel: PlayerDuel): PlayerDuelResults => {
    const duelChances = DuelService.getDuelChancesWithBuffs(duel)

    if (!duelChances ||
      !Number.isFinite(duelChances.chancesPlayer1) ||
      !Number.isFinite(duelChances.chancesPlayer2)) {
      throw new Error('Invalid duel chances: chancesPlayer1 and chancesPlayer2 must be valid finite numbers')
    }

    const total = duelChances.chancesPlayer1 + duelChances.chancesPlayer2
    if (!(total > 0)) {
      throw new Error('Invalid duel chances: total chance must be greater than zero')
    }

    // Random number in [0, 1) so P(player1 wins) === chancesPlayer1 / total (no Math.ceil bias toward team1).
    const randomZeroToOne = randomInt(0, RANDOM_ZERO_TO_ONE_MAX) / RANDOM_ZERO_TO_ONE_MAX
    const winnerSide = DuelService.pickWinnerSide(
      duelChances.chancesPlayer1,
      duelChances.chancesPlayer2,
      randomZeroToOne,
    )
    const winner = winnerSide === 1 ? duel.player1 : duel.player2
    console.debug(`Player ${winner.nickname} won the duel against ${winner === duel.player1 ? duel.player2.nickname : duel.player1.nickname}!`)
    return {
      winner: winner.toApiModel(),
      loser: winner === duel.player1 ? duel.player2.toApiModel() : duel.player1.toApiModel(),
      startedTradeDuel: DuelService.shouldTradeHappen(winner),
    }
  },

  /**
   * Picks player 1 or 2 from their chance weights and a random number in [0, 1).
   *
   * @param chancesPlayer1 - Win weight for player 1 after attributes and the single applicable win buff.
   * @param chancesPlayer2 - Win weight for player 2 after attributes and the single applicable win buff.
   * @param randomZeroToOne - Random number in [0, 1).
   * @returns 1 if player 1 wins, 2 if player 2 wins.
   */
  pickWinnerSide: (
    chancesPlayer1: number,
    chancesPlayer2: number,
    randomZeroToOne: number,
  ): 1 | 2 => {
    const total = chancesPlayer1 + chancesPlayer2
    return randomZeroToOne < (chancesPlayer1 / total) ? 1 : 2
  },

  /**
   * Determines if a trade should happen after a player wins a duel.
   *
   * @param duelWinner - The player who won the duel.
   * @returns True if a trade should happen, false otherwise.
   */
  shouldTradeHappen(duelWinner: Player): boolean {
    const tradeChance = DuelService.getTradeChance(duelWinner)
    return randomInt(0, 100) < tradeChance * 100
  },

  /**
   * Calculates win weights for both players using attributes plus exactly one role win buff.
   * Regular duels use only the duel win buff; trades use only the trade win buff.
   *
   * @param duel - The duel (players + whether it is a trade).
   * @returns Win weights for player 1 and player 2.
   */
  getDuelChancesWithBuffs: (duel: PlayerDuel): { chancesPlayer1: number, chancesPlayer2: number } => {
    const winBuffFor = (player: Player): number => (
      duel.isTrade
        ? ChanceService.getTradeWinBuffByPlayerRole(player)
        : ChanceService.getDuelWinBuffByPlayerRole(player)
    )

    const rawChances = ChanceService.getSumOfAttributesChances(duel.player1, duel.player2)
    return {
      chancesPlayer1: (BASE_DUEL_CHANCE + rawChances.chancesPlayer1) * (1 + winBuffFor(duel.player1)),
      chancesPlayer2: (BASE_DUEL_CHANCE + rawChances.chancesPlayer2) * (1 + winBuffFor(duel.player2)),
    }
  },

  /**
   * Randomly selects a weapon from the list of available Valorant weapons.
   *
   * @returns The randomly selected Valorant weapon.
   */
  randomValorantWeapon: (): Weapon =>  {
    const weapons = Object.values(Weapon)
    return weapons[Math.floor(Math.random() * weapons.length)]
  },
}

export default DuelService

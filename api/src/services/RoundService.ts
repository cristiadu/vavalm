import { PlayerRole } from "../models/enums"
import Player, { PlayerAttributes, PlayerDuel, PlayerDuelResults } from "../models/Player"
import GameLog, { RoundState } from "../models/GameLog"
import Game from "../models/Game"
import GameStats from "../models/GameStats"
import PlayerGameStats from "../models/PlayerGameStats"
import Team from "../models/Team"

const BASE_TRADE_CHANCE_PERCENTAGE: number = 0.10

const RoundService = {
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
    const gameStats = await GameStats.findOne({ where: { game_id: game_id } })
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
    await RoundService.updateGameStats(gameStats, team1_rounds, team2_rounds)

    // Update player stats
    await RoundService.updatePlayerStats(gameStats)
  },

  /**
   * Plays rounds until one team wins 13 rounds.
   * 
   * @param {number} game_id - The ID of the game.
   * @returns {Promise<{team1_rounds: number, team2_rounds: number}>} The number of rounds won by each team.
   */
  playRoundsUntilWin: async (game_id: number): Promise<{ team1_rounds: number, team2_rounds: number }> => {
    let round = 1
    let team1_rounds = 0
    let team2_rounds = 0
    let currentRound = null

    while (team1_rounds < 13 && team2_rounds < 13) {
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
   * Updates the game stats with the final scores and winner.
   * 
   * @param {GameStats} gameStats - The game stats object.
   * @param {number} team1_rounds - The number of rounds won by team 1.
   * @param {number} team2_rounds - The number of rounds won by team 2.
   * @returns {Promise<void>} A promise that resolves when the game stats have been updated.
   */
  updateGameStats: async (gameStats: GameStats, team1_rounds: number, team2_rounds: number): Promise<void> => {
    gameStats.team1_score += team1_rounds
    gameStats.team2_score += team2_rounds
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
  getPlayerIdToStatsMap: async (players: Player[], gameStatsId: number): Promise<Map<number, PlayerGameStats>> => {
    const playerIdToStats: Map<number, PlayerGameStats> = new Map()
    for (const player of players) {
      const playerGameStats: PlayerGameStats = await PlayerGameStats.findOne({ where: { player_id: player.id, game_stats_id: gameStatsId } }) || new PlayerGameStats({
        player_id: player.id,
        game_stats_id: gameStatsId,
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
      const gameLogs = await GameLog.findAll({where: {game_id: gameStats.game_id}})

      // Create the PlayerGameStats object for all players involved in this game, but dont save it yet.
      const playerIdToStatsTeam1 = await RoundService.getPlayerIdToStatsMap(gameStats.team1.players as Player[], gameStats.id as number)
      const playerIdToStatsTeam2 = await RoundService.getPlayerIdToStatsMap(gameStats.team2.players as Player[], gameStats.id as number)

      // Update the player stats
      for (const log of gameLogs) {
      // Create the PlayerGameStats for all players involved in this game
        if(!log.included_on_player_stats) {
          const playerStatsTeam1 = playerIdToStatsTeam1.get(log.team1_player_id)
          const playerStatsTeam2 = playerIdToStatsTeam2.get(log.team2_player_id)
          if (playerStatsTeam1 && playerStatsTeam2) {
            playerStatsTeam1.kills += log.team1_player_id !== log.player_killed_id ? 1 : 0
            playerStatsTeam1.deaths += log.team1_player_id === log.player_killed_id ? 1 : 0
            playerStatsTeam1.assists += log.trade && log.team1_player_id !== log.player_killed_id ? 1 : 0
  
            playerStatsTeam2.kills += log.team2_player_id !== log.player_killed_id ? 1 : 0
            playerStatsTeam2.deaths += log.team2_player_id === log.player_killed_id ? 1 : 0
            playerStatsTeam2.assists += log.trade && log.team2_player_id !== log.player_killed_id ? 1 : 0

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
    let currentRound: RoundState = await RoundService.playRoundStep(game_id, round_number)

    // Check if the initial round state is valid
    if (!currentRound) {
      throw new Error(`Failed to start the round for game_id: ${game_id}, round_number: ${round_number}`)
    }

    // Play the round
    while (!currentRound.finished) {
      currentRound = await RoundService.playRoundStep(game_id, round_number)

      // Check if the round state is valid
      if (!currentRound) {
        throw new Error(`Failed to continue the round for game_id: ${game_id}, round_number: ${round_number}`)
      }
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
        console.log('Starting round: ', round_number)
        currentRound = await RoundService.createRoundState(game_id, round_number)
      } else if (!currentRound || currentRound.finished) {
        console.log('Starting round: ', round_number + 1)
        currentRound = await RoundService.createRoundState(game_id, round_number + 1)
      }

      // Check if the current round state is valid
      if (!currentRound) {
        throw new Error(`Failed to create/retrieve a valid round state for game_id: ${game_id}, round_number: ${round_number}`)
      }

      // Execute a duel and return the updated round state
      return RoundService.pickAndPlayDuel(game_id, currentRound)
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
      throw new Error(`Game stats not found for game_id: ${game_id}`);
    }

    return {
      round: round_number,
      isTradeHappening: false,
      team1_alive_players: gameStats.team1.players || [],
      team2_alive_players: gameStats.team2.players || [],
      team_won: null,
      finished: false,
    }
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
    if(currentRound.team1_alive_players.length === 0 || currentRound.team2_alive_players.length === 0) {
      throw new Error('No players alive in one of the teams')
    }

    // Randomly pick a player from each team
    // Use duelSelectBuff and tradeSelectBuff to increase the chances of a player being picked
    // So we duplicate the player in the array to increase the chances of being picked
    const team1PlayerAliveChances = currentRound.team1_alive_players.map(player => {
      const selectBuff = (currentRound.isTradeHappening 
        ? RoundService.getTradeSelectBuffByPlayerRole(player) 
        : RoundService.getDuelSelectBuffByPlayerRole(player))
      return Array(Math.floor(selectBuff * 100)).fill(player)
    }).flat()

    const team2PlayerAliveChances = currentRound.team2_alive_players.map(player => {
      const selectBuff = (currentRound.isTradeHappening 
        ? RoundService.getTradeSelectBuffByPlayerRole(player) 
        : RoundService.getDuelSelectBuffByPlayerRole(player))
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
    const duelResults = RoundService.pickDuelWinner({
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
      duel_buff: RoundService.getDuelWinBuffByPlayerRole(duelResults.winner), 
      trade_buff: RoundService.getTradeWinBuffByPlayerRole(duelResults.winner), 
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
    const duelChances = RoundService.getDuelChancesWithBuffs(duel)

    if (!duelChances || 
      !Number.isFinite(duelChances.chancesPlayer1) || 
      !Number.isFinite(duelChances.chancesPlayer2)) {
      throw new Error('Invalid duel chances: chancesPlayer1 and chancesPlayer2 must be valid finite numbers')
    }

    // Generate a random number between 0 and the sum of both players' chances
    const randomNumber = Math.random() * (duelChances.chancesPlayer1 + duelChances.chancesPlayer2)

    // Determine the winner based on the random number
    const winner = randomNumber < duelChances.chancesPlayer1 ? duel.player1 : duel.player2
    console.log(`Player ${winner.nickname} won the duel against ${winner === duel.player1 ? duel.player2.nickname : duel.player1.nickname}!`)
    return {
      winner: winner,
      loser: winner === duel.player1 ? duel.player2 : duel.player1,
      startedTradeDuel: RoundService.shouldTradeHappen(winner),
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
    const tradeChance = Math.min(BASE_TRADE_CHANCE_PERCENTAGE + RoundService.getTradeSelectBuffByPlayerRole(duelWinner), 1)

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
    const player1DuelBuff = !duel.isTrade ? RoundService.getDuelWinBuffByPlayerRole(duel.player1): 0
    const player1TradeBuff = duel.isTrade ? RoundService.getTradeWinBuffByPlayerRole(duel.player1): 0
    const player2DuelBuff = !duel.isTrade ? RoundService.getDuelWinBuffByPlayerRole(duel.player2): 0
    const player2TradeBuff = duel.isTrade ? RoundService.getTradeWinBuffByPlayerRole(duel.player2): 0
    
    const duelChances = RoundService.getSumOfAttributesChances(duel.player1, duel.player2)
    duelChances.chancesPlayer1 = duelChances.chancesPlayer1 * (1 + player1DuelBuff + player1TradeBuff)
    duelChances.chancesPlayer2 = duelChances.chancesPlayer2 * (1 + player2DuelBuff + player2TradeBuff)

    return duelChances
  },

  /**
   * Calculates the total chances of winning for each player based on their attributes.
   *
   * This function retrieves the chances of winning for each player across all attributes and sums them up.
   *
   * @param {Player} player1 - The first player.
   * @param {Player} player2 - The second player.
   * @returns {{chancesPlayer1: number, chancesPlayer2: number}} - An object containing the total chances of winning for each player.
   */
  getSumOfAttributesChances: (player1: Player, player2: Player): {chancesPlayer1: number, chancesPlayer2: number} => {
    const chances = RoundService.getChancesOnAllAttributes(player1, player2)
    const chancesPlayer1 = Object.values(chances.chancesPlayer1).reduce((acc, chance) => acc + chance, 0)
    const chancesPlayer2 = Object.values(chances.chancesPlayer2).reduce((acc, chance) => acc + chance, 0)

    return { chancesPlayer1, chancesPlayer2 }
  },

  /**
   * Calculates the chances of winning for each player based on all their attributes.
   *
   * This function iterates over each attribute of the players and calculates the chances of winning for each attribute.
   * It returns an object containing the chances per attribute for both players.
   *
   * @param {Player} player1 - The first player.
   * @param {Player} player2 - The second player.
   * @returns {{ chancesPlayer1: PlayerAttributes, chancesPlayer2: PlayerAttributes }} - An object containing the chances of winning for each attribute for both players.
   */
  getChancesOnAllAttributes: (player1: Player, player2: Player): { chancesPlayer1: PlayerAttributes, chancesPlayer2: PlayerAttributes } => {
    const player1Attributes = Object.keys(player1.player_attributes)
    const player2Attributes = Object.keys(player2.player_attributes)
  
    // Check if the attributes match
    if (player1Attributes.length !== player2Attributes.length || !player1Attributes.every(attr => player2Attributes.includes(attr))) {
      throw new Error('Player attributes do not match')
    }

    // Calculate the chances for each attribute player -> player2
    const chancesPlayer1 = player1Attributes.reduce((acc, attributeName: string) => {
      acc[attributeName as keyof PlayerAttributes] = RoundService.getChancesOnAttribute(attributeName, player1, player2)
      return acc
    }, {} as PlayerAttributes)

    // Calculate the chances for each attribute player2 -> player
    const chancesPlayer2 = player2Attributes.reduce((acc, attributeName: string) => {
      acc[attributeName as keyof PlayerAttributes] = RoundService.getChancesOnAttribute(attributeName, player2, player1)
      return acc
    }, {} as PlayerAttributes)

    return { chancesPlayer1, chancesPlayer2 }
  },

  /**
   * Calculates the chance of winning for a specific attribute of player1 against the counter attribute of player2.
   *
   * This function checks if the given attribute exists for player1 and if the corresponding counter attribute exists for player2.
   * It then calculates the chance of winning for player1 based on the difference between the attribute values.
   *
   * @param {string} attributeName - The name of the attribute to compare.
   * @param {Player} player1 - The first player.
   * @param {Player} player2 - The second player.
   * @returns {number} - The calculated chance of winning for the specified attribute.
   * @throws {Error} - Throws an error if the attribute or its counter attribute is invalid.
   */
  getChancesOnAttribute: (attributeName: string, player1: Player, player2: Player): number => {
    const counterAttributeName = RoundService.getCounterAttributeName(attributeName)

    if (!(attributeName in player1.player_attributes) || !(counterAttributeName in player2.player_attributes)) {
      throw new Error(`Invalid attribute or counter name. {attribute: ${attributeName}, counter: ${counterAttributeName}}`)
    }

    const player1Attribute = player1.player_attributes[attributeName as keyof PlayerAttributes]
    const player2Attribute = player2.player_attributes[counterAttributeName as keyof PlayerAttributes]
    return Math.max(0, player1Attribute - player2Attribute)
  },

  /**
   * Gets the buff to the percentage of winning a trade duel based on the player's role.
   *
   * @param {Player} player - The player whose role is used to determine the buff.
   * @returns {number} - The buff to the percentage (between 0.0 and 0.99) of winning a trade duel.
   */
  getTradeWinBuffByPlayerRole: (player: Player): number => {
    switch (player.role) {
    case PlayerRole.Duelist:
      return 0.10
    case PlayerRole.Controller:
      return 0.15
    case PlayerRole.Flex:
      return 0.35
    case PlayerRole.Initiator:
      return 0.20
    case PlayerRole.IGL:
      return 0.25
    case PlayerRole.Sentinel:
      return 0.35
    default:
      return 0
    }
  },

  /**
   * Gets the buff to the percentage of winning a regular duel based on the player's role.
   *
   * @param {Player} player - The player whose role is used to determine the buff.
   * @returns {number} - The buff to the percentage (between 0.0 and 0.99) of winning a regular duel.
   */
  getDuelWinBuffByPlayerRole: (player: Player): number => {
    switch (player.role) {
    case PlayerRole.Duelist:
      return 0.25
    case PlayerRole.Controller:
      return 0.05
    case PlayerRole.Flex:
      return 0.15
    case PlayerRole.Initiator:
      return 0.35
    case PlayerRole.IGL:
      return 0.07
    case PlayerRole.Sentinel:
      return 0.01
    default:
      return 0
    }
  },

  /**
   * Gets the buff to the percentage of being selected for a trade duel based on the player's role.
   * It also increases the percentage chance of a trade duel occurring after a player wins a duel.
   *
   * @param {Player} player - The player whose role is used to determine the buff.
   * @returns {number} - The buff to the percentage (between 0.0 and 0.99) of being selected for a trade duel.
   */
  getTradeSelectBuffByPlayerRole: (player: Player): number => {
    switch (player.role) {
    case PlayerRole.Duelist:
      return 0.10
    case PlayerRole.Controller:
      return 0.15
    case PlayerRole.Flex:
      return 0.35
    case PlayerRole.Initiator:
      return 0.20
    case PlayerRole.IGL:
      return 0.25
    case PlayerRole.Sentinel:
      return 0.35
    default:
      return 0
    }
  },

  /**
   * Gets the buff to the percentage of being selected for a regular duel based on the player's role.
   *
   * @param {Player} player - The player whose role is used to determine the buff.
   * @returns {number} - The buff to the percentage (between 0.0 and 0.99) of being selected for a regular duel.
   */
  getDuelSelectBuffByPlayerRole: (player: Player): number => {
    switch (player.role) {
    case PlayerRole.Duelist:
      return 0.25
    case PlayerRole.Controller:
      return 0.05
    case PlayerRole.Flex:
      return 0.15
    case PlayerRole.Initiator:
      return 0.35
    case PlayerRole.IGL:
      return 0.07
    case PlayerRole.Sentinel:
      return 0.01
    default:
      return 0
    }
  },

  /**
   * Gets the counter attribute name for a given attribute.
   *
   * This function maps an attribute name to its corresponding counter attribute name.
   * If the provided attribute name does not have a defined counter, it returns 'unknown'.
   *
   * @param {string} attributeName - The name of the attribute to get the counter for.
   * @returns {string} - The name of the counter attribute.
   */
  getCounterAttributeName: (attributeName: string): string => {
    switch (attributeName) {
    case 'clutch':
      return 'awareness'
    case 'awareness':
      return 'game_reading'
    case 'game_reading':
      return 'aim'
    case 'aim':
      return 'positioning'
    case 'positioning':
      return 'clutch'
    case 'resilience':
      return 'confidence'
    case 'confidence':
      return 'game_sense'
    case 'game_sense':
      return 'decision_making'
    case 'decision_making':
      return 'resilience'
    case 'strategy':
      return 'adaptability'
    case 'adaptability':
      return 'strategy'
    case 'communication':
      return 'unpredictability'
    case 'unpredictability':
      return 'utility_usage'
    case 'utility_usage':
      return 'teamwork'
    case 'teamwork':
      return 'communication'
    case 'rage_fuel':
      return 'rage_fuel'
    default:
      return 'unknown'
    }
  },
}

export default RoundService

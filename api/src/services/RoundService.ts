import { PlayerRole } from "../models/enums"
import Player, { PlayerAttributes, PlayerDuel, PlayerDuelResults } from "../models/Player"
import GameLog, { Round } from "../models/GameLog"
import Game from "../models/Game"
import GameStats from "../models/GameStats"
import PlayerGameStats from "../models/PlayerGameStats"

const BASE_TRADE_CHANCE_PERCENTAGE: number = 0.10

const RoundService = {
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
  playGame: async (game_id: number): Promise<void> => {
    // Get the game
    const game = await Game.findByPk(game_id)
    if (!game) {
      throw new Error('Game not found')
    }

    // Get the game stats
    const gameStats = await GameStats.findOne({where: {game_id: game_id}})
    if (!gameStats) {
      throw new Error('Game stats not found')
    }

    // Play the game
    let round = 1
    let team1_rounds = 0
    let team2_rounds = 0
    let currentRound = null
    while (team1_rounds < 13 && team2_rounds < 13) {
      currentRound = await RoundService.playRound(game_id, round)
      round += 1
      if (currentRound.team1_alive_players.length === 0) {
        team2_rounds += 1
      } else if (currentRound.team2_alive_players.length === 0) {
        team1_rounds += 1
      }
    }

    // Update the game stats
    gameStats.team1_score = team1_rounds
    gameStats.team2_score = team2_rounds
    gameStats.winner_id = team1_rounds > team2_rounds ? gameStats.team1_id : gameStats.team2_id
    gameStats.save()
    
    RoundService.updatePlayerStats(gameStats)
  },
  updatePlayerStats: async (gameStats: GameStats): Promise<void> => {
    // get all the game logs
    const gameLogs = await GameLog.findAll({where: {game_id: gameStats.game_id}})

    // Create the PlayerGameStats object for all players involved in this game, but dont save it yet.
    const playerIdToStatsTeam1: Map<number, PlayerGameStats> = new Map()
    const playerIdToStatsTeam2: Map<number, PlayerGameStats> = new Map()
    for(const player of gameStats.team1.players ?? []) {
      const playerGameStats: PlayerGameStats = new PlayerGameStats()
      playerGameStats.player_id = player.id
      playerGameStats.kills = 0
      playerGameStats.deaths = 0
      playerGameStats.assists = 0
      playerIdToStatsTeam1.set(player.id, playerGameStats)
    }

    for(const player of gameStats.team2.players ?? []) {
      const playerGameStats: PlayerGameStats = new PlayerGameStats()
      playerGameStats.player_id = player.id
      playerGameStats.kills = 0
      playerGameStats.deaths = 0
      playerGameStats.assists = 0
      playerIdToStatsTeam2.set(player.id, playerGameStats)
    }

    // Update the player stats
    for (const log of gameLogs) {
      // Create the PlayerGameStats for all players involved in this game
      const playerStatsTeam1 = playerIdToStatsTeam1.get(log.team1_player_id)
      const playerStatsTeam2 = playerIdToStatsTeam2.get(log.team2_player_id)
      if (playerStatsTeam1 && playerStatsTeam2) {
        playerStatsTeam1.kills += log.team1_player_id !== log.player_killed_id ? 1 : 0
        playerStatsTeam1.deaths += log.team1_player_id === log.player_killed_id ? 1 : 0
        playerStatsTeam1.assists += log.trade && log.team1_player_id !== log.player_killed_id ? 1 : 0

        playerStatsTeam2.kills += log.team2_player_id !== log.player_killed_id ? 1 : 0
        playerStatsTeam2.deaths += log.team2_player_id === log.player_killed_id ? 1 : 0
        playerStatsTeam2.assists += log.trade && log.team2_player_id !== log.player_killed_id ? 1 : 0
      }
    }

    // Save the player stats
    for (const playerStats of playerIdToStatsTeam1.values()) {
      gameStats.players_stats_team1.push(playerStats)
    }

    for (const playerStats of playerIdToStatsTeam2.values()) {
      gameStats.players_stats_team2.push(playerStats)
    }
    gameStats.save()
  },
  playRound: async (game_id: number, round_number: number): Promise<Round> => {
    // Start the game
    let currentRound: Round = await RoundService.startRound(game_id, round_number)
    while (!currentRound.finished) {
      currentRound = RoundService.pickAndPlayDuel(game_id, currentRound)
    }

    // Return the last RoundInfo
    return currentRound
  },
  startRound: async (game_id: number, round_number: number): Promise<Round> => {
    const gameStats = await GameStats.findOne({where: {game_id: game_id}})
    return {
      round: round_number,
      isTradeHappening: false,
      team1_alive_players: gameStats?.team1?.players || [],
      team2_alive_players: gameStats?.team2?.players || [],
      finished: false,
    }
  },
  pickAndPlayDuel: (game_id: number, currentRound: Round): Round => {
    // Randomly pick a player from each team
    // Use duelSelectBuff and tradeSelectBuff to increase the chances of a player being picked
    // So we duplicate the player in the array to increase the chances of being picked
    const team1PlayerAliveChances = currentRound.team1_alive_players.map(player => {
      const selectBuff = (currentRound.isTradeHappening ? RoundService.getTradeSelectBuffByPlayerRole(player) : RoundService.getDuelSelectBuffByPlayerRole(player))
      return Array(Math.floor(selectBuff * 100)).fill(player)
    }).flat()

    const team2PlayerAliveChances = currentRound.team2_alive_players.map(player => {
      const selectBuff = (currentRound.isTradeHappening ? RoundService.getTradeSelectBuffByPlayerRole(player) : RoundService.getDuelSelectBuffByPlayerRole(player))
      return Array(Math.floor(selectBuff * 100)).fill(player)
    }).flat()

    const team1PlayerIndex = Math.floor(Math.random() * team1PlayerAliveChances.length)
    const team2PlayerIndex = Math.floor(Math.random() * team2PlayerAliveChances.length)

    const team1Player = team1PlayerAliveChances[team1PlayerIndex]
    const team2Player = team2PlayerAliveChances[team2PlayerIndex]

    // Pick the player that won
    const duelResults = RoundService.pickDuelWinner({player1: team1Player, player2: team2Player, isTrade: currentRound.isTradeHappening})
    const lastDuelOfRound = currentRound.team1_alive_players.length <= 1 || currentRound.team2_alive_players.length <= 1

    // Needs to save a GameLog with the duel results
    GameLog.create({
      round: currentRound.round,
      last_duel_of_round: lastDuelOfRound,
      duel_buff: RoundService.getDuelWinBuffByPlayerRole(duelResults.winner), 
      trade_buff: RoundService.getTradeWinBuffByPlayerRole(duelResults.winner), 
      trade: currentRound.isTradeHappening, 
      player_killed: duelResults.loser, 
      game_id: game_id, 
      team1_player_id: team1Player.id, 
      team2_player_id: team2Player.id, 
      player_killed_id: duelResults,
    })

    return {
      round: currentRound.round,
      isTradeHappening: duelResults.startedTradeDuel,
      team1_alive_players: currentRound.team1_alive_players.filter(player => player.id !== duelResults.loser.id),
      team2_alive_players: currentRound.team2_alive_players.filter(player => player.id !== duelResults.loser.id),
      finished: lastDuelOfRound,
    }
  },
  pickDuelWinner: (duel: PlayerDuel): PlayerDuelResults => {
    // Randomly pick the winner based on the chances
    // random number needs to be between 1 and chancesPlayer1 + chancesPlayer2
    // if random number is less than chancesPlayer1, player1 wins
    // if random number is greater than chancesPlayer1, player2 wins
    // This way if you have more chances you have a higher chance of winning
    const duelChances = RoundService.getDuelChancesWithBuffs(duel)
    const randomNumber = Math.random() * (duelChances.chancesPlayer1 + duelChances.chancesPlayer2)
    const winner = randomNumber < duelChances.chancesPlayer1 ? duel.player1 : duel.player2
    return {
      winner: winner,
      loser: winner === duel.player1 ? duel.player2 : duel.player1,
      startedTradeDuel: RoundService.shouldTradeHappen(winner),
    }
  },
  shouldTradeHappen(duelWinner: Player): boolean {
    // Player have a chance of entering a trade duel after winning a duel
    // The chance is based on the player role, the base chance is 10%.
    // Each role adds to that base percentage.
    // E.g: Duelist has a 25% chance of entering a trade duel after winning a duel, Controller has 5%.
    // then the calculation is: 10% + 25% = 35% for a duelist to enter a trade duel.
    const tradeChance = BASE_TRADE_CHANCE_PERCENTAGE + RoundService.getTradeSelectBuffByPlayerRole(duelWinner)
    return Math.random() * 100 < tradeChance
  },
  getDuelChancesWithBuffs: (duel: PlayerDuel): {chancesPlayer1: number, chancesPlayer2: number} => {
    const player1DuelBuff = RoundService.getDuelWinBuffByPlayerRole(duel.player1)
    const player1TradeBuff = duel.isTrade ? RoundService.getTradeWinBuffByPlayerRole(duel.player1): 0
    const player2DuelBuff = RoundService.getDuelWinBuffByPlayerRole(duel.player2)
    const player2TradeBuff = duel.isTrade ? RoundService.getTradeWinBuffByPlayerRole(duel.player2): 0
    const duelChances = RoundService.getSumOfAttributesChances(duel.player1, duel.player2)
    duelChances.chancesPlayer1 = duelChances.chancesPlayer1 * (1 + player1DuelBuff + player1TradeBuff)
    duelChances.chancesPlayer2 = duelChances.chancesPlayer2 * (1 + player2DuelBuff + player2TradeBuff)

    return duelChances
  },
  getSumOfAttributesChances: (player1: Player, player2: Player): {chancesPlayer1: number, chancesPlayer2: number} => {
    const chances = RoundService.getChancesOnAllAttributes(player1, player2)
    const chancesPlayer1 = Object.values(chances.chancesPlayer1).reduce((acc, chance) => acc + chance, 0)
    const chancesPlayer2 = Object.values(chances.chancesPlayer2).reduce((acc, chance) => acc + chance, 0)

    return { chancesPlayer1, chancesPlayer2 }
  },
  getChancesOnAllAttributes: (player1: Player, player2: Player): { chancesPlayer1: PlayerAttributes, chancesPlayer2: PlayerAttributes } => {
    // Calculate the chances for each attribute player -> player2
    const chancesPlayer1 = Object.keys(player1.player_attributes).reduce((acc, attributeName: string) => {
      acc[attributeName as keyof PlayerAttributes] = RoundService.getChancesOnAttribute(attributeName, player1, player2)
      return acc
    }, {} as PlayerAttributes)
  
    // Calculate the chances for each attribute player2 -> player
    const chancesPlayer2 = Object.keys(player2.player_attributes).reduce((acc, attributeName: string) => {
      acc[attributeName as keyof PlayerAttributes] = RoundService.getChancesOnAttribute(attributeName, player2, player1)
      return acc
    }, {} as PlayerAttributes)
  
    return { chancesPlayer1, chancesPlayer2 }
  },
  getChancesOnAttribute: (attributeName: string, player1: Player, player2: Player): number => {
    const player1Attribute = player1.player_attributes[attributeName as keyof PlayerAttributes]
    const player2Attribute = player2.player_attributes[RoundService.getCounterAttributeName(attributeName) as keyof PlayerAttributes]
    return Math.max(0, player1Attribute - player2Attribute)
  },
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
}

export default RoundService

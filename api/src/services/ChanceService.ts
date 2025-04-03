import { PlayerRole } from "@/models/enums"
import Player, { PlayerAttributes } from "@/models/Player"

const ChanceService = {
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
    const chances = ChanceService.getChancesOnAllAttributes(player1, player2)
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
      acc[attributeName as keyof PlayerAttributes] = ChanceService.getChancesOnAttribute(attributeName, player1, player2)
      return acc
    }, {} as PlayerAttributes)

    // Calculate the chances for each attribute player2 -> player
    const chancesPlayer2 = player2Attributes.reduce((acc, attributeName: string) => {
      acc[attributeName as keyof PlayerAttributes] = ChanceService.getChancesOnAttribute(attributeName, player2, player1)
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
    const counterAttributeName = ChanceService.getCounterAttributeName(attributeName)

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
    case PlayerRole.DUELIST:
      return 0.40
    case PlayerRole.CONTROLLER:
      return 0.15
    case PlayerRole.FLEX:
      return 0.35
    case PlayerRole.INITIATOR:
      return 0.20
    case PlayerRole.IGL:
      return 0.10
    case PlayerRole.SENTINEL:
      return 0.20
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
    case PlayerRole.DUELIST:
      return 0.30
    case PlayerRole.CONTROLLER:
      return 0.05
    case PlayerRole.FLEX:
      return 0.15
    case PlayerRole.INITIATOR:
      return 0.25
    case PlayerRole.IGL:
      return 0.00
    case PlayerRole.SENTINEL:
      return 0.05
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
    case PlayerRole.DUELIST:
      return 0.40
    case PlayerRole.CONTROLLER:
      return 0.15
    case PlayerRole.FLEX:
      return 0.35
    case PlayerRole.INITIATOR:
      return 0.20
    case PlayerRole.IGL:
      return 0.15
    case PlayerRole.SENTINEL:
      return 0.20
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
    case PlayerRole.DUELIST:
      return 0.40
    case PlayerRole.CONTROLLER:
      return 0.05
    case PlayerRole.FLEX:
      return 0.15
    case PlayerRole.INITIATOR:
      return 0.40
    case PlayerRole.IGL:
      return 0.05
    case PlayerRole.SENTINEL:
      return 0.05
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

export default ChanceService

import { describe, expect, it } from 'vitest'

import { PlayerRole } from '@/models/enums'
import Player, { PlayerAttributes } from '@/models/Player'
import ChanceService from '@/services/ChanceService'
import DuelService from '@/services/DuelService'

const attributesAt = (value: number): PlayerAttributes => new PlayerAttributes(
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
  value,
)

const playerWith = (id: number, role: PlayerRole, attributeValue: number): Player => Player.build({
  id,
  nickname: `mechanics_player_${id}`,
  full_name: `Mechanics Player ${id}`,
  age: 20,
  country: 'Brazil',
  team_id: id,
  role,
  player_attributes: attributesAt(attributeValue),
})

const countPlayers = (players: Player[]): Record<number, number> => {
  const counts: Record<number, number> = {}
  for (const player of players) {
    counts[player.id] = (counts[player.id] ?? 0) + 1
  }
  return counts
}

describe('Duel mechanics', () => {
  const duelist = playerWith(1, PlayerRole.DUELIST, 3)
  const igl = playerWith(2, PlayerRole.IGL, 0)

  it('calculates exact counter-attribute totals', () => {
    expect(ChanceService.getSumOfAttributesChances(duelist, igl)).toEqual({
      chancesPlayer1: 48,
      chancesPlayer2: 0,
    })
  })

  it('applies the exact regular and trade win buffs', () => {
    expect(DuelService.getDuelChancesWithBuffs({ player1: duelist, player2: igl, isTrade: false })).toEqual({
      chancesPlayer1: 62.400000000000006,
      chancesPlayer2: 1,
    })
    expect(DuelService.getDuelChancesWithBuffs({ player1: duelist, player2: igl, isTrade: true })).toEqual({
      chancesPlayer1: 67.19999999999999,
      chancesPlayer2: 1,
    })
  })

  it('builds exact regular and trade selection pools', () => {
    expect(countPlayers(DuelService.getPlayerSelectionPool([duelist, igl], false))).toEqual({
      1: 40,
      2: 5,
    })
    expect(countPlayers(DuelService.getPlayerSelectionPool([duelist, igl], true))).toEqual({
      1: 40,
      2: 15,
    })
  })

  it('calculates exact trade-start probabilities', () => {
    expect(DuelService.getTradeChance(duelist)).toBe(0.5)
    expect(DuelService.getTradeChance(igl)).toBe(0.25)
  })
})

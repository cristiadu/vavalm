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
  // GIVEN players with known roles and attribute totals
  const duelist = playerWith(1, PlayerRole.DUELIST, 3)
  const igl = playerWith(2, PlayerRole.IGL, 0)
  const sentinel = playerWith(3, PlayerRole.SENTINEL, 2)

  it('calculates exact counter-attribute totals', () => {
    // WHEN / THEN
    expect(ChanceService.getSumOfAttributesChances(duelist, igl)).toEqual({
      chancesPlayer1: 48,
      chancesPlayer2: 0,
    })
  })

  it('applies only the duel win buff on regular duels and only the trade win buff on trades', () => {
    // WHEN / THEN — (BASE 1 + raw) * (1 + matching win buff); the other win buff is unused
    expect(DuelService.getDuelChancesWithBuffs({ player1: duelist, player2: igl, isTrade: false })).toEqual({
      chancesPlayer1: 63.7,
      chancesPlayer2: 1,
    })
    expect(DuelService.getDuelChancesWithBuffs({ player1: duelist, player2: igl, isTrade: true })).toEqual({
      chancesPlayer1: 68.6,
      chancesPlayer2: 1.1,
    })
  })

  it('still applies role win buffs when attribute scores are equal (zero raw)', () => {
    // GIVEN equal mid attributes → raw contribution 0 for both
    const equalDuelist = playerWith(10, PlayerRole.DUELIST, 2)
    const equalSentinel = playerWith(11, PlayerRole.SENTINEL, 2)

    // WHEN / THEN — BASE keeps buffs in the ratio instead of collapsing to 1 vs 1
    expect(DuelService.getDuelChancesWithBuffs({
      player1: equalDuelist,
      player2: equalSentinel,
      isTrade: false,
    })).toEqual({
      chancesPlayer1: 1.3,
      chancesPlayer2: 1.05,
    })
  })

  it('builds exact regular and trade selection pools', () => {
    // WHEN / THEN — Duelist clearly ahead; IGL still present (not zero)
    expect(countPlayers(DuelService.getPlayerSelectionPool([duelist, igl], false))).toEqual({
      1: 30,
      2: 10,
    })
    expect(countPlayers(DuelService.getPlayerSelectionPool([duelist, igl], true))).toEqual({
      1: 30,
      2: 15,
    })
  })

  it('uses a flat base trade-start chance (select buffs do not change trade rate)', () => {
    // WHEN / THEN
    expect(DuelService.getTradeChance(duelist)).toBe(0.1)
    expect(DuelService.getTradeChance(igl)).toBe(0.1)
    expect(DuelService.getTradeChance(sentinel)).toBe(0.1)
  })

  it('resolves equal float chances without favoring player1', () => {
    // GIVEN equal post-buff weights that used to bias team1 via Math.ceil
    const chancesPlayer1 = 1.05
    const chancesPlayer2 = 1.05
    const steps = 100_000
    let player1Wins = 0

    // WHEN sweeping random values in [0, 1)
    for (let i = 0; i < steps; i++) {
      const randomZeroToOne = i / steps
      if (DuelService.pickWinnerSide(chancesPlayer1, chancesPlayer2, randomZeroToOne) === 1) {
        player1Wins += 1
      }
    }

    // THEN each side wins half the time
    expect(player1Wins / steps).toBeCloseTo(0.5, 3)
  })

  it('resolves unequal chances to the exact probability ratio', () => {
    // GIVEN 3:1 weights
    const chancesPlayer1 = 3
    const chancesPlayer2 = 1
    const steps = 100_000
    let player1Wins = 0

    // WHEN
    for (let i = 0; i < steps; i++) {
      const randomZeroToOne = i / steps
      if (DuelService.pickWinnerSide(chancesPlayer1, chancesPlayer2, randomZeroToOne) === 1) {
        player1Wins += 1
      }
    }

    // THEN
    expect(player1Wins / steps).toBeCloseTo(0.75, 3)
  })
})

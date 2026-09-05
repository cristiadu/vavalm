import { beforeEach, describe, expect, it, vi } from 'vitest'
import { randomInt } from 'node:crypto'
import { generatePlayerAttributes } from '@/services/GenerationService'

vi.mock('node:crypto', async importOriginal => {
  const original = await importOriginal<typeof import('node:crypto')>()
  return { ...original, randomInt: vi.fn() }
})

describe('Generated attributes', () => {
  beforeEach(() => {
    vi.mocked(randomInt).mockReset()
    for (let index = 0; index < 16; index++) {
      vi.mocked(randomInt).mockReturnValueOnce(index % 4)
    }
  })

  it('draws each attribute independently, including both endpoints', () => {
    const result = generatePlayerAttributes().toApiModel()

    expect({ ...result }).toEqual({
      clutch: 0, awareness: 1, aim: 2, positioning: 3,
      game_reading: 0, resilience: 1, confidence: 2, strategy: 3,
      adaptability: 0, communication: 1, unpredictability: 2, game_sense: 3,
      decision_making: 0, rage_fuel: 1, teamwork: 2, utility_usage: 3,
    })
    expect(randomInt).toHaveBeenCalledTimes(16)
    expect(randomInt).toHaveBeenCalledWith(4)
  })
})

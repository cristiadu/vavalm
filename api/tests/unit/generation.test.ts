import { beforeEach, describe, expect, it, vi } from 'vitest'
import { randomInt } from 'node:crypto'
import { generateData, generatePlayerAttributes } from '@/services/GenerationService'

const { randomIntMock } = vi.hoisted(() => ({ randomIntMock: vi.fn<(max: number) => number>() }))

vi.mock('node:crypto', async importOriginal => {
  const original = await importOriginal<typeof import('node:crypto')>()
  return { ...original, randomInt: randomIntMock }
})

describe('Generated attributes', () => {
  beforeEach(() => {
    randomIntMock.mockReset()
    for (let index = 0; index < 16; index++) {
      randomIntMock.mockReturnValueOnce(index % 4)
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

describe('Tournament date validation', () => {
  it.each([
    {},
    { start_date: '2100-06-01T10:00:00.000Z' },
    { end_date: '2100-06-08T18:00:00.000Z' },
    { start_date: 'invalid', end_date: '2100-06-08T18:00:00.000Z' },
    { start_date: '2100-06-01T10:00:00.000Z', end_date: 'invalid' },
    { start_date: '2100-06-08T18:00:00.000Z', end_date: '2100-06-01T10:00:00.000Z' },
    { start_date: '2100-06-01T10:00:00.000Z', end_date: '2100-06-01T10:00:00.000Z' },
  ])('rejects invalid dates before writing any records: %j', async dates => {
    await expect(generateData({ teamCount: 2, tournamentCount: 1, ...dates })).rejects.toMatchObject({
      status: 400,
      fields: { dates: { message: 'Valid start and end dates are required, with the end after the start' } },
    })
  })
})

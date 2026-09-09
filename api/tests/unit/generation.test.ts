import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateData, generatePlayerAttributes } from '@/services/GenerationService'
import { generateTeamName, generateTeamShortName, generatePlayerNickname, generateTournamentName, generateTeamLogo, reserveGeneratedName } from '@/services/GenerationIdentityService'
import data from '@/models/generation-data.json'
import { getCountries } from '@/services/CountryService'
import { detectImageMimeType } from '@/base/FileUtils'

const { randomIntMock } = vi.hoisted(() => ({ randomIntMock: vi.fn<(max: number) => number>() }))

vi.mock('@/services/CountryService', () => ({ getCountries: vi.fn() }))

vi.mock('node:crypto', async importOriginal => {
  const original = await importOriginal<typeof import('node:crypto')>()
  return { ...original, randomInt: randomIntMock }
})

describe('Generated attributes', () => {
  beforeEach(() => {
    randomIntMock.mockReset()
    for (let index = 0; index < 16; index++) {
      randomIntMock.mockReturnValueOnce(index % 3)
    }
    randomIntMock.mockReturnValueOnce(2).mockReturnValueOnce(0).mockReturnValueOnce(3).mockReturnValueOnce(0).mockReturnValueOnce(2)
  })

  it('gives distinct signature strengths while balancing other attributes', () => {
    const result = generatePlayerAttributes().toApiModel()

    expect({ ...result }).toEqual({
      clutch: 3, awareness: 2, aim: 2, positioning: 0,
      game_reading: 1, resilience: 2, confidence: 0, strategy: 1,
      adaptability: 2, communication: 0, unpredictability: 1, game_sense: 2,
      decision_making: 0, rage_fuel: 1, teamwork: 2, utility_usage: 0,
    })
    expect(randomIntMock).toHaveBeenCalledTimes(21)
    expect(randomIntMock).toHaveBeenNthCalledWith(17, 1, 3)
    expect(randomIntMock).toHaveBeenNthCalledWith(18, 16)
    expect(randomIntMock).toHaveBeenNthCalledWith(20, 15)
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

describe('Readable generated identities', () => {
  beforeEach(() => {
    randomIntMock.mockReset().mockReturnValue(0)
  })

  it('uses common words with separate team and tournament suffixes', () => {
    randomIntMock.mockReturnValueOnce(99)
    expect(generateTeamName()).toBe('Nova Gaming')
    expect(generateTournamentName(2100)).toBe('Nova Cup 2100')
    randomIntMock.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(99)
    expect(generateTournamentName(2100)).toBe('Nova Cup')
  })

  it('keeps occasional numbers tied to round wins or roster size', () => {
    expect(generateTeamName()).toBe('Round13 Gaming')
    randomIntMock.mockReturnValueOnce(0).mockReturnValueOnce(1)
    expect(generateTeamName()).toBe('Stack5 Gaming')
    randomIntMock.mockReturnValueOnce(10)
    expect(generateTeamName()).toBe('Nova Gaming')
  })

  it('favors single-term nicknames with a 70/25/5 distribution', () => {
    const names = Array.from({ length: 100 }, (_, roll) => {
      randomIntMock.mockReturnValueOnce(roll)
      return generatePlayerNickname()
    })
    expect(names.slice(0, 70)).toEqual(Array(70).fill('Ace'))
    expect(names.slice(70, 95)).toEqual(Array(25).fill('AceBlaze'))
    expect(names.slice(95)).toEqual(Array(5).fill('AceBlazeClutch'))
  })

  it.each([
    ['Team Crimson Wolves', 'CrimsonWolves'],
    ['Aurora Gaming', 'Aurora'],
    ['Round13 Gaming', 'Round13'],
    ['Stack5 Esports', 'Stack5'],
    ['Team Gaming', 'Gaming'],
    ['Esports', 'Esports'],
  ])('derives the tag for %s from its words', (name, expected) => {
    expect(generateTeamShortName(name)).toBe(expected)
    expect(randomIntMock).not.toHaveBeenCalled()
  })

  it('resolves existing and within-batch name collisions with word suffixes', () => {
    const names = new Set(['Aurora'])
    expect(reserveGeneratedName(() => 'Aurora', names, ' ')).toBe('Aurora North')
    expect(reserveGeneratedName(() => 'Aurora', names, ' ')).toBe('Aurora South')
    expect([...names]).toEqual(['Aurora', 'Aurora North', 'Aurora South'])
  })

  it('keeps collision suffixes distinct and word-based after exhausting single words', () => {
    const names = new Set(['Aurora'])
    for (let index = 0; index <= data.NAME_VARIANTS.length; index++) {
      reserveGeneratedName(() => 'Aurora', names)
    }
    expect(names.size).toBe(data.NAME_VARIANTS.length + 2)
    expect(names.has('AuroraNorthNorth')).toBe(true)
    expect([...names].every(name => /^[A-Za-z]+$/.test(name))).toBe(true)
  })

  it('renders the script SVG template with distinct colors and the correct MIME type', () => {
    const logo = generateTeamLogo()
    expect(logo.toString()).toBe(data.SVG_LOGOS[0].replaceAll('{primary_color}', '#FF0000').replaceAll('{secondary_color}', '#0000FF'))
    expect(detectImageMimeType(logo)).toBe('image/svg+xml')
    expect(detectImageMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe('image/png')
  })
})

describe('Generation country availability', () => {
  it('rejects an empty fetched list before creating a batch', async () => {
    vi.mocked(getCountries).mockResolvedValueOnce([])
    await expect(generateData({ teamCount: 2, tournamentCount: 0 })).rejects.toMatchObject({
      status: 400,
      fields: { countries: { message: 'No countries are available for generation' } },
    })
  })
})

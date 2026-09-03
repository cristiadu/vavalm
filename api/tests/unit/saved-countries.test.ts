import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readSavedCountries } from '@/services/CountryService'
import { SAVED_COUNTRIES_FILE } from '@/models/RestCountries'

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}))

const readFileSyncMock = vi.mocked(readFileSync)

describe('Saved country dataset', () => {
  beforeEach(() => {
    readFileSyncMock.mockReset()
  })

  it('serves the dataset the build saved beside the bundle', () => {
    // GIVEN a build that captured two countries
    const saved = [
      { code: 'br', name: 'Brazil', flag: 'https://flags.example/br.png' },
      { code: 'jp', name: 'Japan', flag: 'https://flags.example/jp.png' },
    ]
    readFileSyncMock.mockReturnValue(JSON.stringify(saved))

    // WHEN the saved dataset is read
    const countries = readSavedCountries()

    // THEN every captured country comes back, from the file next to the bundle
    expect(countries).toEqual(saved)
    expect(readFileSyncMock.mock.calls[0][0]).toContain(SAVED_COUNTRIES_FILE)
  })

  it('reports nothing when the build saved no file', () => {
    // GIVEN a build that ran without an API key, leaving no file
    readFileSyncMock.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory')
    })

    // WHEN the saved dataset is read
    // THEN the caller is told to look elsewhere rather than seeing an error
    expect(readSavedCountries()).toBeUndefined()
  })

  it('reports nothing when the saved file holds no countries', () => {
    // GIVEN a saved file that captured an empty dataset
    readFileSyncMock.mockReturnValue('[]')

    // WHEN the saved dataset is read
    // THEN it is treated as absent, so the API key path still runs
    expect(readSavedCountries()).toBeUndefined()
  })

  it('reports nothing when the saved file is not valid JSON', () => {
    // GIVEN a truncated file, as an interrupted build would leave behind
    readFileSyncMock.mockReturnValue('[{"code":"br"')

    // WHEN the saved dataset is read
    // THEN the malformed file does not take the countries endpoint down
    expect(readSavedCountries()).toBeUndefined()
  })
})

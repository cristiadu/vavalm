import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const API_KEY = 'country-service-test-key'

describe('CountryService', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.REST_COUNTRIES_API_KEY = API_KEY
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.REST_COUNTRIES_API_KEY
  })

  it('fetches every v5 page with bearer auth and maps the exact API response', async () => {
    // GIVEN two REST Countries pages
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          objects: [{ names: { common: 'Argentina' }, codes: { alpha_2: 'AR' } }],
          meta: { count: 1, more: true },
        },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          objects: [{ names: { common: 'Brazil' }, codes: { alpha_2: 'BR' } }],
          meta: { count: 1, more: false },
        },
      })))
    vi.stubGlobal('fetch', fetchMock)
    const { getCountries } = await import('@/services/CountryService')

    // WHEN all countries are requested
    const countries = await getCountries()

    // THEN each page uses the repository key and the response is mapped exactly
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.restcountries.com/countries/v5?limit=100&offset=0&response_fields=names.common%2Ccodes.alpha_2',
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal: expect.any(AbortSignal),
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.restcountries.com/countries/v5?limit=100&offset=1&response_fields=names.common%2Ccodes.alpha_2',
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal: expect.any(AbortSignal),
      },
    )
    expect(countries).toEqual([
      { code: 'ar', name: 'Argentina', flag: 'https://flags.restcountries.com/v5/w320/ar.png' },
      { code: 'br', name: 'Brazil', flag: 'https://flags.restcountries.com/v5/w320/br.png' },
      { code: 'eu', name: 'Europe', flag: 'https://flagpedia.net/data/org/w580/eu.webp' },
      { code: 'en', name: 'England', flag: 'https://flagpedia.net/data/flags/w580/gb-eng.webp' },
      { code: 'un', name: 'International', flag: 'https://flagpedia.net/data/org/w580/un.webp' },
    ])
  })

  it('rejects before making a request when the repository key is missing', async () => {
    // GIVEN no REST Countries API key
    delete process.env.REST_COUNTRIES_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { getCountries } = await import('@/services/CountryService')

    // WHEN countries are requested, THEN configuration fails exactly
    await expect(getCountries()).rejects.toThrow('REST_COUNTRIES_API_KEY is not configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

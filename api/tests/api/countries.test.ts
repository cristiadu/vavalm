import { apiClient } from '@tests/setup'
import { describe, expect, it } from 'vitest'

const SPECIAL_COUNTRY_CODES = ['eu', 'en', 'un']

describe('Countries', () => {
  it('returns countries fetched from REST Countries v5', async () => {
    // GIVEN the REST Countries API key configured for the running API

    // WHEN countries are requested
    const countries = await apiClient.default.getCountries()

    // THEN the API includes an exact country supplied by REST Countries v5
    expect(countries).toContainEqual({
      code: 'ca',
      name: 'Canada',
      flag: 'https://flags.restcountries.com/v5/w320/ca.png',
    })
  })

  it('returns the special regions through the generated API client', async () => {
    // GIVEN the API-provided special country codes

    // WHEN countries are requested
    const countries = await apiClient.default.getCountries()

    // THEN the API includes every special region with its exact contract values
    expect(countries.filter(country => SPECIAL_COUNTRY_CODES.includes(country.code))).toEqual([
      { code: 'eu', name: 'Europe', flag: 'https://flagpedia.net/data/org/w580/eu.webp' },
      { code: 'en', name: 'England', flag: 'https://flagpedia.net/data/flags/w580/gb-eng.webp' },
      { code: 'un', name: 'International', flag: 'https://flagpedia.net/data/org/w580/un.webp' },
    ])
  })
})

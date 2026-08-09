import { CountryApiModel } from '@/api/generated'
import { VavalMApiClient } from '@/api/client'

const fallbackCountries: CountryApiModel[] = [
  {
    code: 'eu',
    name: 'Europe',
    flag: 'https://flagpedia.net/data/org/w580/eu.webp',
  },
  {
    code: 'en',
    name: 'England',
    flag: 'https://flagpedia.net/data/flags/w580/gb-eng.webp',
  },
  {
    code: 'un',
    name: 'International',
    flag: 'https://flagpedia.net/data/org/w580/un.webp',
  },
]

/** Fetches country options through the generated API client and falls back to special regions. */
export const fetchCountries = async (closure: (_countryData: CountryApiModel[]) => void): Promise<CountryApiModel[]> => {
  try {
    const countryData = await VavalMApiClient.default.getCountries()

    // Run the closure function after fetching data
    closure(countryData)
    return countryData
  } catch {
    console.error('Error fetching countries')
    const countries = [...fallbackCountries]
    closure(countries)
    return countries
  }
}

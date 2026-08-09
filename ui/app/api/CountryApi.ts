import { CountryApiModel } from '@/api/generated'
import { VavalMApiClient } from '@/api/client'

/** Fetches country options through the generated API client. */
export const fetchCountries = async (closure: (_countryData: CountryApiModel[]) => void): Promise<CountryApiModel[]> => {
  try {
    const countryData = await VavalMApiClient.default.getCountries()

    // Run the closure function after fetching data
    closure(countryData)
    return countryData
  } catch {
    console.error('Error fetching countries')
    const emptyResult: CountryApiModel[] = []
    closure(emptyResult)
    return emptyResult
  }
}

/** Indexes country flag URLs by country display name. */
export const mapCountryFlagsByName = (countries: CountryApiModel[]): Record<string, string> => {
  return Object.fromEntries(countries.map(country => [country.name, country.flag]))
}

import { Country } from "./models/Country"

export const specialCountries: Country[] = [
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

export const fetchCountries = async (closure: (_countryData: Country[]) => void): Promise<Country[] | null> => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    const countryData = data.map((country: { name: { common: string }, flags: { png: string } }) => ({
      name: country.name.common,
      flag: country.flags.png,
    }))

    // Add special countries to the list
    countryData.push(...specialCountries)

    // Run the closure function after fetching data
    closure(countryData)
    return countryData as Country[]
  } catch (error) {
    console.error('Error fetching countries:', error)
    throw error
  }
}

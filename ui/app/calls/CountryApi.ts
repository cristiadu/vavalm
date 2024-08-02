interface Country {
    name: string
    flag: string
    }

const CountryApi = {
  fetchCountries: async (closure: (countryData: Country[]) => void) => {
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
    
      // Run the closure function after fetching data
      closure(countryData)
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  },
}

export default CountryApi
export type { Country }

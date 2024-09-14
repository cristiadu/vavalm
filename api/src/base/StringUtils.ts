export const specialCountries: { [key: string]: string } = {
  'eu': 'Europe',
  'en': 'England',
  'un': 'International',
}

export const countryCodeToCountryName = async (countryCode: string): Promise<string> => {
  // Call the API to fetch the country name by the cc2 code
  // cca2 is the country code in ISO 3166-1 alpha-2 format
  // https://restcountries.com/v3.1/alpha/{cc2}

  if (specialCountries[countryCode]) {
    return specialCountries[countryCode]
  }
  
  try {
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch country name for code: ${countryCode}`)
    }
    const data = await response.json()
    if (!data || !data[0] || !data[0].name || !data[0].name.common) {
      throw new Error(`Invalid data format received for country code: ${countryCode}`)
    }
    return data[0].name.common
  } catch (error) {
    console.error(error)
    return countryCode
  }
}

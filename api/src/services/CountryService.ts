import { CountryApiModel } from '@/models/contract/CountryApiModel'
import {
  REST_COUNTRIES_CACHE_KEY,
  REST_COUNTRIES_CACHE_TTL_SECONDS,
  REST_COUNTRIES_FLAG_CDN_URL,
  REST_COUNTRIES_PAGE_SIZE,
  REST_COUNTRIES_REQUEST_TIMEOUT_MS,
  REST_COUNTRIES_RESPONSE_FIELDS,
  REST_COUNTRIES_URL,
  RestCountriesResponse,
} from '@/models/RestCountries'
import CacheService from '@/services/CacheService'

const SPECIAL_COUNTRIES = [
  new CountryApiModel('eu', 'Europe', 'https://flagpedia.net/data/org/w580/eu.webp'),
  new CountryApiModel('en', 'England', 'https://flagpedia.net/data/flags/w580/gb-eng.webp'),
  new CountryApiModel('un', 'International', 'https://flagpedia.net/data/org/w580/un.webp'),
]

const fetchCountryPage = async (apiKey: string, offset: number): Promise<RestCountriesResponse> => {
  const query = new URLSearchParams({
    limit: String(REST_COUNTRIES_PAGE_SIZE),
    offset: String(offset),
    response_fields: REST_COUNTRIES_RESPONSE_FIELDS,
  })
  const response = await fetch(`${REST_COUNTRIES_URL}?${query}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(REST_COUNTRIES_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`REST Countries returned status ${response.status}`)
  }

  return await response.json() as RestCountriesResponse
}

const fetchAllCountries = async (): Promise<CountryApiModel[]> => {
  const apiKey = process.env.REST_COUNTRIES_API_KEY
  if (!apiKey) {
    throw new Error('REST_COUNTRIES_API_KEY is not configured')
  }

  const countries: CountryApiModel[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const payload = await fetchCountryPage(apiKey, offset)
    countries.push(...payload.data.objects.map(country => {
      const code = country.codes.alpha_2.toLowerCase()
      return new CountryApiModel(
        code,
        country.names.common,
        `${REST_COUNTRIES_FLAG_CDN_URL}/${code}.png`,
      )
    }))
    hasMore = payload.data.meta.more
    if (hasMore && payload.data.meta.count === 0) {
      throw new Error('REST Countries returned an empty page before pagination completed')
    }
    offset += payload.data.meta.count
  }

  return [...countries, ...SPECIAL_COUNTRIES]
}

/** Fetches and caches all countries exposed by REST Countries v5. */
export const getCountries = async (): Promise<CountryApiModel[]> => {
  const cachedCountries = CacheService.get<CountryApiModel[]>(REST_COUNTRIES_CACHE_KEY)
  if (cachedCountries) {
    return cachedCountries
  }

  const countries = await fetchAllCountries()
  CacheService.set(REST_COUNTRIES_CACHE_KEY, countries, REST_COUNTRIES_CACHE_TTL_SECONDS)
  return countries
}

/** Resolves a two-letter country code using the shared countries dataset. */
export const countryCodeToCountryName = async (countryCode: string): Promise<string> => {
  try {
    const countries = await getCountries()
    return countries.find(country => country.code === countryCode.toLowerCase())?.name ?? countryCode
  } catch (error) {
    console.error('Error resolving country code:', error)
    return countryCode
  }
}

export const REST_COUNTRIES_URL = 'https://api.restcountries.com/countries/v5'
export const REST_COUNTRIES_FLAG_CDN_URL = 'https://flags.restcountries.com/v5/w320'
export const REST_COUNTRIES_PAGE_SIZE = 100
export const REST_COUNTRIES_REQUEST_TIMEOUT_MS = 5_000
export const REST_COUNTRIES_CACHE_KEY = 'rest-countries-v5'
export const REST_COUNTRIES_CACHE_TTL_SECONDS = 24 * 60 * 60
export const REST_COUNTRIES_RESPONSE_FIELDS = 'names.common,codes.alpha_2'

/** Country record returned by REST Countries v5. */
export interface RestCountry {
  names: {
    common: string
  }
  codes: {
    alpha_2: string
  }
}

/** Paginated REST Countries v5 response. */
export interface RestCountriesResponse {
  data: {
    objects: RestCountry[]
    meta: {
      count: number
      more: boolean
    }
  }
}

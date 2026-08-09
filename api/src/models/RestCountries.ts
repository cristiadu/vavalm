/** REST Countries v5 endpoint used to retrieve country records. */
export const REST_COUNTRIES_URL = 'https://api.restcountries.com/countries/v5'
/** REST Countries v5 CDN prefix used to build flag image URLs. */
export const REST_COUNTRIES_FLAG_CDN_URL = 'https://flags.restcountries.com/v5/w320'
/** Maximum REST Countries page size available to the repository plan. */
export const REST_COUNTRIES_PAGE_SIZE = 100
/** Maximum duration allowed for one REST Countries request. */
export const REST_COUNTRIES_REQUEST_TIMEOUT_MS = 5_000
/** Cache key for the mapped REST Countries response. */
export const REST_COUNTRIES_CACHE_KEY = 'rest-countries-v5'
/** Cache lifetime for a successful REST Countries response. */
export const REST_COUNTRIES_CACHE_TTL_SECONDS = 24 * 60 * 60
/** REST Countries fields required by the VaValM country contract. */
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

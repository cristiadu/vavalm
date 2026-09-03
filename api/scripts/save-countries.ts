import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { SAVED_COUNTRIES_FILE } from '@/models/RestCountries'
import { fetchAllCountries } from '@/services/CountryService'

// Captures the dataset next to the bundle so the key stays with the build and
// never ships. Without the key this saves nothing and the application calls out.

const apiKey = process.env.REST_COUNTRIES_API_KEY
const destination = path.resolve(import.meta.dirname, '..', 'dist', SAVED_COUNTRIES_FILE)

if (!apiKey) {
  console.info(`No REST_COUNTRIES_API_KEY set, leaving ${SAVED_COUNTRIES_FILE} unwritten.`)
} else {
  const countries = await fetchAllCountries(apiKey)
  if (countries.length === 0) {
    throw new Error('REST Countries returned no countries')
  }

  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, `${JSON.stringify(countries)}\n`)
  console.info(`Saved ${countries.length} countries to ${destination}`)
}

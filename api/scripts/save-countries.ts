import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { SAVED_COUNTRIES_FILE } from '@/models/RestCountries'
import { fetchAllCountries } from '@/services/CountryService'

/**
 * Capture the REST Countries dataset next to the bundle at build time.
 *
 * The API key belongs to the build, not to the artifact: a distributed desktop
 * application that carried it would hand it to everyone who installs it. A
 * build without the key saves nothing, and the application falls back to
 * calling REST Countries itself.
 */

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

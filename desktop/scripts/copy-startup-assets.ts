import { cp } from 'node:fs/promises'
import path from 'node:path'

// TypeScript compilation emits JavaScript alone, so the startup layout is
// mirrored into the build output that electron-builder packages.
const source = path.resolve(import.meta.dirname, '..', 'src', 'startup')
const destination = path.resolve(import.meta.dirname, '..', 'dist', 'startup')

await cp(source, destination, { recursive: true })
console.info(`Copied the startup layout to ${destination}`)

import { spawn } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  API_HEALTH_URL,
  APPLICATION_NAME,
  STARTUP_LOG_NAME,
  UI_URL,
} from '../src/runtime-config.ts'

// Packaging succeeds even when the packaged servers cannot start, so the
// installer is only trustworthy once the application has actually launched.

const READY_TIMEOUT_MS = 300000
const POLL_INTERVAL_MS = 2000
const SHUTDOWN_TIMEOUT_MS = 15000

// Electron derives its log directory from the platform's user data path, which
// cannot be queried from outside the application.
const STARTUP_LOG_PATHS = [
  path.join(process.env.HOME ?? '', 'Library', 'Logs', APPLICATION_NAME, STARTUP_LOG_NAME),
  path.join(process.env.HOME ?? '', '.config', APPLICATION_NAME, 'logs', STARTUP_LOG_NAME),
  path.join(process.env.APPDATA ?? '', APPLICATION_NAME, 'logs', STARTUP_LOG_NAME),
]

/**
 * Locate the executable in the unpacked build that electron-builder produced.
 *
 * @param releaseDirectory - Directory holding the electron-builder output.
 * @returns Path to the packaged executable.
 */
const resolveExecutable = async (releaseDirectory: string): Promise<string> => {
  const entries = await readdir(releaseDirectory, { withFileTypes: true })
  const unpacked = entries.find(entry => entry.isDirectory() && (
    entry.name === 'win-unpacked' || entry.name.startsWith('linux-') || entry.name.startsWith('mac')
  ))

  if (!unpacked) {
    throw new Error(`No unpacked application found in ${releaseDirectory}`)
  }

  const directory = path.join(releaseDirectory, unpacked.name)
  if (unpacked.name === 'win-unpacked') {
    return path.join(directory, 'VaValM.exe')
  }
  if (unpacked.name.startsWith('mac')) {
    return path.join(directory, 'VaValM.app', 'Contents', 'MacOS', 'VaValM')
  }

  return path.join(directory, 'VaValM')
}

/**
 * Read whatever the application has written to its startup log.
 *
 * @returns The log contents, or an empty string when no log exists yet.
 */
const readStartupLog = async (): Promise<string> => {
  for (const logPath of STARTUP_LOG_PATHS) {
    try {
      return await readFile(logPath, 'utf8')
    } catch {
      // The next candidate path may hold the log.
    }
  }

  return ''
}

/**
 * Report whether a server answers successfully.
 *
 * @param url - Address to probe.
 * @returns Whether the server answered with a successful status.
 */
const isAnswering = async (url: string): Promise<boolean> => {
  try {
    return (await fetch(url)).ok
  } catch {
    return false
  }
}

const executable = await resolveExecutable(path.resolve(import.meta.dirname, '..', 'release'))
console.info(`Launching ${executable}`)

// The application appends to its log across launches, so only what follows
// describes this run.
const priorLog = await readStartupLog()

// A runner grants the Chromium sandbox helper none of the privileges it needs.
const application = spawn(executable, process.platform === 'linux' ? ['--no-sandbox'] : [], {
  stdio: ['ignore', 'inherit', 'inherit'],
})

let exitCode: number | undefined
application.once('exit', code => {
  exitCode = code ?? undefined
})

const deadline = Date.now() + READY_TIMEOUT_MS
let failure: string | undefined
let ready = false

while (!ready && failure === undefined && Date.now() < deadline) {
  ready = await isAnswering(UI_URL) && await isAnswering(API_HEALTH_URL)
  if (ready) {
    break
  }

  // A failed launch waits on a modal dialog that nothing will dismiss on a
  // runner, so the application's own report ends the wait.
  const runLog = (await readStartupLog()).slice(priorLog.length)
  failure = runLog.split('\n').find(line => line.includes('startup failed'))
  if (failure === undefined && exitCode !== undefined) {
    failure = `the application exited with code ${exitCode}`
  }

  if (failure === undefined) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
  }
}

console.info((await readStartupLog()).slice(priorLog.length) || 'No startup.log was written.')

// The managed servers hold the loopback ports until the application has fully
// stopped, so a later run would otherwise probe the previous one as it dies. A
// failed launch waits on a modal dialog that can outlive the term signal.
if (exitCode === undefined) {
  application.kill()
  await Promise.race([
    new Promise<void>(resolve => application.once('exit', () => resolve())),
    new Promise<void>(resolve => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS)),
  ])

  if (exitCode === undefined) {
    application.kill('SIGKILL')
  }
}

if (!ready) {
  const timedOut = `no response from ${UI_URL} or ${API_HEALTH_URL} within ${READY_TIMEOUT_MS / 1000}s`
  console.error(`Desktop tests failed: ${failure ?? timedOut}`)
  process.exit(1)
}

console.info(`Desktop tests passed: ${UI_URL} and ${API_HEALTH_URL} both answered.`)

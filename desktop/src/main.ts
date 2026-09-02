import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, type WriteStream } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import asyncExitHook from 'async-exit-hook'
import { app, BrowserWindow, dialog, shell, utilityProcess, type UtilityProcess } from 'electron'
import EmbeddedPostgres from 'embedded-postgres'
import {
  createDesktopServerConfig,
  redactSecrets,
  resolveDesktopServerPaths,
  STARTUP_LOG_NAME,
} from '@/runtime-config'

const LOOPBACK_HOST = '127.0.0.1'
const DATABASE_NAME = 'vavalm'
const DATABASE_USER = 'vavalm'
const DATABASE_PASSWORD = 'vavalm-desktop'

// A first launch creates the database schema and downloads the seeded team
// logos before the API starts listening, so the budget covers a cold start on a
// slow machine. A managed process that dies is reported as soon as it exits
// rather than waiting this out.
const STARTUP_TIMEOUT_MS = 180000

// Electron owns the final exit event after the managed services have stopped.
asyncExitHook.unhookEvent('exit')

let apiProcess: UtilityProcess | undefined
let uiProcess: UtilityProcess | undefined
let postgres: EmbeddedPostgres | undefined
let desktopUiUrl: string | undefined
let startupLog: WriteStream | undefined
let isQuitting = false

// A packaged desktop build has no console to inspect, so managed process output
// is the only record of a failed launch. The per-launch secrets travel to those
// processes as environment variables and must never reach the file.
const redactedValues = new Set<string>([DATABASE_PASSWORD])

/**
 * Path of the log file collecting managed service output.
 *
 * The path is never passed through redaction: it contains the application name,
 * which can itself match a redacted value and would leave the reader chasing a
 * file that does not exist.
 */
const startupLogPath = (): string => path.join(app.getPath('logs'), STARTUP_LOG_NAME)

/**
 * Record managed service output, with per-launch secrets removed.
 *
 * @param source - Service the message came from.
 * @param message - Text to record.
 */
const writeStartupLog = (source: string, message: string): void => {
  const redacted = redactSecrets(message, redactedValues)

  try {
    if (!startupLog) {
      const logPath = startupLogPath()
      mkdirSync(path.dirname(logPath), { recursive: true })
      startupLog = createWriteStream(logPath, { flags: 'a' })
    }
    startupLog.write(`[${new Date().toISOString()}] [${source}] ${redacted.trimEnd()}\n`)
  } catch {
    // An install without a writable log directory still reports startup
    // failures through the error dialog.
  }
}

/** Find an available loopback port for the embedded database. */
const reserveAvailablePort = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not reserve a local database port'))
        return
      }

      server.close(error => {
        if (error) {
          reject(error)
          return
        }
        resolve(address.port)
      })
    })
  })
}

/**
 * Verify that a desktop server port can be bound before starting child processes.
 *
 * @param port - Loopback port to verify.
 */
const assertPortAvailable = async (port: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', () => reject(new Error(`Local port ${port} is already in use`)))
    server.listen(port, LOOPBACK_HOST, () => {
      server.close(error => error ? reject(error) : resolve())
    })
  })
}

/**
 * A managed server process and the exit code it reported, if it has stopped.
 */
type ManagedServer = {
  name: string
  process: UtilityProcess
  exitCode?: number
}

/**
 * Start a managed server and capture its output for troubleshooting.
 *
 * @param name - Service name used in log lines and startup errors.
 * @param modulePath - Server entrypoint to run.
 * @param cwd - Working directory for the server.
 * @param env - Environment for the server.
 * @returns The managed server, tracking the process and its exit code.
 */
const startServerProcess = (
  name: string,
  modulePath: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): ManagedServer => {
  const serverProcess = utilityProcess.fork(modulePath, [], { cwd, env, stdio: 'pipe' })
  const server: ManagedServer = { name, process: serverProcess }

  /**
   * Record a chunk of server output.
   *
   * @param chunk - Output emitted by the server.
   */
  const recordOutput = (chunk: Buffer): void => writeStartupLog(name, chunk.toString())

  serverProcess.stdout?.on('data', recordOutput)
  serverProcess.stderr?.on('data', recordOutput)
  serverProcess.once('exit', code => {
    server.exitCode = code
  })

  return server
}

/**
 * Wait until a managed server returns a successful response.
 *
 * A server that exits during startup is reported as soon as it stops, so a
 * crashed process does not spend the whole startup budget before failing.
 *
 * @param url - Health URL to poll.
 * @param server - Managed server expected to answer that URL.
 */
const waitForServer = async (url: string, server: ManagedServer): Promise<void> => {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (server.exitCode !== undefined) {
      throw new Error(
        `The ${server.name} server stopped during startup with exit code ${server.exitCode}.`,
      )
    }

    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Connection failures are expected until the local server finishes starting.
    }

    await new Promise(resolve => setTimeout(resolve, 250))
  }

  throw new Error(`Timed out waiting for ${url}`)
}

/**
 * Create the application database when the PostgreSQL cluster is new.
 *
 * @param database - Running embedded PostgreSQL instance.
 */
const ensureDatabaseExists = async (database: EmbeddedPostgres): Promise<void> => {
  const client = database.getPgClient('postgres', LOOPBACK_HOST)
  await client.connect()
  let databaseExists: boolean
  try {
    const result = await client.query<{ exists: number }>(
      'SELECT 1 AS exists FROM pg_database WHERE datname = $1',
      [DATABASE_NAME],
    )
    databaseExists = result.rowCount === 1
  } finally {
    await client.end()
  }

  if (!databaseExists) {
    await database.createDatabase(DATABASE_NAME)
  }
}

/** Start the managed PostgreSQL instance and return its connection URL. */
const startDatabase = async (): Promise<string> => {
  const databasePort = await reserveAvailablePort()
  const databaseDir = path.join(app.getPath('userData'), 'postgres')
  const isInitialized = existsSync(path.join(databaseDir, 'PG_VERSION'))
  postgres = new EmbeddedPostgres({
    databaseDir,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    port: databasePort,
    persistent: true,
    onLog: (message: string): void => writeStartupLog('database', message),
    onError: (messageOrError): void => writeStartupLog('database', String(messageOrError)),
  })

  if (!isInitialized) {
    await postgres.initialise()
  }

  // The cluster rejects without a reason when it exits before reporting that it
  // is ready, so the log is the only place the cause is recorded.
  try {
    await postgres.start()
  } catch {
    throw new Error('The embedded database stopped before it was ready.')
  }
  await ensureDatabaseExists(postgres)

  return `postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@${LOOPBACK_HOST}:${databasePort}/${DATABASE_NAME}`
}

/**
 * Start the API and UI child processes after checking their fixed ports.
 *
 * @param databaseUrl - Connection URL for the managed embedded database.
 * @returns URL served by the desktop UI.
 */
const startApplicationServers = async (databaseUrl: string): Promise<string> => {
  const { apiRoot, uiRoot } = resolveDesktopServerPaths(
    app.isPackaged,
    process.resourcesPath,
    import.meta.dirname,
  )
  const jwtSecret = randomUUID()
  redactedValues.add(jwtSecret)
  const serverConfig = createDesktopServerConfig(process.env, databaseUrl, jwtSecret)
  await Promise.all(serverConfig.ports.map(assertPortAvailable))

  const api = startServerProcess(
    'api',
    path.join(apiRoot, 'dist', 'bundle.js'),
    apiRoot,
    serverConfig.apiEnvironment,
  )
  apiProcess = api.process
  await waitForServer(serverConfig.apiHealthUrl, api)

  const ui = startServerProcess(
    'ui',
    path.join(uiRoot, 'server.js'),
    uiRoot,
    serverConfig.uiEnvironment,
  )
  uiProcess = ui.process
  await waitForServer(serverConfig.uiUrl, ui)

  return serverConfig.uiUrl
}

/**
 * Create a sandboxed Electron window for the local UI.
 *
 * @param uiUrl - Local UI address to load.
 */
const createMainWindow = async (uiUrl: string): Promise<void> => {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  window.once('ready-to-show', () => window.show())
  await window.loadURL(uiUrl)
}

/** Stop every process owned by the Electron application. */
const stopApplication = async (): Promise<void> => {
  uiProcess?.kill()
  apiProcess?.kill()
  uiProcess = undefined
  apiProcess = undefined
  desktopUiUrl = undefined

  if (postgres) {
    await postgres.stop()
    postgres = undefined
  }
}

/** Start the database, API, UI, and main application window in dependency order. */
const startApplication = async (): Promise<void> => {
  const databaseUrl = await startDatabase()
  desktopUiUrl = await startApplicationServers(databaseUrl)
  await createMainWindow(desktopUiUrl)
}

/** Stop managed services before allowing Electron to quit. */
const quitApplication = async (): Promise<void> => {
  await stopApplication()
  app.exit(0)
}

/** Start Electron and report startup failures without leaving managed processes running. */
const runApplication = async (): Promise<void> => {
  try {
    await app.whenReady()
    await startApplication()
  } catch (error) {
    await stopApplication()
    const message = error instanceof Error ? error.message : 'An unexpected startup error occurred.'
    // A packaged build has no usable stderr, so the log file carries the report.
    // The log path is appended after redaction so it stays readable.
    writeStartupLog('startup', `VaValM startup failed: ${message}`)
    dialog.showErrorBox(
      'VaValM could not start',
      `${redactSecrets(message, redactedValues)}\n\nDetails are in ${startupLogPath()}`,
    )
    isQuitting = true
    app.exit(1)
  }
}

if (!app.requestSingleInstanceLock()) {
  app.exit(0)
} else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0]
    if (window) {
      if (window.isMinimized()) {
        window.restore()
      }
      window.focus()
    }
  })

  app.on('before-quit', event => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    isQuitting = true
    void quitApplication()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && uiProcess && desktopUiUrl) {
      void createMainWindow(desktopUiUrl)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  void runApplication()
}

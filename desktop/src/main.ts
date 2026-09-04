import { randomUUID } from 'node:crypto'
import { appendFileSync, createWriteStream, existsSync, mkdirSync, type WriteStream } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import asyncExitHook from 'async-exit-hook'
import { app, BrowserWindow, dialog, shell, utilityProcess, type UtilityProcess } from 'electron'
import EmbeddedPostgres from 'embedded-postgres'
import {
  createDesktopServerConfig,
  redactSecrets,
  resolveDesktopServerPaths,
  STARTUP_FAILURE_MARKER,
  STARTUP_LOG_NAME,
} from '@/runtime-config'

const LOOPBACK_HOST = '127.0.0.1'
const DATABASE_NAME = 'vavalm'
const DATABASE_USER = 'vavalm'
const DATABASE_PASSWORD = 'vavalm-desktop'

// A first launch seeds the database before the API listens, so this covers a
// cold start. A server that dies is reported without waiting it out.
const STARTUP_TIMEOUT_MS = 180000

// Each database phase settles on a stream message or a child process exit, and
// none of them carries a timeout. A phase that never settles is not a
// rejection, so it would never reach the startup error handler and the
// application would stay running with no window and no message.
const DATABASE_INITIALISE_TIMEOUT_MS = 300000
const DATABASE_START_TIMEOUT_MS = 120000
const DATABASE_CONNECT_TIMEOUT_MS = 30000

// Binding a loopback port is the one startup step that runs before anything is
// logged, so a bind that never completes leaves neither a window message nor a
// log line. Security software on Windows can hold a bind open indefinitely.
const PORT_TIMEOUT_MS = 15000

// Layout shown while the managed services start. The window paints the layout's
// own background so the first frame does not flash white.
const STARTUP_PAGE_NAME = 'startup.html'
const STARTUP_PHASE_ELEMENT_ID = 'phase'
const STARTUP_DETAIL_ELEMENT_ID = 'detail'
const STARTUP_BACKGROUND_COLOR = '#16161a'

// Electron owns the final exit event after the managed services have stopped.
asyncExitHook.unhookEvent('exit')

let apiProcess: UtilityProcess | undefined
let uiProcess: UtilityProcess | undefined
let postgres: EmbeddedPostgres | undefined
let desktopUiUrl: string | undefined
let startupLog: WriteStream | undefined
let isQuitting = false

// Held so the startup layout can be repainted after a reload, which would
// otherwise leave its placeholder text on screen for the rest of the launch.
// Cleared once the UI itself is loaded, which is what stops the repaint.
let mainWindow: BrowserWindow | undefined
let startupPhase: string | undefined
let startupDetail: string | undefined

// A packaged build has no console, so this file is the only record of a failed
// launch. The secrets reach those processes as environment variables.
const redactedValues = new Set<string>([DATABASE_PASSWORD])

/**
 * Path of the log file collecting managed service output.
 *
 * Never redacted: it contains the application name, which can match a redacted
 * value and would name a file that does not exist.
 */
const startupLogPath = (): string => path.join(app.getPath('logs'), STARTUP_LOG_NAME)

/**
 * Format a log line that already has its secrets removed.
 *
 * @param source - Service the message came from.
 * @param redacted - Text to record, with secrets already replaced.
 * @returns The line to append to the startup log.
 */
const startupLogLine = (source: string, redacted: string): string =>
  `[${new Date().toISOString()}] [${source}] ${redacted.trimEnd()}\n`

/**
 * Build a statement assigning text to one element of the startup layout.
 *
 * Both values are encoded, so a service message cannot alter the layout.
 *
 * @param elementId - Element to assign to.
 * @param text - Text to show.
 * @returns The statement to evaluate in the startup layout.
 */
const assignStartupText = (elementId: string, text: string): string =>
  `document.getElementById(${JSON.stringify(elementId)}).textContent = ${JSON.stringify(text)};`

/**
 * Repaint the startup layout with the phase and the latest service message.
 *
 * Reapplied on every load of the layout, so a reload does not strand the
 * placeholder text, and a launch that stalls still shows where it stopped.
 */
const renderStartupProgress = async (): Promise<void> => {
  const window = mainWindow
  if (startupPhase === undefined || !window || window.isDestroyed()) {
    return
  }

  try {
    await window.webContents.executeJavaScript(
      assignStartupText(STARTUP_PHASE_ELEMENT_ID, startupPhase)
      + assignStartupText(STARTUP_DETAIL_ELEMENT_ID, startupDetail ?? ''),
    )
  } catch {
    // The window navigated or closed while the phase was being painted, and
    // every caller reports progress rather than depending on it.
  }
}

/**
 * Record managed service output.
 *
 * Buffered, because the managed servers keep logging for as long as they run.
 *
 * @param source - Service the message came from.
 * @param message - Text to record.
 */
const writeStartupLog = (source: string, message: string): void => {
  const redacted = redactSecrets(message, redactedValues)

  // The last line of the chunk is the service's most recent word on its own
  // progress, which is what a stalled launch needs to show.
  const lastLine = redacted.split('\n').map(line => line.trim()).filter(Boolean).at(-1)
  if (lastLine !== undefined) {
    startupDetail = `${source}: ${lastLine}`
    void renderStartupProgress()
  }

  try {
    if (!startupLog) {
      const logPath = startupLogPath()
      mkdirSync(path.dirname(logPath), { recursive: true })
      startupLog = createWriteStream(logPath, { flags: 'a' })
    }
    startupLog.write(startupLogLine(source, redacted))
  } catch {
    // The error dialog still reports the failure without a writable log.
  }
}

/**
 * Record a startup failure and flush it before the error dialog opens.
 *
 * Written without the buffered stream: a launch watcher reads this line to stop
 * waiting, and the modal dialog holds the main thread, so a queued write may
 * never reach disk.
 *
 * @param message - Failure to record.
 */
const writeStartupFailure = (message: string): void => {
  try {
    const logPath = startupLogPath()
    mkdirSync(path.dirname(logPath), { recursive: true })
    appendFileSync(
      logPath,
      startupLogLine('startup', `VaValM ${STARTUP_FAILURE_MARKER}: ${redactSecrets(message, redactedValues)}`),
    )
  } catch {
    // The error dialog still reports the failure without a writable log.
  }
}

/**
 * Fail a startup phase that never settles.
 *
 * @param phase - Phase name used in the timeout message.
 * @param timeoutMs - How long the phase may take.
 * @param work - Phase to run.
 * @returns Whatever the phase resolved with.
 */
const withTimeout = async <T>(
  phase: string,
  timeoutMs: number,
  work: () => Promise<T>,
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined

  // Only ever rejects, and the timer is cleared once the race settles, so a
  // phase that finishes in time leaves no rejection behind.
  const expiry = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${phase} did not finish within ${timeoutMs / 1000}s.`)),
      timeoutMs,
    )
  })

  try {
    return await Promise.race([work(), expiry])
  } finally {
    clearTimeout(timer)
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
 * A server that exits is reported as soon as it stops.
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
  const databasePort = await withTimeout(
    'Reserving a local database port',
    PORT_TIMEOUT_MS,
    reserveAvailablePort,
  )
  const databaseDir = path.join(app.getPath('userData'), 'postgres')
  const isInitialized = existsSync(path.join(databaseDir, 'PG_VERSION'))
  const database = new EmbeddedPostgres({
    databaseDir,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    port: databasePort,
    persistent: true,
    onLog: (message: string): void => writeStartupLog('database', message),
    onError: (messageOrError): void => writeStartupLog('database', String(messageOrError)),
  })
  postgres = database

  if (!isInitialized) {
    await withTimeout(
      'Preparing the local database',
      DATABASE_INITIALISE_TIMEOUT_MS,
      () => database.initialise(),
    )
  }

  // The cluster rejects without a reason, so the log holds the cause.
  try {
    await withTimeout('Starting the local database', DATABASE_START_TIMEOUT_MS, () => database.start())
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message
        ? error.message
        : 'The embedded database stopped before it was ready.',
      { cause: error },
    )
  }

  await withTimeout(
    'Connecting to the local database',
    DATABASE_CONNECT_TIMEOUT_MS,
    () => ensureDatabaseExists(database),
  )

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
  await withTimeout(
    'Checking the local server ports',
    PORT_TIMEOUT_MS,
    () => Promise.all(serverConfig.ports.map(assertPortAvailable)),
  )

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
 * Create the sandboxed Electron window for the local UI.
 *
 * Shown before the servers exist, so a first launch reports progress instead of
 * leaving the user with no sign that the application started.
 *
 * @returns The created window.
 */
const createMainWindow = async (): Promise<BrowserWindow> => {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: STARTUP_BACKGROUND_COLOR,
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

  window.webContents.on('did-finish-load', () => {
    void renderStartupProgress()
  })

  mainWindow = window
  await window.loadFile(path.join(import.meta.dirname, 'startup', STARTUP_PAGE_NAME))
  return window
}

/**
 * Report the current startup phase in the window.
 *
 * Assigned as text, so a service message cannot alter the layout.
 *
 * @param message - Phase to report.
 */
const reportStartupPhase = async (message: string): Promise<void> => {
  startupPhase = message
  await renderStartupProgress()
}

/**
 * Reopen the main window on the UI server that is already running.
 *
 * @param uiUrl - Local UI address to load.
 */
const reopenMainWindow = async (uiUrl: string): Promise<void> => {
  const window = await createMainWindow()
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

/** Start the window, database, API, and UI in dependency order. */
const startApplication = async (): Promise<void> => {
  const window = await createMainWindow()

  await reportStartupPhase('Preparing the local database…')
  const databaseUrl = await startDatabase()

  await reportStartupPhase('Starting the game servers…')
  desktopUiUrl = await startApplicationServers(databaseUrl)

  // Stops the startup layout being repainted over the UI itself.
  startupPhase = undefined
  startupDetail = undefined

  if (!window.isDestroyed()) {
    await window.loadURL(desktopUiUrl)
  }
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
    // No usable stderr in a packaged build. The path is appended after
    // redaction so it stays readable.
    writeStartupFailure(message)
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
    const uiUrl = desktopUiUrl
    if (BrowserWindow.getAllWindows().length === 0 && uiProcess && uiUrl) {
      void reopenMainWindow(uiUrl)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  void runApplication()
}

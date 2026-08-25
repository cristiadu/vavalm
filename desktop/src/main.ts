import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import asyncExitHook from 'async-exit-hook'
import { app, BrowserWindow, dialog, shell, utilityProcess, type UtilityProcess } from 'electron'
import EmbeddedPostgres from 'embedded-postgres'
import {
  createDesktopServerConfig,
  resolveDesktopServerPaths,
} from '@/runtime-config.js'

const LOOPBACK_HOST = '127.0.0.1'
const DATABASE_NAME = 'vavalm'
const DATABASE_USER = 'vavalm'
const DATABASE_PASSWORD = 'vavalm-desktop'
const STARTUP_TIMEOUT_MS = 60000

// Electron owns the final exit event after the managed services have stopped.
asyncExitHook.unhookEvent('exit')

let apiProcess: UtilityProcess | undefined
let uiProcess: UtilityProcess | undefined
let postgres: EmbeddedPostgres | undefined
let desktopUiUrl: string | undefined
let isQuitting = false

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
 * Wait until a local server returns a successful response.
 *
 * @param url - Health URL to poll.
 */
const waitForUrl = async (url: string): Promise<void> => {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
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
  })

  if (!isInitialized) {
    await postgres.initialise()
  }
  await postgres.start()
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
  const serverConfig = createDesktopServerConfig(process.env, databaseUrl, jwtSecret)
  await Promise.all(serverConfig.ports.map(assertPortAvailable))

  apiProcess = utilityProcess.fork(path.join(apiRoot, 'dist', 'bundle.js'), [], {
    cwd: apiRoot,
    env: serverConfig.apiEnvironment,
    stdio: 'inherit',
  })

  await waitForUrl(serverConfig.apiHealthUrl)

  uiProcess = utilityProcess.fork(path.join(uiRoot, 'server.js'), [], {
    cwd: uiRoot,
    env: serverConfig.uiEnvironment,
    stdio: 'inherit',
  })

  await waitForUrl(serverConfig.uiUrl)
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
    const sanitizedMessage = message.replaceAll(DATABASE_PASSWORD, '[redacted]')
    process.stderr.write(`VaValM startup failed: ${sanitizedMessage}\n`)
    dialog.showErrorBox('VaValM could not start', sanitizedMessage)
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

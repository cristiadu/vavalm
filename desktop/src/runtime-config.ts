import path from 'node:path'

const API_HOST = '127.0.0.1'
const API_PORT = 18000
const UI_HOST = '127.0.0.1'
const UI_PORT = 13000

/** Health address of the managed API server. */
export const API_HEALTH_URL = `http://${API_HOST}:${API_PORT}/api/health`

/** Address the managed UI server serves the application on. */
export const UI_URL = `http://${UI_HOST}:${UI_PORT}`

/** Log file collecting managed service output. */
export const STARTUP_LOG_NAME = 'startup.log'

/** Marker the application records when a launch fails, so a watcher can stop waiting. */
export const STARTUP_FAILURE_MARKER = 'startup failed'

/**
 * Application name Electron derives its user data and log directories from.
 *
 * Electron takes this from the package name, so it also names the directory
 * that a process outside the application has to look in for the startup log.
 */
export const APPLICATION_NAME = '@cristiadu/vavalm-desktop'

type DesktopServerPaths = {
  apiRoot: string
  uiRoot: string
}

type DesktopServerConfig = {
  apiEnvironment: NodeJS.ProcessEnv
  apiHealthUrl: string
  ports: readonly [number, number]
  uiEnvironment: NodeJS.ProcessEnv
  uiUrl: string
}

/**
 * Remove per-launch secrets from text before it is recorded or displayed.
 *
 * The database password and the per-launch JWT secret reach the managed
 * servers as environment variables, so anything those servers report can quote
 * them back.
 *
 * @param message - Text that may contain a secret.
 * @param secrets - Secret values to replace.
 * @returns The message with every secret replaced.
 */
export const redactSecrets = (message: string, secrets: Iterable<string>): string => {
  let redacted = message
  for (const secret of secrets) {
    // An empty secret would match at every position and mangle the message.
    if (secret) {
      redacted = redacted.replaceAll(secret, '[redacted]')
    }
  }

  return redacted
}

/**
 * Resolve the API and UI build directories used by Electron.
 *
 * @param isPackaged - Whether Electron is running from an installed application.
 * @param resourcesPath - Electron's packaged resources directory.
 * @param moduleDirectory - Directory containing the compiled desktop entrypoint.
 * @returns Paths to the API and UI server builds.
 */
export const resolveDesktopServerPaths = (
  isPackaged: boolean,
  resourcesPath: string,
  moduleDirectory: string,
): DesktopServerPaths => {
  const serverRoot = isPackaged
    ? path.join(resourcesPath, 'app-server')
    : path.resolve(moduleDirectory, '..', '..')

  return {
    apiRoot: path.join(serverRoot, 'api'),
    uiRoot: isPackaged
      ? path.join(serverRoot, 'ui', 'ui')
      : path.join(serverRoot, 'ui', '.next', 'standalone', 'ui'),
  }
}

/**
 * Build the isolated environment and address configuration for both servers.
 *
 * @param parentEnvironment - Environment inherited from the Electron process.
 * @param databaseUrl - Connection URL for the managed embedded database.
 * @param jwtSecret - Per-launch secret shared by the API and UI.
 * @returns Child-process environments, health URLs, and reserved server ports.
 */
export const createDesktopServerConfig = (
  parentEnvironment: NodeJS.ProcessEnv,
  databaseUrl: string,
  jwtSecret: string,
): DesktopServerConfig => ({
  apiEnvironment: {
    ...parentEnvironment,
    DATABASE_SSL: 'false',
    DATABASE_URL: databaseUrl,
    HOST: API_HOST,
    JWT_SECRET: jwtSecret,
    NODE_ENV: 'production',
    PORT: String(API_PORT),
  },
  apiHealthUrl: API_HEALTH_URL,
  ports: [API_PORT, UI_PORT],
  uiEnvironment: {
    ...parentEnvironment,
    HOSTNAME: UI_HOST,
    JWT_SECRET: jwtSecret,
    NODE_ENV: 'production',
    PORT: String(UI_PORT),
  },
  uiUrl: UI_URL,
})

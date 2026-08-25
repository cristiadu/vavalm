import path from 'node:path'

const API_HOST = '127.0.0.1'
const API_PORT = 18000
const UI_HOST = '127.0.0.1'
const UI_PORT = 13000

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
  apiHealthUrl: `http://${API_HOST}:${API_PORT}/api/health`,
  ports: [API_PORT, UI_PORT],
  uiEnvironment: {
    ...parentEnvironment,
    HOSTNAME: UI_HOST,
    JWT_SECRET: jwtSecret,
    NODE_ENV: 'production',
    PORT: String(UI_PORT),
  },
  uiUrl: `http://${UI_HOST}:${UI_PORT}`,
})

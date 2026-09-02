import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  createDesktopServerConfig,
  redactSecrets,
  resolveDesktopServerPaths,
} from '@/runtime-config'

describe('Desktop runtime configuration', () => {
  it('resolves packaged server resources', () => {
    // GIVEN a packaged application resource directory
    const resourcesPath = path.resolve('opt', 'VaValM', 'resources')

    // WHEN its bundled server paths are resolved
    const paths = resolveDesktopServerPaths(true, resourcesPath, path.join(path.sep, 'unused'))

    // THEN both servers point into the packaged app-server resources
    expect(paths).toEqual({
      apiRoot: path.join(resourcesPath, 'app-server', 'api'),
      uiRoot: path.join(resourcesPath, 'app-server', 'ui', 'ui'),
    })
  })

  it('resolves development build resources', () => {
    // GIVEN the compiled desktop module directory
    const workspaceDirectory = path.resolve('workspace')
    const moduleDirectory = path.join(workspaceDirectory, 'desktop', 'dist')

    // WHEN its local server paths are resolved
    const paths = resolveDesktopServerPaths(false, path.join(path.sep, 'unused'), moduleDirectory)

    // THEN both servers point at their workspace build outputs
    expect(paths).toEqual({
      apiRoot: path.join(workspaceDirectory, 'api'),
      uiRoot: path.join(workspaceDirectory, 'ui', '.next', 'standalone', 'ui'),
    })
  })

  it('isolates desktop services from the development ports', () => {
    // GIVEN fixed credentials and a deterministic parent environment
    const parentEnvironment = { PATH: '/usr/bin' }

    // WHEN the child-process configuration is created
    const config = createDesktopServerConfig(
      parentEnvironment,
      'postgres://vavalm:password@127.0.0.1:15432/vavalm',
      'fixed-test-secret',
    )

    // THEN the API and UI have separate loopback ports and share only the app secret
    expect(config).toEqual({
      apiEnvironment: {
        PATH: '/usr/bin',
        DATABASE_SSL: 'false',
        DATABASE_URL: 'postgres://vavalm:password@127.0.0.1:15432/vavalm',
        HOST: '127.0.0.1',
        JWT_SECRET: 'fixed-test-secret',
        NODE_ENV: 'production',
        PORT: '18000',
      },
      apiHealthUrl: 'http://127.0.0.1:18000/api/health',
      ports: [18000, 13000],
      uiEnvironment: {
        PATH: '/usr/bin',
        HOSTNAME: '127.0.0.1',
        JWT_SECRET: 'fixed-test-secret',
        NODE_ENV: 'production',
        PORT: '13000',
      },
      uiUrl: 'http://127.0.0.1:13000',
    })
  })

  it('redacts every per-launch secret a managed server reports', () => {
    // GIVEN server output quoting both the database password and the JWT secret
    const message = 'connect failed for postgres://vavalm:vavalm-desktop@127.0.0.1:15432/vavalm using fixed-test-secret'

    // WHEN the secrets are redacted
    const redacted = redactSecrets(message, ['vavalm-desktop', 'fixed-test-secret'])

    // THEN neither value survives and the rest of the message is intact
    expect(redacted).toBe('connect failed for postgres://vavalm:[redacted]@127.0.0.1:15432/vavalm using [redacted]')
  })

  it('leaves a message untouched when a secret is empty', () => {
    // GIVEN an empty secret, which would otherwise match at every position
    const message = 'The api server stopped during startup with exit code 1'

    // WHEN the secrets are redacted
    const redacted = redactSecrets(message, [''])

    // THEN the message is unchanged
    expect(redacted).toBe(message)
  })
})

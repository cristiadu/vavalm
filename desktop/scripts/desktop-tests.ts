import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cp, readdir, readFile, rm } from 'node:fs/promises'
import { get } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  API_HEALTH_URL,
  APPLICATION_NAME,
  createDesktopServerConfig,
  resolveDesktopServerPaths,
  STARTUP_FAILURE_MARKER,
  STARTUP_LOG_NAME,
  UI_URL,
} from '../src/runtime-config.ts'

// Packaging succeeds even when the packaged servers cannot start.

const READY_TIMEOUT_MS = 300000
const POLL_INTERVAL_MS = 2000
const SHUTDOWN_TIMEOUT_MS = 15000

// PostgreSQL declines any account holding the Administrators SID, and a Windows
// runner only offers one. The Basic User trust level drops that SID on the same
// interactive desktop, which the embedded database needs and the window needs.
const WINDOWS_BASIC_USER_TRUST_LEVEL = '0x20000'

// Electron's log directory cannot be queried from outside the application.
const STARTUP_LOG_PATHS = [
  path.join(process.env.HOME ?? '', 'Library', 'Logs', APPLICATION_NAME, STARTUP_LOG_NAME),
  path.join(process.env.HOME ?? '', '.config', APPLICATION_NAME, 'logs', STARTUP_LOG_NAME),
  path.join(process.env.APPDATA ?? '', APPLICATION_NAME, 'logs', STARTUP_LOG_NAME),
]

type PackagedApplication = {
  executable: string
  resourcesPath: string
}

/**
 * Locate the unpacked build that electron-builder produced.
 *
 * @param releaseDirectory - Directory holding the electron-builder output.
 * @returns The packaged executable and the resources it was bundled with.
 */
const resolvePackagedApplication = async (releaseDirectory: string): Promise<PackagedApplication> => {
  const entries = await readdir(releaseDirectory, { withFileTypes: true })
  const unpacked = entries.find(entry => entry.isDirectory() && (
    entry.name === 'win-unpacked' || entry.name.startsWith('linux-') || entry.name.startsWith('mac')
  ))

  if (!unpacked) {
    throw new Error(`No unpacked application found in ${releaseDirectory}`)
  }

  const directory = path.join(releaseDirectory, unpacked.name)
  if (unpacked.name === 'win-unpacked') {
    return { executable: path.join(directory, 'VaValM.exe'), resourcesPath: path.join(directory, 'resources') }
  }
  if (unpacked.name.startsWith('mac')) {
    const contents = path.join(directory, 'VaValM.app', 'Contents')
    return { executable: path.join(contents, 'MacOS', 'VaValM'), resourcesPath: path.join(contents, 'Resources') }
  }

  return { executable: path.join(directory, 'VaValM'), resourcesPath: path.join(directory, 'resources') }
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
 * No shared agent, so no pooled socket is left to tear down on exit.
 *
 * @param url - Address to probe.
 * @returns Whether the server answered with a successful status.
 */
const isAnswering = async (url: string): Promise<boolean> => {
  return new Promise(resolve => {
    const request = get(url, { agent: false }, response => {
      response.resume()
      const status = response.statusCode ?? 0
      resolve(status >= 200 && status < 300)
    })

    request.once('error', () => resolve(false))
    request.setTimeout(POLL_INTERVAL_MS, () => {
      request.destroy()
      resolve(false)
    })
  })
}

/**
 * Stop a server and wait for it to release the loopback ports.
 *
 * A failed launch waits on a modal dialog that can outlive the term signal.
 *
 * @param child - Process to stop.
 * @param hasExited - Whether the process has already reported its exit.
 */
const stopServer = async (child: ChildProcess, hasExited: () => boolean): Promise<void> => {
  if (hasExited()) {
    return
  }

  child.kill()
  await Promise.race([
    new Promise<void>(resolve => child.once('exit', () => resolve())),
    new Promise<void>(resolve => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS)),
  ])

  if (!hasExited()) {
    child.kill('SIGKILL')
  }
}

/**
 * Serve the packaged UI and require it to answer.
 *
 * PostgreSQL refuses the elevated account a Windows runner provides. Serving
 * the UI alone needs no database, display or privileges, and still exercises
 * the traced Next.js runtime.
 *
 * @param resourcesPath - Resources directory of the unpacked build.
 * @returns Whether the packaged UI answered.
 */
const checkPackagedUi = async (resourcesPath: string): Promise<boolean> => {
  const { uiRoot } = resolveDesktopServerPaths(true, resourcesPath, import.meta.dirname)
  const { uiEnvironment } = createDesktopServerConfig(process.env, 'postgres://unused', randomUUID())

  // Inside the repository, Node resolves anything missing from the package
  // against the repository's own node_modules and the check passes regardless.
  // An installed application has no such parent.
  const isolated = path.join(tmpdir(), `vavalm-desktop-tests-${randomUUID()}`)
  await cp(path.dirname(uiRoot), isolated, { recursive: true, verbatimSymlinks: true })
  const isolatedRoot = path.join(isolated, path.basename(uiRoot))
  console.info(`Serving ${path.join(isolatedRoot, 'server.js')}`)

  const uiServer = spawn(process.execPath, [path.join(isolatedRoot, 'server.js')], {
    cwd: isolatedRoot,
    env: uiEnvironment,
    stdio: ['ignore', 'inherit', 'inherit'],
  })

  let exitCode: number | undefined
  uiServer.once('exit', code => {
    exitCode = code ?? undefined
  })

  const deadline = Date.now() + READY_TIMEOUT_MS
  let ready = false
  while (!ready && exitCode === undefined && Date.now() < deadline) {
    ready = await isAnswering(UI_URL)
    if (!ready) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }

  await stopServer(uiServer, () => exitCode !== undefined)
  await rm(isolated, { recursive: true, force: true })

  if (ready) {
    console.info(`Desktop tests passed: the packaged UI answered on ${UI_URL}.`)
    return true
  }

  console.error(`Desktop tests failed: ${exitCode === undefined
    ? `no response from ${UI_URL} within ${READY_TIMEOUT_MS / 1000}s`
    : `the UI server exited with code ${exitCode}`}`)
  return false
}

/**
 * Start the packaged application, without administrator rights on Windows.
 *
 * @param executable - Packaged executable to launch.
 * @returns The started process, which on Windows is the launcher rather than
 * the application itself.
 */
const spawnApplication = (executable: string): ChildProcess => {
  if (process.platform === 'win32') {
    return spawn(
      'runas',
      [`/trustlevel:${WINDOWS_BASIC_USER_TRUST_LEVEL}`, `${executable} --no-sandbox`],
      { stdio: ['ignore', 'inherit', 'inherit'] },
    )
  }

  // A runner denies the Chromium sandbox helper the privileges it needs.
  return spawn(executable, process.platform === 'linux' ? ['--no-sandbox'] : [], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
}

/**
 * Stop the packaged application and every process it started.
 *
 * @param launcher - Process the launch returned.
 * @param hasExited - Whether that process has already reported its exit.
 * @param executable - Packaged executable, which names the Windows image.
 */
const stopApplication = async (
  launcher: ChildProcess,
  hasExited: () => boolean,
  executable: string,
): Promise<void> => {
  // The launcher has already exited, so the application is only reachable by
  // the name it runs under.
  if (process.platform === 'win32') {
    const taskkill = spawn('taskkill', ['/im', path.basename(executable), '/t', '/f'], {
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    await new Promise<void>(resolve => taskkill.once('close', () => resolve()))
    return
  }

  await stopServer(launcher, hasExited)
}

/**
 * Launch the packaged application and require both managed servers to answer.
 *
 * @param executable - Packaged executable to launch.
 * @returns Whether both servers answered.
 */
const checkPackagedApplication = async (executable: string): Promise<boolean> => {
  console.info(`Launching ${executable}`)

  // The log is appended across launches.
  const priorLog = await readStartupLog()
  const application = spawnApplication(executable)

  // A Windows launch reports the launcher's exit, which happens as soon as it
  // has handed the application its own token, so only a failure to launch says
  // anything about the application.
  const reportsApplicationExit = process.platform !== 'win32'

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

    // Nothing dismisses the modal dialog on a runner, so its own report
    // ends the wait.
    const pendingLog = (await readStartupLog()).slice(priorLog.length)
    failure = pendingLog.split('\n').find(line => line.includes(STARTUP_FAILURE_MARKER))
    if (failure === undefined && exitCode !== undefined && (reportsApplicationExit || exitCode !== 0)) {
      failure = reportsApplicationExit
        ? `the application exited with code ${exitCode}`
        : `the launcher could not start the application, exiting with code ${exitCode}`
    }

    if (failure === undefined) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }

  console.info((await readStartupLog()).slice(priorLog.length) || 'No startup.log was written.')
  await stopApplication(application, () => exitCode !== undefined, executable)

  if (ready) {
    console.info(`Desktop tests passed: ${UI_URL} and ${API_HEALTH_URL} both answered.`)
    return true
  }

  const timedOut = `no response from ${UI_URL} or ${API_HEALTH_URL} within ${READY_TIMEOUT_MS / 1000}s`
  console.error(`Desktop tests failed: ${failure ?? timedOut}`)
  return false
}

const { executable, resourcesPath } = await resolvePackagedApplication(
  path.resolve(import.meta.dirname, '..', 'release'),
)

const passed = process.argv.includes('--ui-only')
  ? await checkPackagedUi(resourcesPath)
  : await checkPackagedApplication(executable)

// Windows faults on a forced exit, so let the runtime unwind its own handles.
if (!passed) {
  process.exitCode = 1
}

import { access, copyFile } from 'node:fs/promises'
import path from 'node:path'

type EnvironmentFile = {
  destination: string
  template: string
}

const environmentFiles: readonly EnvironmentFile[] = [
  { template: 'api/.env.template', destination: 'api/.env' },
  { template: 'ui/.env.template', destination: 'ui/.env' },
]

/**
 * Check whether an environment file already exists.
 *
 * @param filePath - Absolute path to inspect.
 * @returns Whether the file exists.
 */
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Copy a missing environment file from its committed template.
 *
 * @param environmentFile - Template and destination paths.
 */
const ensureEnvironmentFile = async ({ template, destination }: EnvironmentFile): Promise<void> => {
  const destinationPath = path.resolve(destination)
  if (await fileExists(destinationPath)) {
    return
  }

  await copyFile(path.resolve(template), destinationPath)
  console.info(`Created ${destination} from ${template}`)
}

await Promise.all(environmentFiles.map(ensureEnvironmentFile))

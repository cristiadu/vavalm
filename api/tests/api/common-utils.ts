/**
 * Polls a paginated list until the expected entry shows up.
 *
 * The stats leaderboards are cached, so an entity created after the cache was
 * populated stays invisible until that entry expires. Waiting for the entry
 * keeps a test about list contents from doubling as a test of cache timing.
 *
 * @param readList - Reads the current list.
 * @param matches - Identifies the entry being waited for.
 * @param timeoutMs - Maximum time to wait; must exceed the cache ttl.
 * @param pollEveryMs - How often to re-read the list.
 * @returns The matching entry, or undefined if it never appeared.
 */
export const waitForListEntry = async <T>(
  readList: () => Promise<T[]>,
  matches: (entry: T) => boolean,
  timeoutMs: number,
  pollEveryMs: number,
): Promise<T | undefined> => {
  let found: T | undefined

  await waitForCondition(async () => {
    found = (await readList()).find(matches)
    return found !== undefined
  }, timeoutMs, pollEveryMs)

  return found
}

/**
 * Lower bound for asserting on a rate produced by simulation.
 *
 * Match simulation is random, so an observed rate scatters around its true
 * value. A fixed tolerance either fails on ordinary sampling noise or is so
 * wide it stops meaning anything. Three standard errors of the binomial puts
 * the false-failure rate near 0.1% while still catching a real regression in
 * the buff maths.
 *
 * @param expectedRate - The rate the mechanic should produce, 0 to 1.
 * @param sampleSize - How many observations the measured rate is based on.
 * @param minimumTolerance - Floor on the tolerance, for modelling error that
 *                           sampling noise alone does not account for.
 * @returns The lowest rate that should still be considered a pass.
 */
export const rateLowerBound = (expectedRate: number, sampleSize: number, minimumTolerance = 0): number => {
  const variance = Math.max(expectedRate * (1 - expectedRate), 0)
  const standardError = Math.sqrt(variance / Math.max(sampleSize, 1))

  return expectedRate - Math.max(3 * standardError, minimumTolerance)
}

/**
 * Waits until an async condition becomes true or times out.
 *
 * @param condition - Async function that resolves to true when done.
 * @param timeoutMs - Maximum time to wait.
 * @param pollEveryMs - Poll interval in milliseconds.
 * @returns Whether the condition was met before timeout.
 */
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeoutMs: number,
  pollEveryMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, pollEveryMs))
  }

  return false
}

/**
 * Returns whether a date string can be parsed into a valid Date.
 *
 * @param value - Date-like string from API payload.
 * @returns True when value parses to a valid Date.
 */
export const isValidDateString = (value: string): boolean => {
  return !Number.isNaN(new Date(value).getTime())
}

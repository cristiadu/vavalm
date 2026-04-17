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

/**
 * Timeouts for vitest hooks, in milliseconds.
 *
 * Vitest's own hook timeout argument is a bare number, so naming the values
 * here keeps the unit and the intent visible at the call site.
 */
export const HOOK_TIMEOUT_MS = {
  /** Standing up a fixture that simulates a full match end to end. */
  PLAYED_MATCH_FIXTURE: 120_000,
  /** Tearing a fixture back down again. */
  FIXTURE_CLEANUP: 60_000,
}

/**
 * Scales a ratio to a percentage rounded to two decimals — the form the API
 * reports winrates in.
 *
 * @param value - The part, for example matches won.
 * @param total - The whole, for example matches played. Zero yields 0.
 * @returns The percentage, rounded to at most two decimals.
 */
export const formatPercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0
  }

  return parseFloat(((value / total) * 100).toFixed(2))
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

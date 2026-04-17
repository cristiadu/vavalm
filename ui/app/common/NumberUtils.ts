export const getRatio = (part: number, total: number, asPercentage: boolean = false): number => (total > 0 ? (part / total) * (asPercentage ? 100 : 1) : 0)

export const getRatioWithPrecision = (part: number, total: number, precision: number = 2, asPercentage: boolean = false): number => {
  const ratio = getRatio(part, total, asPercentage)
  return Number(ratio.toFixed(precision))
}

/**
 * Calculate player rating (KDA-style) with safe division.
 * Returns the numerator value when deaths is 0.
 * @param kills - Number of kills
 * @param assists - Number of assists
 * @param deaths - Number of deaths
 * @param assistMultiplier - Multiplier for assists (default 0.5)
 * @returns The calculated rating
 */
export const calculatePlayerRating = (kills: number, assists: number, deaths: number, assistMultiplier: number = 0.5): number => {
  const numerator = kills + assists * assistMultiplier
  return deaths > 0 ? numerator / deaths : numerator
}


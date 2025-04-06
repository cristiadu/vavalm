export const getRatio = (part: number, total: number, asPercentage: boolean = false): number => (total > 0 ? (part / total) * (asPercentage ? 100 : 1) : 0)

export const getRatioWithPrecision = (part: number, total: number, precision: number = 2, asPercentage: boolean = false): number => {
  const ratio = getRatio(part, total, asPercentage)
  return Number(ratio.toFixed(precision))
}


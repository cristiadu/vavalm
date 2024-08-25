export const getRatio = (part: number, total: number, asPercentage: boolean = false) => (total > 0 ? (part / total) * (asPercentage ? 100 : 1) : 0)

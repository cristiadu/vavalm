export const getRandomDateThisYear = (): Date => {
  const year = new Date().getFullYear()
  const startOfYear = new Date(year, 0, 1).getTime()
  const endOfYear = new Date(year, 11, 31).getTime()
  const randomTime = Math.random() * (endOfYear - startOfYear) + startOfYear
  return new Date(randomTime)
}

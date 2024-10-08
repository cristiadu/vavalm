
/**
 * Get random date between interval
 * 
 * @param start start date
 * @param end end date
 * @returns random date between interval
 */
export const getRandomDateBetweenInterval = (start: Date, end: Date): Date => {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const randomTime = Math.random() * (endTime - startTime) + startTime
  return new Date(randomTime)
}

/**
 * Get random time between a date and date + hours
 * 
 * @param date date to get random time
 * @param hours hours interval
 * @returns date with random time
 */
export const getRandomTimeBetweenHourInterval = (date: Date, hours: number): Date => {
  return getRandomDateBetweenInterval(date, new Date(date.getTime() + hours * 60 * 60 * 1000))
}


/**
 * Get random time of day
 * 
 * @param date date to get random time
 * @returns date with random time
 */
export const getRandomTimeOnDay = (date: Date): Date => {
  const hours = Math.floor(Math.random() * 24)
  const minutes = Math.floor(Math.random() * 60)
  const seconds = Math.floor(Math.random() * 60)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds)
}

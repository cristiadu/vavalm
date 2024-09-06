import { parentPort, Worker } from 'worker_threads'
import MatchService from '../services/MatchService'
import Match from '../models/Match'

const ONE_MINUTE_IN_MS = 60000
let executing = false

/**
  * Fetches matches that should be played before a given date and marks them as started.
  * 
  * @param before Any matches with a date before this date will be returned.
  * @returns A map containing the matches that should be played.
**/
const fetchMatchesThatShouldBePlayed = async (before: Date) => {
  const matches = await MatchService.getMatchesToBePlayed(before)
  const scheduledMatches = new Map()
  for (const match of matches) {
    match.started = true
    scheduledMatches.set(match.id, match)
    await match.save()
  }
  return scheduledMatches
}

/**
 * Starts a worker thread to play a match.
 * This is done so matches can be played in parallel.
 * 
 * @param matchId The ID of the match to be played.
 * @param match The match to be played.
 * @returns void
 * 
**/
const startMatchExecutionWorker = (matchId: number, match: Match) => {
  console.log(`Starting worker for match ${matchId} with data:`, match)

  const matchData = match.get({ plain: true })

  const worker = new Worker(new URL('./playScheduledMatchWorker.ts', import.meta.url), {
    workerData: { matchToPlay: matchData },
  })

  worker.on('error', (error) => {
    console.error(`Worker error for match ${matchId}:`, error)
  })

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker for match ${matchId} stopped with exit code ${code}`)
    } else {
      match.finished = true
      match.save()
    }
  })
}

/**
 * Starts the scheduler to check for matches that should be played.
 * 
 * @returns void
**/
const startScheduler = async () => {
  setInterval(async () => {
    const now = new Date()
    console.log(`Checking for matches to play at ${now.toISOString()}`)

    if (executing) {
      console.log('Scheduler is already executing')
      return
    }

    executing = true
    for (const [matchId, match] of await fetchMatchesThatShouldBePlayed(now)) {
      if (match.date <= now) {
        startMatchExecutionWorker(matchId, match)
      }
    }
    executing = false
  }, ONE_MINUTE_IN_MS) // Check every minute
}

// Listen for messages from the parent thread to start the scheduler
parentPort!.on('message', (message) => {
  if (message === 'start') {
    startScheduler()
  }
})

import { parentPort, workerData } from 'worker_threads'

import Match from '../models/Match'

import MatchService from '../services/MatchService'

interface WorkerData {
  matchToPlay: Match
}

const { matchToPlay } = workerData as WorkerData

/**
 * Starts the execution of a match.
 * 
 * @returns void
 */
const startMatchExecution = async (): Promise<void> => {
  try {
    console.log(`Received match data in worker:`, matchToPlay)

    if (!matchToPlay || !matchToPlay.date) {
      throw new Error('Invalid match data received')
    }

    console.log(`Playing match ${matchToPlay.id}, scheduled at ${new Date(matchToPlay.date).toISOString()}`)
    await MatchService.playFullMatch(matchToPlay.id)
    console.log(`Match ${matchToPlay.id} has been played`)
  } catch (error) {
    console.error(`Error playing match ${matchToPlay.id}:`, error)
  }
}

// Start the match execution and notify the parent thread when done
startMatchExecution().then(() => {
  parentPort?.postMessage('done')
})

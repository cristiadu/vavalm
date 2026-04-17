import { parentPort, workerData } from 'worker_threads'
import MatchService from '@/services/MatchService'
import { WorkerMessageType, MatchCompletedMessage } from '@/models/SchedulerTypes'

interface WorkerData {
  matchToPlay: { matchId: number }
}

const { matchToPlay } = workerData as WorkerData

/**
 * Executes the match and notifies the parent thread with a MatchCompletedMessage.
 */
const startMatchExecution = async (): Promise<void> => {
  const matchId = matchToPlay?.matchId

  if (!matchId) {
    throw new Error('Could not determine match ID from worker data')
  }

  try {
    console.log(`Playing match ${matchId}`)
    await MatchService.playFullMatch(matchId)
    console.log(`Match ${matchId} completed successfully`)

    const message: MatchCompletedMessage = { type: WorkerMessageType.MATCH_COMPLETED, matchId, success: true }
    parentPort?.postMessage(message)
  } catch (error) {
    console.error(`Error playing match ${matchId}:`, error)

    const message: MatchCompletedMessage = {
      type: WorkerMessageType.MATCH_COMPLETED,
      matchId,
      success: false,
      error: String(error),
    }
    parentPort?.postMessage(message)
  }
}

startMatchExecution()

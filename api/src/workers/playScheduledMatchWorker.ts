import { parentPort, workerData } from 'worker_threads'
import MatchService from '@/services/MatchService'

// Define possible worker data formats to handle various input types
interface WorkerMatchData {
  matchId?: number;
  id?: number;
  dataValues?: {
    id?: number;
  };
}

interface WorkerData {
  matchToPlay: WorkerMatchData;
}

const { matchToPlay } = workerData as WorkerData

// Debug the received match data
console.log('Worker received match data:', JSON.stringify(matchToPlay, null, 2))

/**
 * Reports database errors back to the parent thread
 */
const reportDbError = (error: Error): void => {
  // Check if this is a database-related error
  const errorString = String(error)
  if (
    errorString.includes('database') || 
    errorString.includes('timeout') || 
    errorString.includes('sequelize') ||
    errorString.includes('connection') ||
    errorString.includes('ECONNREFUSED') ||
    errorString.includes('too many clients')
  ) {
    console.error('Database error detected in worker, notifying parent')
    if (parentPort) {
      parentPort.postMessage({
        type: 'db_error',
        error: {
          message: error.message || 'Unknown database error',
          name: error.name || 'Error',
          stack: error.stack,
        },
      })
    }
  }
}

/**
 * Safely gets the match ID from the worker data
 */
const getMatchId = (): number | undefined => {
  if (!matchToPlay) return undefined
  
  // Try to get ID from the minimal object format we're now using
  if (matchToPlay.matchId) return matchToPlay.matchId
  
  // Fallbacks for compatibility with old format
  if (typeof matchToPlay.id !== 'undefined') return matchToPlay.id
  
  // If we still have a nested structure
  if (matchToPlay.dataValues && typeof matchToPlay.dataValues.id !== 'undefined') {
    return matchToPlay.dataValues.id
  }
  
  return undefined
}

/**
 * Starts the execution of a match.
 * 
 * @returns void
 */
const startMatchExecution = async (): Promise<void> => {
  try {
    console.log('Starting match execution with data:', matchToPlay)

    // Get the match ID from the data
    const matchId = getMatchId()
    
    if (!matchId) {
      throw new Error('Could not determine match ID from worker data')
    }

    console.log(`Playing match ${matchId}`)
    // Use the MatchService to execute the match
    await MatchService.playFullMatch(matchId)
    console.log(`Match ${matchId} has been played`)
    
    // Signal success to parent
    if (parentPort) {
      parentPort.postMessage({
        type: 'success',
        matchId,
      })
    }
  } catch (error) {
    // Get match ID safely for error reporting
    const matchId = getMatchId()
    console.error(`Error playing match ${matchId || 'unknown'}:`, error)
    
    // Report database errors for circuit breaker
    reportDbError(error instanceof Error ? error : new Error(String(error)))
    
    // Signal error to parent
    if (parentPort) {
      parentPort.postMessage({
        type: 'error',
        matchId: matchId || 'unknown',
        error: String(error),
      })
    }
  }
}

// Start the match execution and notify the parent thread when done
startMatchExecution()
  .catch(error => {
    // Get match ID safely for error reporting
    const matchId = getMatchId()
    console.error(`Unhandled error in match execution for match ${matchId || 'unknown'}:`, error)
    reportDbError(error instanceof Error ? error : new Error(String(error)))
  })
  .finally(() => {
    // Force exit the worker to ensure no lingering connections
    // This is a sledgehammer approach but guarantees connection release
    const matchId = getMatchId()
    setTimeout(() => {
      console.log(`Worker for match ${matchId || 'unknown'} is shutting down to free connections`)
      if (parentPort) {
        parentPort.postMessage({ type: 'shutdown' })
      } else {
        throw new Error('Worker shutdown: Parent port not available')
      }
    }, 500)
  })

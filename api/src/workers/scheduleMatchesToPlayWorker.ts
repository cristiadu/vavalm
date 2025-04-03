import { parentPort } from 'worker_threads'
import Match from '@/models/Match'
import MatchService from '@/services/MatchService'
import { WorkerMessageType, ErrorReportMessage } from '@/models/SchedulerTypes'
import {
  MAX_CONCURRENT_MATCHES,
  STANDARD_CHECK_INTERVAL,
  REDUCED_CHECK_INTERVAL,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_RESET_TIME,
} from '@/models/constants'

// Worker state tracking
let workerActive = true
let workerPaused = false
let checkInterval: NodeJS.Timeout | null = null
let consecutiveErrors = 0
let circuitBroken = false
let lastCircuitBreak = 0

/**
 * Reports a database error back to the parent thread
 * 
 * @param error The error that occurred
 */
const reportDbError = (error: Error): void => {
  if (parentPort) {
    try {
      const errorMessage: ErrorReportMessage = {
        type: WorkerMessageType.DB_ERROR,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      }
      parentPort.postMessage(errorMessage)
    } catch (e) {
      console.error('Failed to report error to parent:', e)
    }
  }
}

/**
 * Handles database errors and implements circuit breaker pattern
 * 
 * @param error The error that occurred
 */
const handleDbError = (error: Error): void => {
  console.error('Database error in scheduler worker:', error)

  // Track consecutive errors for circuit breaker
  consecutiveErrors++

  // Report error to parent process
  reportDbError(error)

  // Implement circuit breaker pattern
  if (consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBroken = true
    lastCircuitBreak = Date.now()
    console.log(`Circuit breaker tripped after ${consecutiveErrors} consecutive errors. Pausing for ${CIRCUIT_BREAKER_RESET_TIME / 1000} seconds.`)
  }
}

/**
 * Resets the circuit breaker if enough time has passed
 */
const resetCircuitBreakerIfNeeded = (): void => {
  if (circuitBroken && (Date.now() - lastCircuitBreak > CIRCUIT_BREAKER_RESET_TIME)) {
    console.log('Circuit breaker reset. Resuming normal operation.')
    circuitBroken = false
    consecutiveErrors = 0
  }
}

/**
 * Record a successful operation for tracking circuit breaker state
 */
const recordSuccess = (): void => {
  // Reset consecutive errors on success
  if (consecutiveErrors > 0) {
    consecutiveErrors--
  }
}

/**
 * Fetch matches that should be played based on their scheduled time
 */
const fetchMatchesThatShouldBePlayed = async (): Promise<Match[]> => {
  // Skip processing if circuit breaker is active or worker is paused
  if (circuitBroken || workerPaused) {
    return []
  }

  try {
    // Reset circuit breaker if needed
    resetCircuitBreakerIfNeeded()

    const now = new Date()
    // Get matches that should be played using MatchService
    const matchesToPlay = await MatchService.getMatchesToBePlayed(now)

    // Limit to prevent overloading the system
    const limitedMatches = matchesToPlay.slice(0, MAX_CONCURRENT_MATCHES)

    // Record success for circuit breaker
    recordSuccess()

    return limitedMatches as Match[]
  } catch (error) {
    handleDbError(error as Error)
    return []
  }
}

/**
 * Marks a match as started or not started using the MatchService
 * 
 * @param matchId The ID of the match to update
 * @param started Whether the match is started
 */
const updateMatchStatus = async (matchId: number, started: boolean): Promise<void> => {
  try {
    // Use the new MatchService method to update the match status
    const success = await MatchService.updateMatchStatus(matchId, { started })

    if (!success) {
      throw new Error(`Failed to update status for match ${matchId}`)
    }
  } catch (error) {
    console.error(`Error updating status for match ${matchId}:`, error)
    throw error
  }
}

/**
 * Submits a match to be processed by a dedicated worker
 * 
 * @param match The match to be played
 */
const startMatchExecution = async (match: Match): Promise<void> => {
  if (circuitBroken || workerPaused) {
    console.log(`Skipping match ${match.id} due to circuit breaker or pause state`)
    return
  }

  try {
    // Mark match as started (avoiding direct model interaction)
    if (match.id) {
      await updateMatchStatus(match.id, true)
      
      // Request worker creation by sending message to parent thread
      if (parentPort) {
        parentPort.postMessage({
          type: 'create_worker',
          matchId: match.id,
        })
        console.log(`Match ${match.id} requested for processing`)
        // Record success
        recordSuccess()
      } else {
        console.error(`No parent port available to request worker for match ${match.id}`)
        // Revert status since we couldn't request a worker
        await updateMatchStatus(match.id, false)
      }
    }
  } catch (error) {
    console.error(`Error starting match ${match.id}:`, error)
    handleDbError(error as Error)

    // Attempt to revert status if possible
    try {
      if (match.id) {
        await updateMatchStatus(match.id, false)
      }
    } catch (revertError) {
      console.error(`Failed to revert match ${match.id} status:`, revertError)
    }
  }
}

/**
 * Main worker function to check for matches that should be played
 */
const startMatchExecutionWorker = async (): Promise<void> => {
  if (!workerActive) {
    console.log('Worker has been terminated, stopping execution')
    return
  }

  if (workerPaused) {
    console.log('Worker is paused, skipping match checks')
    return
  }

  try {
    console.log('Checking for matches to play...')
    const matchesToPlay = await fetchMatchesThatShouldBePlayed()

    if (matchesToPlay.length > 0) {
      console.log(`Found ${matchesToPlay.length} matches to play`)

      // Process each match sequentially to avoid overwhelming the system
      for (const match of matchesToPlay) {
        if (!workerActive || workerPaused || circuitBroken) {
          break // Stop processing if worker state changed
        }
        await startMatchExecution(match)
        // Small delay between match starts
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } else {
      console.log('No matches to play at this time')
    }

    // Record success
    recordSuccess()
  } catch (error) {
    console.error('Error in match execution worker:', error)
    handleDbError(error as Error)
  }

  // Schedule next check with dynamic interval based on system health
  const checkDelay = circuitBroken || consecutiveErrors > 0
    ? REDUCED_CHECK_INTERVAL
    : STANDARD_CHECK_INTERVAL

  checkInterval = setTimeout(startMatchExecutionWorker, checkDelay)
  console.log(`Next check scheduled in ${checkDelay / 1000} seconds`)
}

// Listen for messages from the main thread
if (parentPort) {
  parentPort.on('message', (message) => {
    if (message === WorkerMessageType.START) {
      console.log('Starting match scheduler worker')
      workerActive = true
      workerPaused = false
      // Start the worker loop
      startMatchExecutionWorker()
    } else if (message === WorkerMessageType.PAUSE) {
      console.log('Pausing match scheduler worker')
      workerPaused = true
      // Clear existing timeout if any
      if (checkInterval) {
        clearTimeout(checkInterval)
        checkInterval = null
      }
    } else if (message === WorkerMessageType.RESUME) {
      console.log('Resuming match scheduler worker')
      workerPaused = false
      // Restart the worker loop if not already running
      if (!checkInterval) {
        startMatchExecutionWorker()
      }
    } else if (message === 'stop') {
      console.log('Stopping match scheduler worker')
      workerActive = false
      workerPaused = false
      // Clear existing timeout if any
      if (checkInterval) {
        clearTimeout(checkInterval)
        checkInterval = null
      }
    }
  })
}

// Handle worker thread termination
process.on('beforeExit', (): void => {
  workerActive = false
  if (checkInterval) {
    clearTimeout(checkInterval)
    checkInterval = null
  }
  console.log('Match scheduler worker is shutting down')
})

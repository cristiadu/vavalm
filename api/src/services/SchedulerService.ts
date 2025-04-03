import { Worker } from 'worker_threads'

// Track active workers to manage resources
let workerPool: Worker[] = []
const MAX_CONCURRENT_WORKERS = 4

// Track scheduler state
let schedulerPaused = false
let schedulerWorker: Worker | null = null

/**
 * Starts the scheduler to check for matches that should be played.
 * Includes proper worker pool management to prevent resource exhaustion.
 * 
 * @returns void
**/
const startScheduler = (): void => {
  // Clean up existing workers on restart
  cleanupWorkers()
  
  const worker = new Worker(new URL('../workers/scheduleMatchesToPlayWorker.ts', import.meta.url))
  schedulerWorker = worker

  worker.on('error', (error) => {
    console.error('Worker error:', error)
    // Remove from worker pool
    workerPool = workerPool.filter(w => w !== worker)
    schedulerWorker = null
  })

  worker.on('exit', (code) => {
    // Remove from worker pool
    workerPool = workerPool.filter(w => w !== worker)
    schedulerWorker = null
    
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`)
      
      // Restart the worker after 5 seconds if it failed
      setTimeout(() => {
        if (workerPool.length < MAX_CONCURRENT_WORKERS && !schedulerPaused) {
          console.log('Restarting scheduler worker...')
          startScheduler()
        }
      }, 5000)
    }
  })

  // Add to worker pool
  workerPool.push(worker)
  
  // Start the scheduler in the worker thread
  worker.postMessage('start')
}

/**
 * Pauses the scheduler to prevent new matches from being processed.
 * Used when the system is under stress or encountering errors.
 * 
 * @returns void
**/
const pauseWorker = (): void => {
  schedulerPaused = true
  
  if (schedulerWorker) {
    try {
      console.log('Pausing scheduler worker to reduce system load')
      schedulerWorker.postMessage('pause')
    } catch (error) {
      console.error('Error pausing scheduler worker:', error)
    }
  }
}

/**
 * Resumes the scheduler to continue processing matches.
 * Used when the system has recovered from stress or errors.
 * 
 * @returns void
**/
const resumeWorker = (): void => {
  schedulerPaused = false
  
  if (schedulerWorker) {
    try {
      console.log('Resuming scheduler worker')
      schedulerWorker.postMessage('resume')
    } catch (error) {
      console.error('Error resuming scheduler worker:', error)
    }
  } else {
    // If worker doesn't exist, restart it
    startScheduler()
  }
}

/**
 * Cleans up all active workers.
 * Used when shutting down or restarting the scheduler.
 * 
 * @returns void
**/
const cleanupWorkers = (): void => {
  workerPool.forEach(worker => {
    try {
      worker.terminate()
    } catch (error) {
      console.error('Error terminating worker:', error)
    }
  })
  workerPool = []
  schedulerWorker = null
}

/**
 * Safely extracts the match ID from potentially inconsistent match data structures
 * 
 * @param matchData - The match data, which might be in different formats
 * @returns The match ID if found, or undefined
 */
const extractMatchId = (matchData: unknown): number | undefined => {
  if (!matchData) return undefined

  // Handle different possible data structures
  if (typeof matchData === 'object' && matchData !== null) {
    const data = matchData as Record<string, unknown>
    
    // If id is directly available
    if (typeof data.id !== 'undefined') return Number(data.id)
    
    // If id is in dataValues property
    if (
      data.dataValues && 
      typeof data.dataValues === 'object' && 
      data.dataValues !== null && 
      typeof (data.dataValues as Record<string, unknown>).id !== 'undefined'
    ) {
      return Number((data.dataValues as Record<string, unknown>).id)
    }
    
    // Try to get it from a Sequelize model's get method
    if (
      data.get && 
      typeof data.get === 'function'
    ) {
      try {
        const plainData = data.get({ plain: true })
        if (
          plainData && 
          typeof plainData === 'object' && 
          plainData !== null && 
          typeof (plainData as Record<string, unknown>).id !== 'undefined'
        ) {
          return Number((plainData as Record<string, unknown>).id)
        }
      } catch (e) {
        console.error('Error extracting ID from match data:', e)
      }
    }
  }
  
  return undefined
}

/**
 * Creates a match execution worker if below the maximum worker limit.
 * Used to limit concurrent match processing.
 * 
 * @param {number} matchId - The match ID to process
 * @param {unknown} matchData - The match data to process
 * @returns {boolean} - Whether the worker was created
**/
const createMatchWorker = async (matchId: number, matchData: unknown): Promise<boolean> => {
  // Check if scheduler is paused or we're at max capacity
  if (schedulerPaused) {
    console.log(`Scheduler paused, delaying match ${matchId} processing`)
    return false
  }
  
  if (workerPool.length >= MAX_CONCURRENT_WORKERS) {
    console.log(`Worker pool at capacity (${MAX_CONCURRENT_WORKERS}), delaying match ${matchId} processing`)
    return false
  }
  
  try {
    // Only send the match ID to the worker - the worker will fetch what it needs from MatchService
    const extractedId = extractMatchId(matchData) || matchId

    // Create a minimal data object
    const workerData = { 
      matchId: extractedId,
    }
    
    console.log(`Creating worker for match ${extractedId}`)
    
    // Create and configure worker
    const worker = new Worker(new URL('../workers/playScheduledMatchWorker.ts', import.meta.url), {
      workerData: { matchToPlay: workerData },
    })
    
    worker.on('error', (error) => {
      console.error(`Worker error for match ${extractedId}:`, error)
      workerPool = workerPool.filter(w => w !== worker)
    })
    
    worker.on('exit', (code) => {
      workerPool = workerPool.filter(w => w !== worker)
      console.log(`Worker for match ${extractedId} completed with code ${code}`)
    })
    
    // Add to pool and return success
    workerPool.push(worker)
    return true
  } catch (error) {
    console.error(`Error creating worker for match ${matchId}:`, error)
    return false
  }
}

/**
 * Gets the current status of the scheduler and worker pool.
 * 
 * @returns {object} - Current worker status
 */
const getWorkerStatus = (): { activeWorkers: number, maxWorkers: number, schedulerActive: boolean, paused: boolean } => {
  return {
    activeWorkers: workerPool.length,
    maxWorkers: MAX_CONCURRENT_WORKERS,
    schedulerActive: schedulerWorker !== null,
    paused: schedulerPaused,
  }
}

// Register process termination handlers
process.on('SIGTERM', cleanupWorkers)
process.on('SIGINT', cleanupWorkers)

export default {
  startScheduler,
  createMatchWorker,
  cleanupWorkers,
  pauseWorker,
  resumeWorker,
  getWorkerStatus
}

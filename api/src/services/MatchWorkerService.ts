import { Worker } from 'worker_threads'
import { WorkerStatus } from '@/models/SchedulerTypes'
import { MAX_CONCURRENT_WORKERS } from '@/models/constants'

// Track active workers to manage resources
let workerPool: Worker[] = []

// Track scheduler state
let schedulerPaused = false

/**
 * Extracts the match ID from potentially inconsistent match data structures
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
 * @param matchId - The match ID to process
 * @param matchData - The match data to process
 * @returns Whether the worker was created
 */
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
    const worker = new Worker(new URL('@/workers/playScheduledMatchWorker.ts', import.meta.url), {
      workerData: { matchToPlay: workerData },
    })
    
    worker.on('error', (error) => {
      console.error(`Worker error for match ${extractedId}:`, error)
      removeWorker(worker)
    })
    
    worker.on('exit', (code) => {
      removeWorker(worker)
      console.log(`Worker for match ${extractedId} completed with code ${code}`)
    })
    
    // Add to pool and return success
    addWorker(worker)
    return true
  } catch (error) {
    console.error(`Error creating worker for match ${matchId}:`, error)
    return false
  }
}

/**
 * Add a worker to the pool
 * 
 * @param worker - The worker to add
 */
const addWorker = (worker: Worker): void => {
  workerPool.push(worker)
}

/**
 * Remove a worker from the pool
 * 
 * @param worker - The worker to remove
 */
const removeWorker = (worker: Worker): void => {
  workerPool = workerPool.filter(w => w !== worker)
}

/**
 * Sets the paused state for the scheduler
 * 
 * @param paused - Whether to pause or resume worker creation
 */
const setPausedState = (paused: boolean): void => {
  schedulerPaused = paused
}

/**
 * Cleans up all match execution workers
 */
const cleanup = (): void => {
  workerPool.forEach(worker => {
    try {
      worker.terminate()
    } catch (error) {
      console.error('Error terminating worker:', error)
    }
  })
  workerPool = []
}

/**
 * Gets the current status of the worker pool
 * 
 * @returns Current worker pool status
 */
const getWorkerPoolStatus = (): Pick<WorkerStatus, 'activeWorkers' | 'maxWorkers' | 'paused'> => {
  return {
    activeWorkers: workerPool.length,
    maxWorkers: MAX_CONCURRENT_WORKERS,
    paused: schedulerPaused,
  }
}

export default {
  createMatchWorker,
  setPausedState,
  cleanup,
  getWorkerPoolStatus,
  addWorker,
  removeWorker,
} 
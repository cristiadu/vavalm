import { Worker } from 'worker_threads'

// Track active workers to manage resources
let workerPool: Worker[] = []
const MAX_CONCURRENT_WORKERS = 4

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

  worker.on('error', (error) => {
    console.error('Worker error:', error)
    // Remove from worker pool
    workerPool = workerPool.filter(w => w !== worker)
  })

  worker.on('exit', (code) => {
    // Remove from worker pool
    workerPool = workerPool.filter(w => w !== worker)
    
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`)
      
      // Restart the worker after 5 seconds if it failed
      setTimeout(() => {
        if (workerPool.length < MAX_CONCURRENT_WORKERS) {
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
}

/**
 * Creates a match execution worker if below the maximum worker limit.
 * Used to limit concurrent match processing.
 * 
 * @param {number} matchId - The match ID to process
 * @param {any} matchData - The match data to process
 * @returns {boolean} - Whether the worker was created
**/
const createMatchWorker = (matchId: number, matchData: any): boolean => {
  // Check if we're at max capacity
  if (workerPool.length >= MAX_CONCURRENT_WORKERS) {
    console.log(`Worker pool at capacity (${MAX_CONCURRENT_WORKERS}), delaying match ${matchId} processing`)
    return false
  }
  
  // Create and configure worker
  const worker = new Worker(new URL('../workers/playScheduledMatchWorker.ts', import.meta.url), {
    workerData: { matchToPlay: matchData },
  })
  
  worker.on('error', (error) => {
    console.error(`Worker error for match ${matchId}:`, error)
    workerPool = workerPool.filter(w => w !== worker)
  })
  
  worker.on('exit', (code) => {
    workerPool = workerPool.filter(w => w !== worker)
    console.log(`Worker for match ${matchId} completed with code ${code}`)
  })
  
  // Add to pool and return success
  workerPool.push(worker)
  return true
}

// Register process termination handlers
process.on('SIGTERM', cleanupWorkers)
process.on('SIGINT', cleanupWorkers)

export default {
  startScheduler,
  createMatchWorker,
  cleanupWorkers,
  getWorkerPoolStats: () => ({ activeWorkers: workerPool.length, maxWorkers: MAX_CONCURRENT_WORKERS }),
}

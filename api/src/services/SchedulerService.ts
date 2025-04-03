import { Worker } from 'worker_threads'
import MatchWorkerService from '@/services/MatchWorkerService'
import { WorkerStatus, WorkerMessageType } from '@/models/SchedulerTypes'

// Track scheduler state
let schedulerWorker: Worker | null = null
let schedulerPaused = false

/**
 * Starts the scheduler to check for matches that should be played.
 */
const startScheduler = (): void => {
  // Clean up existing workers on restart
  cleanupWorkers()
  
  const worker = new Worker(new URL('@/workers/scheduleMatchesToPlayWorker.ts', import.meta.url))
  schedulerWorker = worker

  worker.on('error', (error) => {
    console.error('Worker error:', error)
    schedulerWorker = null
  })

  worker.on('exit', (code) => {
    schedulerWorker = null
    
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`)
      
      // Restart the worker after 5 seconds if it failed
      setTimeout(() => {
        if (!schedulerPaused) {
          console.log('Restarting scheduler worker...')
          startScheduler()
        }
      }, 5000)
    }
  })
  
  // Handle messages from the worker
  worker.on('message', (message) => {
    // Handle worker creation request
    if (message && typeof message === 'object' && 'type' in message) {
      if (message.type === 'create_worker' && 'matchId' in message) {
        const matchId = message.matchId as number
        console.log(`Received request to create worker for match ${matchId}`)
        MatchWorkerService.createMatchWorker(matchId, { id: matchId })
          .then(success => {
            if (!success) {
              console.log(`Failed to create worker for match ${matchId}, notifying worker`)
              // Notify worker of failure if needed
            }
          })
          .catch(error => {
            console.error(`Error creating worker for match ${matchId}:`, error)
          })
      }
    }
  })
  
  // Start the scheduler in the worker thread
  worker.postMessage(WorkerMessageType.START)
}

/**
 * Pauses the scheduler to prevent new matches from being processed.
 * Used when the system is under stress or encountering errors.
 */
const pauseWorker = (): void => {
  schedulerPaused = true
  MatchWorkerService.setPausedState(true)
  
  if (schedulerWorker) {
    try {
      console.log('Pausing scheduler worker to reduce system load')
      schedulerWorker.postMessage(WorkerMessageType.PAUSE)
    } catch (error) {
      console.error('Error pausing scheduler worker:', error)
    }
  }
}

/**
 * Resumes the scheduler to continue processing matches.
 * Used when the system has recovered from stress or errors.
 */
const resumeWorker = (): void => {
  schedulerPaused = false
  MatchWorkerService.setPausedState(false)
  
  if (schedulerWorker) {
    try {
      console.log('Resuming scheduler worker')
      schedulerWorker.postMessage(WorkerMessageType.RESUME)
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
 */
const cleanupWorkers = (): void => {
  // Clean up scheduler worker
  if (schedulerWorker) {
    try {
      schedulerWorker.terminate()
    } catch (error) {
      console.error('Error terminating scheduler worker:', error)
    }
    schedulerWorker = null
  }
  
  // Clean up match workers
  MatchWorkerService.cleanup()
}

/**
 * Gets the current status of the scheduler and worker pool.
 * 
 * @returns Current worker status
 */
const getWorkerStatus = (): WorkerStatus => {
  const poolStatus = MatchWorkerService.getWorkerPoolStatus()
  
  return {
    ...poolStatus,
    schedulerActive: schedulerWorker !== null,
  }
}

// Register process termination handlers
process.on('SIGTERM', cleanupWorkers)
process.on('SIGINT', cleanupWorkers)

export default {
  startScheduler,
  createMatchWorker: MatchWorkerService.createMatchWorker,
  cleanupWorkers,
  pauseWorker,
  resumeWorker,
  getWorkerStatus,
}

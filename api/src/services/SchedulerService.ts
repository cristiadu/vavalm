import { Worker } from 'worker_threads'

/**
 * Starts the scheduler to check for matches that should be played.
 * 
 * @returns void
**/
const startScheduler = (): void => {
  const worker = new Worker(new URL('../workers/scheduleMatchesToPlayWorker.ts', import.meta.url))

  worker.on('error', (error) => {
    console.error('Worker error:', error)
  })

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`)
    }
  })

  // Start the scheduler in the worker thread
  worker.postMessage('start')
}

export default {
  startScheduler,
}

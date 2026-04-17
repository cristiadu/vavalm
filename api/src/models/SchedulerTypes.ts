/**
 * Interface for worker status
 */
export interface WorkerStatus {
  activeWorkers: number
  maxWorkers: number
  schedulerActive: boolean
  paused: boolean
}

/**
 * Interface for match worker data
 */
export interface MatchWorkerData {
  matchId: number
}

/**
 * Worker message types
 */
export enum WorkerMessageType {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  MATCH_COMPLETED = 'match_completed'
}

/**
 * Match completed message interface — sent from playScheduledMatchWorker to MatchWorkerService
 */
export interface MatchCompletedMessage {
  type: WorkerMessageType.MATCH_COMPLETED
  matchId: number
  success: boolean
  error?: string
}

/**
 * Union type for all worker messages
 */
export type WorkerMessage =
  | WorkerMessageType.START
  | WorkerMessageType.PAUSE
  | WorkerMessageType.RESUME
  | MatchCompletedMessage

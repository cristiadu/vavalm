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
  DB_ERROR = 'db_error',
  MATCH_COMPLETED = 'match_completed'
}

/**
 * Error report message interface
 */
export interface ErrorReportMessage {
  type: WorkerMessageType.DB_ERROR
  error: {
    message: string
    name: string
    stack?: string
  }
}

/**
 * Match completed message interface
 */
export interface MatchCompletedMessage {
  type: WorkerMessageType.MATCH_COMPLETED
  matchId: number
  success: boolean
}

/**
 * Union type for all worker messages
 */
export type WorkerMessage = 
  | WorkerMessageType.START
  | WorkerMessageType.PAUSE
  | WorkerMessageType.RESUME
  | ErrorReportMessage
  | MatchCompletedMessage 
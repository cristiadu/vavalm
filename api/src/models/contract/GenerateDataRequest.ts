/** Options for creating a batch of teams, players, and optional tournaments. */
export interface GenerateDataRequest {
  /**
   * @isInt
   * @minimum 2
   * @maximum 32
   */
  teamCount: number
  /**
   * @isInt
   * @minimum 0
   * @maximum 10
   */
  tournamentCount: number
  /** Start of every tournament in the batch, as an ISO date-time. */
  start_date?: string
  /** End of every tournament in the batch, as an ISO date-time. */
  end_date?: string
}

/** Identifiers of every record created by a generation request. */
export interface GenerateDataResult {
  teamIds: number[]
  playerIds: number[]
  tournamentIds: number[]
}

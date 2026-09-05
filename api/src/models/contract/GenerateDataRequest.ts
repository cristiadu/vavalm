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
}

/** Identifiers of every record created by a generation request. */
export interface GenerateDataResult {
  teamIds: number[]
  playerIds: number[]
  tournamentIds: number[]
}

/**
 * Possible health status values
 */
export enum HealthStatus {
  OK = 'OK',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE'
}

/**
 * Available health indicators
 */
export enum HealthIndicator {
  DATABASE = 'database',
  // Add more indicators here as needed
}

/**
 * @tsoaModel
 */
export class HealthApiModel {
  constructor(
    public status: HealthStatus,
    public indicators: HealthIndicatorApiModel[],
  ) { }
}

export class HealthIndicatorApiModel {
  constructor(
    public name: HealthIndicator,
    public status: HealthStatus,
    public details?: Record<string, string>,
  ) { }
}
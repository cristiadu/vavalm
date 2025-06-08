import { HealthApiModel, HealthIndicator, HealthIndicatorApiModel, HealthStatus } from '@/models/contract/HealthApiModel'
import db from '@/models/db'
import { Controller, Get, NoSecurity, OperationId, Route } from '@tsoa/runtime'

/**
 * Health controller to check API status
 */
@Route('health')
@NoSecurity()
export class HealthController extends Controller {
  /**
   * Registry of health indicator functions
   */
  private readonly healthIndicators: Record<HealthIndicator, () => Promise<HealthIndicatorApiModel>> = {
    [HealthIndicator.DATABASE]: this.databaseHealthIndicator.bind(this),
    // Add more indicators here as needed
  }

  /**
   * Get API health status
   * @returns Health status
   */
  @Get('/')
  @OperationId("getHealth")
  public async getHealth(): Promise<HealthApiModel> {
    const indicators: HealthIndicatorApiModel[] = []
    
    // Run all health indicators
    for (const indicatorFn of Object.values(this.healthIndicators)) {
      indicators.push(await indicatorFn())
    }
    
    // Determine overall status based on indicators
    let overallStatus = HealthStatus.OK
    
    for (const indicator of indicators) {
      if (indicator.status === HealthStatus.OFFLINE) {
        overallStatus = HealthStatus.OFFLINE
        break
      } else if (indicator.status === HealthStatus.DEGRADED) {
        overallStatus = HealthStatus.DEGRADED
      }
    }
    
    return new HealthApiModel(overallStatus, indicators)
  }

  private async databaseHealthIndicator(): Promise<HealthIndicatorApiModel> {
    try {
      await db.sequelize.authenticate()
      return new HealthIndicatorApiModel(HealthIndicator.DATABASE, HealthStatus.OK)
    } catch (error) {
      return new HealthIndicatorApiModel(HealthIndicator.DATABASE, HealthStatus.DEGRADED, {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
} 
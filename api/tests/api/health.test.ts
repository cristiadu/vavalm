import { HealthApiModel, HealthStatus } from '@tests/generated/api'
import { apiClient } from '@tests/setup'
import { describe, expect, it } from 'vitest'

describe('Health', () => {
  it('should return 200', async () => {
    const response = await apiClient.default.getHealth() as HealthApiModel
    expect(response.status).toBe(HealthStatus.OK)
  })
})
import { apiClient } from './client'
import { HealthResponse } from '@/types/common.types'
import { HealthResponseSchema } from './contracts'

export async function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/health', {
    method: 'GET',
    contract: HealthResponseSchema,
  })
}

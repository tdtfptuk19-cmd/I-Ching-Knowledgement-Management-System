import { apiClient } from './client'
import { HexagramDetailResponse } from '@/types/hexagram.types'
import { UserLevel } from '@/types/divination.types'
import { HexagramDetailResponseSchema } from './contracts'

/**
 * Tra cứu chi tiết một quẻ kép (1..64) theo cấp độ người dùng
 * Endpoint: GET /api/v1/hexagram/{id}
 */
export async function getHexagramDetail(
  id: number,
  userLevel?: UserLevel
): Promise<HexagramDetailResponse> {
  const params = new URLSearchParams()
  if (userLevel) {
    params.set('user_level', userLevel)
  }
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  return apiClient<HexagramDetailResponse>(`/hexagram/${id}${queryStr}`, {
    contract: HexagramDetailResponseSchema,
  })
}

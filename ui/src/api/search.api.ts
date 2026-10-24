import { apiClient } from './client'
import { SearchResponse } from '@/types/hexagram.types'
import { UserLevel } from '@/types/divination.types'
import { SearchResponseSchema } from './contracts'

export interface SearchQueryParams {
  q?: string
  topic?: string
  upper_trigram?: string
  lower_trigram?: string
  user_level?: UserLevel
  page?: number
  page_size?: number
}

/**
 * Tìm kiếm toàn văn thông minh và lọc tri thức Kinh Dịch đa chiều
 * Endpoint: GET /api/v1/search
 */
export async function searchKnowledge(
  params: SearchQueryParams = {}
): Promise<SearchResponse> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.set('q', params.q)
  if (params.topic) searchParams.set('topic', params.topic)
  if (params.upper_trigram) searchParams.set('upper_trigram', params.upper_trigram)
  if (params.lower_trigram) searchParams.set('lower_trigram', params.lower_trigram)
  if (params.user_level) searchParams.set('user_level', params.user_level)
  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.page_size !== undefined) searchParams.set('page_size', String(params.page_size))

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return apiClient<SearchResponse>(`/search${queryStr}`, {
    contract: SearchResponseSchema,
  })
}

import { apiClient } from './client'
import {
  DivinationRequest,
  DivinationResponse,
  LunarConvertResponse,
  RatHourRule,
} from '@/types/divination.types'
import { DivinationResponseSchema, LunarConvertResponseSchema } from './contracts'

export async function postDivination(req: DivinationRequest): Promise<DivinationResponse> {
  return apiClient<DivinationResponse>('/divination', {
    method: 'POST',
    body: JSON.stringify(req),
    contract: DivinationResponseSchema,
  })
}

export async function getLunarConvert(
  solarDate: string,
  ratHourRule: RatHourRule = 'NEXT_DAY',
): Promise<LunarConvertResponse> {
  const params = new URLSearchParams({
    solar_date: solarDate,
    rat_hour_rule: ratHourRule,
  })
  return apiClient<LunarConvertResponse>(`/lunar/convert?${params.toString()}`, {
    method: 'GET',
    contract: LunarConvertResponseSchema,
  })
}

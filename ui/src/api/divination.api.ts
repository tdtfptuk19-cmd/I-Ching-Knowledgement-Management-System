import { apiClient } from './client'
import {
  DivinationRequest,
  DivinationResponse,
  LunarConvertResponse,
  RatHourRule,
  InterpretRequest,
  InterpretResponse,
  AIAdviceRequest,
  AIAdviceResponse,
} from '@/types/divination.types'
import { SubmissionResponse } from '@/types/governance.types'
import {
  DivinationResponseSchema,
  LunarConvertResponseSchema,
  InterpretResponseSchema,
  AIAdviceResponseSchema,
  SubmissionResponseSchema,
} from './contracts'

export async function postDivination(req: DivinationRequest): Promise<DivinationResponse> {
  return apiClient<DivinationResponse>('/divination', {
    method: 'POST',
    body: JSON.stringify(req),
    contract: DivinationResponseSchema,
    timeout: 90000,
  })
}

export async function postInterpret(
  req: InterpretRequest,
  signal?: AbortSignal
): Promise<InterpretResponse> {
  return apiClient<InterpretResponse>('/divination/interpret', {
    method: 'POST',
    body: JSON.stringify(req),
    contract: InterpretResponseSchema,
    timeout: 90000,
    signal,
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

export async function postAIAdvice(
  caseId: string,
  req: AIAdviceRequest,
  signal?: AbortSignal,
): Promise<AIAdviceResponse> {
  return apiClient<AIAdviceResponse>(`/divination/${caseId}/ai-advice`, {
    method: 'POST',
    body: JSON.stringify(req),
    contract: AIAdviceResponseSchema,
    timeout: 90000,
    signal,
  })
}

export async function saveAIAdviceDraft(
  caseId: string,
  adviceId: string,
): Promise<SubmissionResponse> {
  return apiClient<SubmissionResponse>(`/divination/${caseId}/ai-advice/save`, {
    method: 'POST',
    body: JSON.stringify({ advice_id: adviceId }),
    contract: SubmissionResponseSchema,
    timeout: 30000,
  })
}


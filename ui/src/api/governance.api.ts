import { apiClient } from './client'
import {
  InterpretationSubmissionRequest,
  SubmissionResponse,
  ReviewRequest,
  ReviewResponse,
  FeedbackRequest,
  FeedbackResponse,
  ReviewQueueItem,
  GovernanceStats,
  DoubleLoopLearnRequest,
  DoubleLoopLearnResponse,
} from '@/types/governance.types'
import {
  SubmissionResponseSchema,
  ReviewQueueResponseSchema,
  ReviewResponseSchema,
  FeedbackResponseSchema,
  GovernanceStatsSchema,
} from './contracts'

/**
 * 6. POST /interpretations - Đóng góp diễn giải tri thức mới
 */
export async function submitInterpretation(
  payload: InterpretationSubmissionRequest
): Promise<SubmissionResponse> {
  return apiClient<SubmissionResponse>('/interpretations', {
    method: 'POST',
    body: JSON.stringify(payload),
    contract: SubmissionResponseSchema,
  })
}

/**
 * 7. GET /review/queue - Lấy hàng đợi kiểm duyệt tri thức
 */
export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  return apiClient<ReviewQueueItem[]>('/review/queue', {
    method: 'GET',
    contract: ReviewQueueResponseSchema,
  })
}

/**
 * 8. PUT /interpretations/{id}/review - Phê duyệt hoặc Từ chối diễn giải
 */
export async function reviewInterpretation(
  id: number,
  payload: ReviewRequest
): Promise<ReviewResponse> {
  return apiClient<ReviewResponse>(`/interpretations/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    contract: ReviewResponseSchema,
  })
}

/**
 * 9. PUT /divination/{case_id}/feedback - Gửi phản hồi thực chứng (Double-loop learning)
 */
export async function submitDivinationFeedback(
  caseId: string,
  payload: FeedbackRequest
): Promise<FeedbackResponse> {
  return apiClient<FeedbackResponse>(`/divination/${caseId}/feedback`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    contract: FeedbackResponseSchema,
  })
}

/**
 * 10. GET /governance/stats - Báo cáo thống kê quản trị tri thức KMS
 */
export async function getGovernanceStats(): Promise<GovernanceStats> {
  return apiClient<GovernanceStats>('/governance/stats', {
    method: 'GET',
    contract: GovernanceStatsSchema,
  })
}

/**
 * 11. POST /governance/double-loop-learn - Kích hoạt chu kỳ học tập đôi KMS301
 */
export async function triggerDoubleLoopLearning(
  payload: DoubleLoopLearnRequest = { learning_rate: 0.05, dry_run: false }
): Promise<DoubleLoopLearnResponse> {
  return apiClient<DoubleLoopLearnResponse>('/governance/double-loop-learn', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

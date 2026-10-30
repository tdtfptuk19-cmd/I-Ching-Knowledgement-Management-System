export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AuthorType = 'CLASSIC' | 'EXPERT' | 'AI_DRAFT'
export type TargetType = 'HEXAGRAM' | 'LINE' | 'TRANSFORMATION'

export interface InterpretationSubmissionRequest {
  target_type: TargetType
  hexagram_id: number
  line_position?: number | null
  moving_line_position?: number | null
  to_hexagram_id?: number | null
  topic: string
  summary: string
  guidance: string
  polarity: number
  source_id: number
  author_type: AuthorType
  author_name?: string
}

export interface SubmissionResponse {
  interpretation_id: number
  review_status: ReviewStatus
  message: string
}

export interface ReviewRequest {
  reviewer: string
  new_status: 'APPROVED' | 'REJECTED'
  comment?: string | null
}

export interface ReviewResponse {
  interpretation_id: number
  review_status: string
  reviewed_by: string
  message: string
}

export interface FeedbackRequest {
  verified_outcome: string
  is_reviewed_for_best_practice: boolean
}

export interface FeedbackResponse {
  case_id: string
  verified_outcome: string
  is_reviewed_for_best_practice: boolean
  message: string
}

export interface ReviewQueueItem {
  interpretation_id: number
  target_type: TargetType
  hexagram_id: number
  hexagram_name?: string
  line_position: number | null
  moving_line_position: number | null
  to_hexagram_id: number | null
  topic: string
  summary: string
  guidance: string
  polarity: number
  source_id: number
  author_type: AuthorType
  review_status: ReviewStatus
  created_at: string
}

export interface GovernanceStats {
  classic_texts_coverage: {
    total_rows_db: number
    benchmark_target: number
    special_lines_extra: number
    null_han_count: number
    is_100_percent_approved: boolean
  }
  review_queue: {
    pending_count: number
    approved_count: number
    rejected_count: number
  }
  sources_breakdown: {
    total_sources: number
    by_kind: Record<string, number>
  }
  double_loop_learning: {
    total_cases: number
    cases_with_feedback: number
    best_practice_cases: number
    review_needed_rules: Array<{ rule_id: number; rule_code: string; failure_rate: number }>
  }
  inference_rules?: {
    total_count: number
    approved_count: number
    pending_count: number
    rejected_count: number
  }
  knowledge_kpi?: {
    total_cases: number
    cases_with_interp: number
    interp_rate: number
    cases_with_fallback: number
    fallback_rate: number
    covered_hexagram_ids?: number[]
  }
}

export interface DoubleLoopLearnRequest {
  learning_rate?: number
  dry_run?: boolean
}

export interface RuleWeightUpdateDetail {
  rule_id: number
  rule_code: string
  old_weight: number
  new_weight: number
  delta: number
  matched_cases_count: number
}

export interface DoubleLoopLearnResponse {
  best_practices_analyzed: number
  rules_evaluated: number
  rules_updated: RuleWeightUpdateDetail[]
  dry_run: boolean
  generated_candidate_interpretations: number
  message: string
}


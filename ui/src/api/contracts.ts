import { z } from 'zod'
import {
  DivinationResponse,
  LunarConvertResponse,
  InterpretResponse,
  ValidationCheck,
  AIAdviceResponse,
  AIAdviceProvenance,
} from '@/types/divination.types'
import {
  HexagramDetailResponse,
  SearchResponse,
} from '@/types/hexagram.types'
import {
  GovernanceStats,
  ReviewQueueItem,
  SubmissionResponse,
  ReviewResponse,
  FeedbackResponse,
} from '@/types/governance.types'
import { HealthResponse } from '@/types/common.types'

/**
 * Hợp đồng dữ liệu (Typed Contracts) định nghĩa bằng Zod.
 * Được thực thi tại ranh giới phản hồi API (API Response Boundary)
 * nhằm bảo đảm tính toàn vẹn cấu trúc dữ liệu theo nguyên tắc phòng vệ (Defensive Programming).
 */

// 1. Health Contract
export const HealthResponseSchema: z.ZodType<HealthResponse> = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
  database: z.string(),
})

// 2. Lunar Convert Contract
export const LunarConvertResponseSchema: z.ZodType<LunarConvertResponse> = z.object({
  solar_date: z.string(),
  lunar_day: z.number(),
  lunar_month: z.number(),
  lunar_year: z.number(),
  is_leap_month: z.boolean(),
  can_chi_year: z.string(),
  can_chi_month: z.string(),
  can_chi_day: z.string(),
  can_chi_hour: z.string(),
  solar_term: z.string(),
  rat_hour_rule: z.enum(['NEXT_DAY', 'SAME_DAY']),
  is_da_ty: z.boolean(),
  year_branch_num: z.number(),
  year_branch_name: z.string(),
  hour_branch_num: z.number(),
  hour_branch_name: z.string(),
  assumption_note: z.string().nullable(),
})

// 3. Trigram & Hexagram Info Schemas
export const TrigramInfoSchema = z.object({
  id: z.number(),
  name_vn: z.string(),
  name_han: z.string(),
  binary_code: z.string(),
  five_element: z.string(),
  nature_symbol: z.string(),
})

export const HexagramInfoSchema = z.object({
  hexagram_id: z.number(),
  name_vn: z.string(),
  name_han: z.string(),
  binary_code: z.string(),
  upper_trigram: TrigramInfoSchema,
  lower_trigram: TrigramInfoSchema,
})

// 4. Divination Response Contract
export const FiveElementRelationAnalysisSchema = z.object({
  pair: z.string(),
  primary_element: z.string(),
  target_element: z.string(),
  relation_type: z.string(),
  polarity_weight: z.number(),
  interpretation: z.string(),
  source_id: z.number(),
})

export const RuleFiredInfoSchema = z.object({
  rule_id: z.number(),
  rule_code: z.string(),
  priority: z.number(),
  conclusion: z.string(),
  condition_description: z.string().optional(),
  trace: z.record(z.unknown()),
})

export const AdviceBlockSchema = z.object({
  title: z.string(),
  content: z.string(),
  provenance: z
    .object({
      source_id: z.number().optional(),
      rule_ref: z.string().optional(),
      note: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
})

export const SynthesisResultSchema = z.object({
  score: z.number(),
  normalized_score: z.number(),
  polarity_label: z.string(),
  primary_conclusion: z.string(),
  advice_blocks: z.array(AdviceBlockSchema),
  decomposition: z.object({
    element_score: z.number(),
    rule_score: z.number(),
    interpretation_score: z.number(),
  }),
})

export const ClassicTextItemSchema = z.object({
  text_id: z.number(),
  hexagram_id: z.number(),
  hexagram_name: z.string().optional(),
  line_position: z.number().nullable(),
  text_type: z.string(),
  text_han: z.string().nullable(),
  text_vn: z.string(),
  source_id: z.number(),
  source_title: z.string().optional(),
  source_author: z.string().optional(),
  confidence: z.string().nullable().optional(),
  source_ref: z.string().nullable().optional(),
  issues: z.string().nullable().optional(),
  verified_by: z.string().nullable().optional(),
  verified_at: z.string().nullable().optional(),
})

export const InterpretationItemSchema = z.object({
  interpretation_id: z.number(),
  hexagram_id: z.number(),
  target_type: z.enum(['HEXAGRAM', 'LINE', 'TRANSFORMATION']).optional(),
  line_position: z.number().nullable().optional(),
  moving_line_position: z.number().nullable().optional(),
  to_hexagram_id: z.number().nullable().optional(),
  topic: z.string(),
  summary: z.string(),
  guidance: z.string(),
  polarity: z.number(),
  source_id: z.number(),
  author_type: z.string(),
  source_title: z.string().optional(),
  version: z.number().optional(),
  review_status: z.enum(['APPROVED', 'PENDING', 'REJECTED']).optional(),
})

export const CoverageInfoSchema = z.object({
  is_complete: z.boolean(),
  classic_texts_count: z.number(),
  has_custom_topic_interpretation: z.boolean(),
  fallback_applied: z.boolean(),
  message: z.string(),
})

export const LunarMetaSchema = z.object({
  solar_datetime: z.string(),
  calculated_solar_date: z.string(),
  rat_hour_rule: z.string(),
  is_da_ty: z.boolean(),
  lunar_day: z.number(),
  lunar_month: z.number(),
  lunar_year: z.number(),
  is_leap_month: z.boolean(),
  year_branch_num: z.number(),
  year_branch_name: z.string(),
  can_chi_year: z.string(),
  hour_branch_num: z.number(),
  hour_branch_name: z.string(),
  assumption_note: z.string().nullable(),
})

export const RawNumbersSchema = z.object({
  number_upper: z.number(),
  number_lower: z.number(),
})

export const CastingMetaSchema = z.object({
  casting_method: z.enum(['MAI_HOA_TIME', 'MAI_HOA_NUMBER']),
  user_level: z.enum(['NOVICE', 'PRACTITIONER', 'EXPERT']),
  pseudonymized_user_hash: z.string(),
  lunar_meta: LunarMetaSchema.nullable().optional(),
  raw_numbers: RawNumbersSchema.nullable().optional(),
})

export const DivinationResponseSchema: z.ZodType<DivinationResponse> = z.object({
  case_id: z.string(),
  disclaimer: z.string(),
  casting_meta: CastingMetaSchema,
  initial_hexagram: HexagramInfoSchema,
  transformed_hexagram: HexagramInfoSchema,
  nuclear_hexagram: HexagramInfoSchema,
  moving_line: z.number(),
  dung_side: z.string(),
  the_element: z.string(),
  dung_element: z.string(),
  five_element_analysis: z.array(FiveElementRelationAnalysisSchema),
  rules_fired: z.array(RuleFiredInfoSchema),
  classic_texts: z.array(ClassicTextItemSchema),
  interpretations: z.array(InterpretationItemSchema),
  synthesis: SynthesisResultSchema,
  coverage: CoverageInfoSchema,
})

// 4b. Interpret Response Contract (Trợ Lý Dịch Sư — R4)
export const ValidationCheckSchema: z.ZodType<ValidationCheck> = z.object({
  rule_id: z.string().nullish(),
  description: z.string(),
  passed: z.boolean(),
  details: z.unknown().nullish(),
})

export const InterpretResponseSchema: z.ZodType<InterpretResponse> = z.object({
  markdown_text: z.string(),
  citations: z.array(z.string()),
  is_fallback: z.boolean(),
  validation_report: z.object({
    passed: z.boolean(),
    checks: z.array(ValidationCheckSchema),
  }),
  disclaimer: z.string(),
  prompt_version: z.string(),
  model: z.string(),
  attempts: z.number(),
})

// 4c. AI Advice Response Contract (PA2' + Save Draft)
export const AIAdviceProvenanceSchema: z.ZodType<AIAdviceProvenance> = z.object({
  source: z.string(),
  author_type: z.string(),
  review_status: z.string(),
  model: z.string(),
  prompt_version: z.string(),
})

export const AIAdviceResponseSchema: z.ZodType<AIAdviceResponse> = z.object({
  advice_id: z.string(),
  title: z.string(),
  content: z.string(),
  citations: z.array(z.string()),
  is_fallback: z.boolean(),
  validation_report: z.object({
    passed: z.boolean(),
    checks: z.array(ValidationCheckSchema),
  }),
  provenance: AIAdviceProvenanceSchema,
  disclaimer: z.string(),
  draft_payload: z.record(z.unknown()),
})

// 5. Hexagram Detail Contract
export const HexagramDetailResponseSchema: z.ZodType<HexagramDetailResponse> = z.object({
  hexagram_id: z.number(),
  name_vn: z.string(),
  name_han: z.string().nullable().optional(),
  name_source: z.string().nullable().optional(),
  binary_code: z.string(),
  upper_trigram: TrigramInfoSchema,
  lower_trigram: TrigramInfoSchema,
  user_level: z.enum(['NOVICE', 'PRACTITIONER', 'EXPERT']),
  classic_texts: z.array(ClassicTextItemSchema),
  interpretations_by_topic: z.record(
    z.array(
      z.object({
        interpretation_id: z.number(),
        topic: z.string(),
        summary: z.string(),
        guidance: z.string(),
        polarity: z.number(),
        author_type: z.string(),
        source_title: z.string().optional(),
        version: z.number().optional(),
        review_status: z.enum(['APPROVED', 'PENDING', 'REJECTED']).optional(),
      })
    )
  ),
})

// 6. Search Contract
export const SearchResultItemSchema = z.object({
  item_type: z.enum(['CLASSIC_TEXT', 'INTERPRETATION']),
  hexagram_id: z.number(),
  hexagram_name: z.string(),
  title: z.string(),
  content: z.string(),
  content_han: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  text_type: z.string().nullable().optional(),
  line_position: z.number().nullable().optional(),
  polarity: z.number().nullable().optional(),
  source_id: z.number(),
  provenance: z
    .object({
      confidence: z.string().nullable().optional(),
      source_ref: z.string().nullable().optional(),
      issues: z.string().nullable().optional(),
    })
    .catchall(z.unknown())
    .nullable()
    .optional(),
})

export const SearchResponseSchema: z.ZodType<SearchResponse> = z.object({
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  query: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  items: z.array(SearchResultItemSchema),
})

// 7. Governance Contracts
export const ReviewQueueItemSchema: z.ZodType<ReviewQueueItem> = z.object({
  interpretation_id: z.number(),
  target_type: z.enum(['HEXAGRAM', 'LINE', 'TRANSFORMATION']),
  hexagram_id: z.number(),
  hexagram_name: z.string().optional(),
  line_position: z.number().nullable(),
  moving_line_position: z.number().nullable(),
  to_hexagram_id: z.number().nullable(),
  topic: z.string(),
  summary: z.string(),
  guidance: z.string(),
  polarity: z.number(),
  source_id: z.number(),
  author_type: z.enum(['CLASSIC', 'EXPERT', 'AI_DRAFT']),
  review_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  created_at: z.string(),
})

export const ReviewQueueResponseSchema: z.ZodType<ReviewQueueItem[]> = z.array(ReviewQueueItemSchema)

export const SubmissionResponseSchema: z.ZodType<SubmissionResponse> = z.object({
  interpretation_id: z.number(),
  review_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  message: z.string(),
})

export const ReviewResponseSchema: z.ZodType<ReviewResponse> = z.object({
  interpretation_id: z.number(),
  review_status: z.string(),
  reviewed_by: z.string(),
  message: z.string(),
})

export const FeedbackResponseSchema: z.ZodType<FeedbackResponse> = z.object({
  case_id: z.string(),
  verified_outcome: z.string(),
  is_reviewed_for_best_practice: z.boolean(),
  message: z.string(),
})

export const GovernanceStatsSchema: z.ZodType<GovernanceStats> = z.object({
  classic_texts_coverage: z.object({
    total_rows_db: z.number(),
    benchmark_target: z.number(),
    special_lines_extra: z.number(),
    null_han_count: z.number(),
    is_100_percent_approved: z.boolean(),
  }),
  review_queue: z.object({
    pending_count: z.number(),
    approved_count: z.number(),
    rejected_count: z.number(),
  }),
  sources_breakdown: z.object({
    total_sources: z.number(),
    by_kind: z.record(z.number()),
  }),
  double_loop_learning: z.object({
    total_cases: z.number(),
    cases_with_feedback: z.number(),
    best_practice_cases: z.number(),
    review_needed_rules: z.array(
      z.object({
        rule_id: z.number(),
        rule_code: z.string(),
        failure_rate: z.number(),
      })
    ),
  }),
  inference_rules: z
    .object({
      total_count: z.number(),
      approved_count: z.number(),
      pending_count: z.number(),
      rejected_count: z.number(),
    })
    .optional(),
  knowledge_kpi: z
    .object({
      total_cases: z.number(),
      cases_with_interp: z.number(),
      interp_rate: z.number(),
      cases_with_fallback: z.number(),
      fallback_rate: z.number(),
      covered_hexagram_ids: z.array(z.number()).optional(),
    })
    .optional(),
})

/**
 * Hàm kiểm chứng ranh giới API (Contract Validator).
 * - Nếu dữ liệu khớp Schema: trả về kết quả đã được type hóa an toàn.
 * - Nếu dữ liệu lệch Schema: ghi cảnh báo dạng log trong môi trường DEV,
 *   nhưng vẫn trả về data nguyên vẹn để bảo đảm "Không đổi hành vi" và tránh crash người dùng.
 */
export function validateContract<T>(
  schema: z.ZodType<T>,
  data: unknown,
  endpointName: string
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(
        `[Contract Warning] Phản hồi tại ${endpointName} có trường không khớp Zod Schema:`,
        result.error.format()
      )
    }
    return data as T
  }
  return result.data
}

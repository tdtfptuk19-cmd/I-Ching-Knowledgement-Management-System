import { z } from 'zod'

export type CastingMethod = 'MAI_HOA_TIME' | 'MAI_HOA_NUMBER'
export type Topic = 'CAREER' | 'RELATIONSHIP' | 'FINANCE' | 'HEALTH' | 'ACADEMIC' | 'GENERAL'
export type UserLevel = 'NOVICE' | 'PRACTITIONER' | 'EXPERT'
export type RatHourRule = 'NEXT_DAY' | 'SAME_DAY'
export type DungSide = 'UPPER' | 'LOWER'
export type FiveElement = 'KIM' | 'MOC' | 'THUY' | 'HOA' | 'THO'
export type PolarityLabel = 'ĐẠI CÁT' | 'TIỂU CÁT' | 'BÌNH HÒA' | 'TIỂU HUNG' | 'ĐẠI HUNG'

export interface LunarConvertResponse {
  solar_date: string
  lunar_day: number
  lunar_month: number
  lunar_year: number
  is_leap_month: boolean
  can_chi_year: string
  can_chi_month: string
  can_chi_day: string
  can_chi_hour: string
  solar_term: string
  rat_hour_rule: RatHourRule
  is_da_ty: boolean
  year_branch_num: number
  year_branch_name: string
  hour_branch_num: number
  hour_branch_name: string
  assumption_note: string | null
}

export interface TrigramInfo {
  id: number
  name_vn: string
  name_han: string
  binary_code: string
  five_element: FiveElement | string
  nature_symbol: string
}

export interface HexagramInfo {
  hexagram_id: number
  name_vn: string
  name_han: string
  binary_code: string
  upper_trigram: TrigramInfo
  lower_trigram: TrigramInfo
}

export interface FiveElementRelationAnalysis {
  pair: string
  primary_element: string
  target_element: string
  relation_type: string
  polarity_weight: number
  interpretation: string
  source_id: number
}

export interface RuleFiredInfo {
  rule_id: number
  rule_code: string
  priority: number
  conclusion: string
  condition_description?: string
  trace: Record<string, unknown>
}

export interface AdviceBlock {
  title: string
  content: string
  provenance?: {
    source_id?: number
    rule_ref?: string
    note?: string
    [key: string]: unknown
  }
}

export interface SynthesisResult {
  score: number
  normalized_score: number
  polarity_label: PolarityLabel | string
  primary_conclusion: string
  advice_blocks: AdviceBlock[]
  decomposition: {
    element_score: number
    rule_score: number
    interpretation_score: number
  }
}

export interface ClassicTextItem {
  text_id: number
  hexagram_id: number
  hexagram_name?: string
  line_position: number | null
  text_type: string
  text_han: string | null
  text_vn: string
  source_id: number
  source_title?: string
  source_author?: string
  confidence?: string | null
  source_ref?: string | null
  issues?: string | null
  verified_by?: string | null
  verified_at?: string | null
}

export interface InterpretationItem {
  interpretation_id: number
  hexagram_id: number
  target_type?: 'HEXAGRAM' | 'LINE' | 'TRANSFORMATION'
  line_position?: number | null
  moving_line_position?: number | null
  to_hexagram_id?: number | null
  topic: string
  summary: string
  guidance: string
  polarity: number
  source_id: number
  author_type: string
  source_title?: string
  version?: number
  review_status?: 'APPROVED' | 'PENDING' | 'REJECTED'
}

export interface CoverageInfo {
  is_complete: boolean
  classic_texts_count: number
  has_custom_topic_interpretation: boolean
  fallback_applied: boolean
  message: string
}

export interface CastingMeta {
  casting_method: CastingMethod
  user_level: UserLevel
  pseudonymized_user_hash: string
  lunar_meta?: {
    solar_datetime: string
    calculated_solar_date: string
    rat_hour_rule: string
    is_da_ty: boolean
    lunar_day: number
    lunar_month: number
    lunar_year: number
    is_leap_month: boolean
    year_branch_num: number
    year_branch_name: string
    can_chi_year: string
    hour_branch_num: number
    hour_branch_name: string
    assumption_note: string | null
  } | null
  raw_numbers?: {
    number_upper: number
    number_lower: number
  } | null
}

export interface DivinationResponse {
  case_id: string
  disclaimer: string
  casting_meta: CastingMeta
  initial_hexagram: HexagramInfo
  transformed_hexagram: HexagramInfo
  nuclear_hexagram: HexagramInfo
  moving_line: number
  dung_side: DungSide | string
  the_element: FiveElement | string
  dung_element: FiveElement | string
  five_element_analysis: FiveElementRelationAnalysis[]
  rules_fired: RuleFiredInfo[]
  classic_texts: ClassicTextItem[]
  interpretations: InterpretationItem[]
  synthesis: SynthesisResult
  coverage: CoverageInfo
}

export interface DivinationRequest {
  casting_method: CastingMethod
  topic: Topic
  solar_datetime?: string | null
  rat_hour_rule?: RatHourRule | null
  number_upper?: number | null
  number_lower?: number | null
  user_id?: string
  user_level?: UserLevel
}

// Zod schemas for runtime boundary validation
export const DivinationRequestSchema = z.object({
  casting_method: z.enum(['MAI_HOA_TIME', 'MAI_HOA_NUMBER']),
  topic: z.enum(['CAREER', 'RELATIONSHIP', 'FINANCE', 'HEALTH', 'ACADEMIC', 'GENERAL']),
  solar_datetime: z.string().optional().nullable(),
  rat_hour_rule: z.enum(['NEXT_DAY', 'SAME_DAY']).optional().nullable(),
  number_upper: z.number().int().min(1).optional().nullable(),
  number_lower: z.number().int().min(1).optional().nullable(),
  user_id: z.string().optional(),
  user_level: z.enum(['NOVICE', 'PRACTITIONER', 'EXPERT']).optional(),
}).refine(data => {
  if (data.casting_method === 'MAI_HOA_NUMBER') {
    return typeof data.number_upper === 'number' && data.number_upper >= 1 &&
           typeof data.number_lower === 'number' && data.number_lower >= 1
  }
  return true
}, {
  message: 'Phương pháp hai số yêu cầu cả Số Thượng và Số Hạ phải lớn hơn hoặc bằng 1',
  path: ['number_upper'],
})

// Trợ Lý Dịch Sư — Interpret Request / Response
export interface InterpretRequest {
  case_id?: string
  user_question?: string
  user_level?: UserLevel
}

export interface ValidationCheck {
  rule_id?: string | null
  description: string
  passed: boolean
  details?: unknown
}

export interface InterpretResponse {
  markdown_text: string
  citations: string[]
  is_fallback: boolean
  validation_report: {
    passed: boolean
    checks: ValidationCheck[]
  }
  disclaimer: string
  prompt_version: string
  model: string
  attempts: number
}

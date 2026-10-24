import { describe, it, expect, vi } from 'vitest'
import {
  HealthResponseSchema,
  LunarConvertResponseSchema,
  GovernanceStatsSchema,
  ReviewQueueResponseSchema,
  validateContract,
} from '../contracts'
import { queryKeys } from '../query-keys'

describe('Gate 13: Typed Contracts (Zod) & Query Key Factory', () => {
  it('Khớp chuẩn dữ liệu HealthResponseSchema', () => {
    const validHealth = {
      status: 'ok',
      service: 'KinhDich_KB_API',
      version: '1.0.0',
      database: 'KinhDich_KB_dev',
    }
    const validated = validateContract(HealthResponseSchema, validHealth, '/health')
    expect(validated.status).toBe('ok')
    expect(validated.database).toBe('KinhDich_KB_dev')
  })

  it('Khớp chuẩn dữ liệu LunarConvertResponseSchema', () => {
    const validLunar = {
      solar_date: '2026-10-24T18:00',
      lunar_day: 15,
      lunar_month: 9,
      lunar_year: 2026,
      is_leap_month: false,
      can_chi_year: 'Bính Ngọ',
      can_chi_month: 'Mậu Tuất',
      can_chi_day: 'Canh Thân',
      can_chi_hour: 'Ất Dậu',
      solar_term: 'Sương Giáng',
      rat_hour_rule: 'NEXT_DAY',
      is_da_ty: false,
      year_branch_num: 7,
      year_branch_name: 'Ngọ',
      hour_branch_num: 10,
      hour_branch_name: 'Dậu',
      assumption_note: null,
    }
    const validated = validateContract(LunarConvertResponseSchema, validLunar, '/lunar/convert')
    expect(validated.lunar_day).toBe(15)
    expect(validated.can_chi_year).toBe('Bính Ngọ')
  })

  it('Khớp chuẩn dữ liệu GovernanceStatsSchema', () => {
    const validStats = {
      classic_texts_coverage: {
        total_rows_db: 964,
        benchmark_target: 964,
        special_lines_extra: 2,
        null_han_count: 0,
        is_100_percent_approved: true,
      },
      review_queue: {
        pending_count: 3,
        approved_count: 24,
        rejected_count: 2,
      },
      sources_breakdown: {
        total_sources: 12,
        by_kind: { BOOK: 8, ARTICLE: 4 },
      },
      double_loop_learning: {
        total_cases: 42,
        cases_with_feedback: 15,
        best_practice_cases: 10,
        review_needed_rules: [
          { rule_id: 1, rule_code: 'BCR-001', failure_rate: 0.05 },
        ],
      },
    }
    const validated = validateContract(GovernanceStatsSchema, validStats, '/governance/stats')
    expect(validated.classic_texts_coverage.total_rows_db).toBe(964)
    expect(validated.double_loop_learning.total_cases).toBe(42)
  })

  it('Khớp chuẩn dữ liệu ReviewQueueResponseSchema', () => {
    const validQueue = [
      {
        interpretation_id: 1,
        target_type: 'HEXAGRAM' as const,
        hexagram_id: 1,
        line_position: null,
        moving_line_position: null,
        to_hexagram_id: null,
        topic: 'CAREER',
        summary: 'Diễn giải tổng quát quẻ Thuần Càn',
        guidance: 'Kiên trì tiến bước',
        polarity: 1,
        source_id: 1,
        author_type: 'EXPERT' as const,
        review_status: 'PENDING' as const,
        created_at: '2026-10-24T18:00:00Z',
      },
    ]
    const validated = validateContract(ReviewQueueResponseSchema, validQueue, '/review/queue')
    expect(validated).toHaveLength(1)
    expect(validated[0].interpretation_id).toBe(1)
  })

  it('validateContract không ném exception khi dữ liệu lệch schema (Defensive Fallback)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const malformedData = { invalid_field: 123 }

    // Không throw mà trả về data thô để bảo đảm "Không đổi hành vi"
    const result = validateContract(HealthResponseSchema, malformedData, '/health')
    expect(result).toEqual(malformedData)
    warnSpy.mockRestore()
  })

  it('Query Key Factory tạo key nhất quán và có thể suy đoán được', () => {
    expect(queryKeys.health).toEqual(['health'])
    expect(queryKeys.governance.stats).toEqual(['governanceStats'])
    expect(queryKeys.governance.queue).toEqual(['reviewQueue'])
    expect(queryKeys.hexagrams.detail(1, 'NOVICE')).toEqual(['hexagram', 1, 'NOVICE'])
    expect(
      queryKeys.search.list({ q: 'càn', topic: 'CAREER', userLevel: 'EXPERT', page: 2 })
    ).toEqual(['search', 'càn', 'CAREER', undefined, undefined, 'EXPERT', 2])
  })
})

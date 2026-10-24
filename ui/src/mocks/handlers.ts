import { http, HttpResponse } from 'msw'

import healthFixture from './fixtures/health.json'
import lunarConvertFixture from './fixtures/lunar_convert.json'
import divinationTimeFixture from './fixtures/divination_time.json'
import divinationNumberHealthFixture from './fixtures/divination_number_health.json'
import hexagramExpertFixture from './fixtures/hexagram_expert.json'
import hexagramNoviceFixture from './fixtures/hexagram_novice.json'
import searchExpertFixture from './fixtures/search_expert.json'
import searchNoviceUnaccentedFixture from './fixtures/search_novice_unaccented.json'
import interpretationsSubmitFixture from './fixtures/interpretations_submit.json'
import reviewQueueFixture from './fixtures/review_queue.json'
import reviewActionFixture from './fixtures/review_action.json'
import feedbackActionFixture from './fixtures/feedback_action.json'
import governanceStatsFixture from './fixtures/governance_stats.json'

import realReq1Fixture from './fixtures/real_req_1_number_2_3.json'
import realReq2Fixture from './fixtures/real_req_2_number_4_6.json'
import realReq3Fixture from './fixtures/real_req_3_number_7_8.json'
import realReq4Fixture from './fixtures/real_req_4_number_1_5.json'
import realReq5Fixture from './fixtures/real_req_5_time_health.json'

export const handlers = [
  // 1. GET /health
  http.get('*/health', () => {
    return HttpResponse.json(healthFixture)
  }),

  // 2. GET /lunar/convert
  http.get('*/lunar/convert', ({ request }) => {
    const url = new URL(request.url)
    const ratRule = url.searchParams.get('rat_hour_rule') || 'NEXT_DAY'
    return HttpResponse.json({
      ...lunarConvertFixture,
      rat_hour_rule: ratRule,
    })
  }),

  // 3. POST /divination (Sử dụng 100% response đối soát thật từ KinhDich_KB)
  http.post('*/divination', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const method = body.casting_method
    const topic = body.topic
    const upper = body.number_upper as number | undefined
    const lower = body.number_lower as number | undefined

    // Response thật cho (2, 3) -> Trạch Hỏa Cách (49) biến Lôi Hỏa Phong (55), moving 5
    if (upper === 2 && lower === 3) {
      return HttpResponse.json(realReq1Fixture)
    }

    // Response thật cho (4, 6) -> Lôi Thủy Giải (40) biến Địa Thủy Sư (7), moving 4 (Khớp kỳ vọng test Tầng 2)
    if (upper === 4 && lower === 6) {
      return HttpResponse.json(realReq2Fixture)
    }

    // Response thật cho (7, 8) -> Sơn Địa Bác (23) biến Thuần Cấn (52), moving 3 (Khớp kỳ vọng test Tầng 2)
    if (upper === 7 && lower === 8) {
      return HttpResponse.json(realReq3Fixture)
    }

    // Response thật cho (1, 5) -> Thiên Phong Cấu (44) biến Trạch Phong Đại Quá (28), moving 6
    if (upper === 1 && lower === 5) {
      return HttpResponse.json(realReq4Fixture)
    }

    if (topic === 'HEALTH') {
      return HttpResponse.json(realReq5Fixture)
    }

    if (method === 'MAI_HOA_TIME') {
      return HttpResponse.json(divinationTimeFixture)
    }

    return HttpResponse.json(divinationNumberHealthFixture)
  }),

  // 4. GET /hexagram/:id
  http.get('*/hexagram/:id', ({ request, params }) => {
    const url = new URL(request.url)
    const userLevel = url.searchParams.get('user_level')
    const id = Number(params.id) || 1

    if (userLevel === 'EXPERT') {
      return HttpResponse.json({
        ...hexagramExpertFixture,
        hexagram_id: id,
        user_level: 'EXPERT',
      })
    }

    if (userLevel === 'PRACTITIONER') {
      return HttpResponse.json({
        ...hexagramExpertFixture,
        hexagram_id: id,
        user_level: 'PRACTITIONER',
        classic_texts: hexagramExpertFixture.classic_texts.map(t => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { verified_by, verified_at, issues, source_ref, confidence, ...rest } = t
          return rest
        }),
      })
    }

    return HttpResponse.json({
      ...hexagramNoviceFixture,
      hexagram_id: id,
      user_level: 'NOVICE',
    })
  }),

  // 5. GET /search
  http.get('*/search', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    const topic = url.searchParams.get('topic')
    const userLevel = url.searchParams.get('user_level')

    if (q === 'empty' || q === 'khong_tim_thay_du_lieu') {
      return HttpResponse.json({
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        query: q,
        topic: topic || null,
        items: [],
      })
    }

    if (q.toLowerCase() === 'can' || q.toLowerCase() === 'càn') {
      return HttpResponse.json({
        ...searchNoviceUnaccentedFixture,
        query: q,
        topic: topic || null,
      })
    }

    if (userLevel === 'EXPERT') {
      return HttpResponse.json({
        ...searchExpertFixture,
        query: q || null,
        topic: topic || null,
      })
    }

    return HttpResponse.json({
      ...searchNoviceUnaccentedFixture,
      query: q || null,
      topic: topic || null,
    })
  }),

  // 6. POST /interpretations
  http.post('*/interpretations', () => {
    return HttpResponse.json(interpretationsSubmitFixture, { status: 201 })
  }),

  // 7. GET /review/queue
  http.get('*/review/queue', () => {
    return HttpResponse.json(reviewQueueFixture)
  }),

  // 8. PUT /interpretations/:id/review
  http.put('*/interpretations/:id/review', ({ params }) => {
    return HttpResponse.json({
      ...reviewActionFixture,
      interpretation_id: Number(params.id) || 4,
    })
  }),

  // 9. PUT /divination/:case_id/feedback
  http.put('*/divination/:case_id/feedback', ({ params }) => {
    return HttpResponse.json({
      ...feedbackActionFixture,
      case_id: String(params.case_id),
    })
  }),

  // 10. GET /governance/stats
  http.get('*/governance/stats', () => {
    return HttpResponse.json(governanceStatsFixture)
  }),
]

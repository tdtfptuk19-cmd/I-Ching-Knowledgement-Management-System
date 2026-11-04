import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DivinationResponse, InterpretationItem } from '@/types/divination.types'
import fixture from '@/mocks/fixtures/real_req_1_number_2_3.json'
import { buildDecisionBrief } from '../decisionBrief'
import { DecisionBriefCard } from '../DecisionBriefCard'

const data = fixture as unknown as DivinationResponse

const BASE_INTERPRETATION: InterpretationItem = {
  interpretation_id: 9000,
  hexagram_id: data.initial_hexagram.hexagram_id,
  target_type: 'HEXAGRAM',
  line_position: null,
  moving_line_position: null,
  to_hexagram_id: null,
  topic: 'GENERAL',
  summary: 'Diễn giải kiểm thử.',
  guidance: 'Duy trì nhịp độ hiện tại.',
  polarity: 0,
  source_id: 1,
  author_type: 'EXPERT',
  review_status: 'APPROVED',
}

function withInterpretations(...items: Array<Partial<InterpretationItem>>): DivinationResponse {
  return {
    ...data,
    interpretations: items.map((item, index) => ({
      ...BASE_INTERPRETATION,
      interpretation_id: BASE_INTERPRETATION.interpretation_id + index,
      ...item,
    })),
  }
}

describe('buildDecisionBrief: chuyển kết quả engine thành định hướng hành động', () => {
  it('tóm tắt cục diện và sinh danh sách Nên Làm / Nên Tránh', () => {
    const brief = buildDecisionBrief(data, 'CAREER')

    expect(brief.polarityLabel).toBe('TIỂU CÁT')
    expect(brief.generalTrend).toContain('TIỂU CÁT')
    expect(brief.generalTrend).toContain('Trạch Hỏa Cách')
    expect(brief.dos.length).toBeGreaterThan(0)
    expect(brief.donts.length).toBeGreaterThan(0)
    expect(brief.dos.length).toBeLessThanOrEqual(4)
    expect(brief.donts.length).toBeLessThanOrEqual(4)
  })

  it('không lặp lại nội dung giữa các nguồn hướng dẫn', () => {
    const brief = buildDecisionBrief(data, 'GENERAL')
    expect(new Set(brief.dos).size).toBe(brief.dos.length)
    expect(new Set(brief.donts).size).toBe(brief.donts.length)
  })

  it('suy ra hướng ưu tiên từ quẻ Thể và người đồng hành từ quẻ Dụng', () => {
    // Fixture: dung_side=UPPER -> Thể là Hạ quái Ly (Nam), Dụng là Thượng quái Đoài
    const brief = buildDecisionBrief(data, 'CAREER')
    expect(brief.favorableDirection).toBe('Nam')
    expect(brief.keyPeople).toContain('bạn trẻ')
  })

  it('gắn nhãn thời hiệu dự báo 3–6 hoặc 6–12 tháng', () => {
    expect(buildDecisionBrief(data, 'CAREER').timeHorizon).toMatch(/3 – 6 tháng|6 – 12 tháng/)
  })

  it('bổ sung khuyến nghị an toàn cho chủ đề HEALTH và FINANCE', () => {
    const health = buildDecisionBrief(data, 'HEALTH')
    expect(health.dos.join(' ')).toMatch(/bác sĩ|chuyên gia y tế/)

    const finance = buildDecisionBrief(data, 'FINANCE')
    expect(finance.dos.join(' ')).toMatch(/chuyên gia tài chính/)
  })
})

describe('buildDecisionBrief: ưu tiên diễn giải chuyên đề đã duyệt', () => {
  it('đưa lời khuyên chuyên gia lên vị trí đầu của Nên Làm và tách đúng vế Nên Tránh', () => {
    const expertData = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance:
        'Mạnh dạn đề xuất cải tiến quy trình, nhưng cần chuẩn bị kế hoạch kỹ lưỡng, tránh tranh chấp trực diện.',
    })
    const brief = buildDecisionBrief(expertData, 'CAREER')

    expect(brief.dos[0]).toBe('Mạnh dạn đề xuất cải tiến quy trình.')
    expect(brief.dos[1]).toBe('Cần chuẩn bị kế hoạch kỹ lưỡng.')
    expect(brief.donts[0]).toBe('Tránh tranh chấp trực diện.')
  })

  it('chọn diễn giải theo đúng thứ tự ưu tiên hào/quẻ và chủ đề/GENERAL', () => {
    const hexGeneral = {
      target_type: 'HEXAGRAM' as const,
      topic: 'GENERAL',
      guidance: 'Ưu tiên quẻ chủ đề chung.',
    }
    const lineGeneral = {
      target_type: 'LINE' as const,
      line_position: data.moving_line,
      topic: 'GENERAL',
      guidance: 'Ưu tiên hào chủ đề chung.',
    }
    const hexCareer = {
      target_type: 'HEXAGRAM' as const,
      topic: 'CAREER',
      guidance: 'Ưu tiên quẻ đúng chủ đề.',
    }
    const lineCareer = {
      target_type: 'LINE' as const,
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance: 'Ưu tiên hào đúng chủ đề.',
    }

    expect(
      buildDecisionBrief(withInterpretations(hexGeneral, lineGeneral, hexCareer, lineCareer), 'CAREER')
        .dos[0],
    ).toBe('Ưu tiên hào đúng chủ đề.')
    expect(
      buildDecisionBrief(withInterpretations(hexGeneral, lineGeneral, hexCareer), 'CAREER').dos[0],
    ).toBe('Ưu tiên quẻ đúng chủ đề.')
    expect(buildDecisionBrief(withInterpretations(hexGeneral, lineGeneral), 'CAREER').dos[0]).toBe(
      'Ưu tiên hào chủ đề chung.',
    )
    expect(buildDecisionBrief(withInterpretations(hexGeneral), 'CAREER').dos[0]).toBe(
      'Ưu tiên quẻ chủ đề chung.',
    )
  })

  it('bỏ qua diễn giải PENDING/REJECTED và quay về từ điển tĩnh an toàn', () => {
    const pending = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance: 'Chỉ dẫn chưa duyệt không được hiển thị.',
      review_status: 'PENDING',
    })
    const rejected = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance: 'Chỉ dẫn bị từ chối không được hiển thị.',
      review_status: 'REJECTED',
    })
    const wrongTopic = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'RELATIONSHIP',
      guidance: 'Chỉ dẫn sai chủ đề không được hiển thị.',
    })
    const wrongLine = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line === 1 ? 2 : 1,
      topic: 'CAREER',
      guidance: 'Chỉ dẫn sai hào động không được hiển thị.',
    })

    for (const payload of [data, pending, rejected, wrongTopic, wrongLine]) {
      const brief = buildDecisionBrief(payload, 'CAREER')
      expect(brief.dos).toContain('Giữ nhịp độ đều và xử lý dứt điểm từng việc.')
      expect(brief.dos.join(' ')).not.toMatch(/chưa duyệt|bị từ chối|sai chủ đề|sai hào động/i)
    }
  })

  it('nhận diện mệnh đề phòng ngừa mở đầu bằng "không" mà không cắt nhầm điều kiện giữa câu', () => {
    const expertData = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance:
        'Chuẩn bị phương án dự phòng nếu không có đủ nguồn lực; không chủ quan khi mọi việc thuận lợi.',
    })
    const brief = buildDecisionBrief(expertData, 'CAREER')

    expect(brief.dos.join(' ')).toContain('nếu không có đủ nguồn lực')
    expect(brief.donts).toContain('Không chủ quan khi mọi việc thuận lợi.')
  })

  it('khống chế tối đa 4 mục mỗi cột khi chuyên gia có nhiều khuyến nghị', () => {
    const expertData = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance:
        'Ưu tiên việc thứ nhất; Ưu tiên việc thứ hai; Ưu tiên việc thứ ba; Ưu tiên việc thứ tư; Ưu tiên việc thứ năm; Ưu tiên việc thứ sáu.',
    })
    const brief = buildDecisionBrief(expertData, 'CAREER')

    expect(brief.dos).toHaveLength(4)
    expect(brief.donts.length).toBeLessThanOrEqual(4)
  })

  it('bảo toàn khuyến nghị an toàn HEALTH/FINANCE khi chuyên gia chiếm trọn 4 mục', () => {
    const guidance =
      'Ưu tiên việc thứ nhất; Ưu tiên việc thứ hai; Ưu tiên việc thứ ba; Ưu tiên việc thứ tư.'

    const health = buildDecisionBrief(
      withInterpretations({
        target_type: 'LINE',
        line_position: data.moving_line,
        topic: 'HEALTH',
        guidance,
      }),
      'HEALTH',
    )
    expect(health.dos).toHaveLength(4)
    expect(health.dos.join(' ')).toMatch(/khám sức khỏe/)
    expect(health.dos.join(' ')).toMatch(/bác sĩ|chuyên gia y tế/)

    const finance = buildDecisionBrief(
      withInterpretations({
        target_type: 'LINE',
        line_position: data.moving_line,
        topic: 'FINANCE',
        guidance,
      }),
      'FINANCE',
    )
    expect(finance.dos).toHaveLength(4)
    expect(finance.dos.join(' ')).toMatch(/chuyên gia tài chính/)
    expect(finance.dos.join(' ')).toMatch(/quỹ dự phòng/)
  })

  it('cắt gọn lời khuyên dài quá 120 ký tự mà vẫn giữ trọn từ', () => {
    const longGuidance = `Chuẩn bị kỹ lưỡng ${'kế hoạch và nguồn lực '.repeat(10)}cho từng phương án.`
    const brief = buildDecisionBrief(
      withInterpretations({
        target_type: 'LINE',
        line_position: data.moving_line,
        topic: 'CAREER',
        guidance: longGuidance,
      }),
      'CAREER',
    )

    expect(brief.dos[0].length).toBeLessThanOrEqual(120)
    expect(brief.dos[0].endsWith('…')).toBe(true)
  })
})

describe('DecisionBriefCard: hiển thị lớp khuyến nghị cho người dùng phổ thông', () => {
  it('render cục diện, hai cột Nên Làm / Nên Tránh và thời hiệu', () => {
    render(<DecisionBriefCard data={data} topic="CAREER" />)

    expect(screen.getByTestId('decision-brief')).toBeInTheDocument()
    expect(screen.getByText('Nên Làm')).toBeInTheDocument()
    expect(screen.getByText('Nên Tránh')).toBeInTheDocument()
    expect(screen.getByText(/Thời hiệu dự báo:/i)).toBeInTheDocument()
    expect(screen.getByTestId('decision-brief-polarity')).toHaveTextContent('TIỂU CÁT')
    expect(screen.getByText(/Kinh Dịch không ấn định số mệnh trọn đời/i)).toBeInTheDocument()
  })

  it('hiển thị lời khuyên chuyên đề ở dòng đầu tiên của cột Nên Làm', () => {
    const expertData = withInterpretations({
      target_type: 'LINE',
      line_position: data.moving_line,
      topic: 'CAREER',
      guidance: 'Mạnh dạn đề xuất cải tiến quy trình, tránh tranh chấp trực diện.',
    })
    render(<DecisionBriefCard data={expertData} topic="CAREER" />)

    const dosItems = within(screen.getByTestId('decision-brief-dos')).getAllByRole('listitem')
    expect(dosItems[0]).toHaveTextContent('Mạnh dạn đề xuất cải tiến quy trình.')

    const dontsItems = within(screen.getByTestId('decision-brief-donts')).getAllByRole('listitem')
    expect(dontsItems[0]).toHaveTextContent('Tránh tranh chấp trực diện.')
  })
})

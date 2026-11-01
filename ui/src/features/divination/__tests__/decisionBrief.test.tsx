import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DivinationResponse } from '@/types/divination.types'
import fixture from '@/mocks/fixtures/real_req_1_number_2_3.json'
import { buildDecisionBrief } from '../decisionBrief'
import { DecisionBriefCard } from '../DecisionBriefCard'

const data = fixture as unknown as DivinationResponse

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
})

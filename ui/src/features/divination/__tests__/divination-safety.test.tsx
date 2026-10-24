import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentSafetyAlert } from '../ContentSafetyAlert'

describe('ContentSafetyAlert: Nguyên tắc an toàn nội dung bắt buộc', () => {
  it('hiển thị khối cảnh báo y tế nổi bật khi topic = HEALTH', () => {
    render(
      <ContentSafetyAlert
        topic="HEALTH"
        disclaimer="Tuyên bố miễn trừ trách nhiệm chuẩn"
        adviceBlocks={[
          {
            title: 'Cảnh báo y tế',
            content: 'Cần tham vấn bác sĩ chuyên khoa.',
            provenance: { note: 'CONTENT_SAFETY_HEALTH' },
          },
        ]}
      />,
    )

    const healthAlert = screen.getByRole('alert', { name: /an toàn y tế/i })
    expect(healthAlert).toBeInTheDocument()
    expect(healthAlert).toHaveTextContent('CẢNH BÁO NGUYÊN TẮC AN TOÀN Y TẾ & SỨC KHỎE')
    expect(healthAlert).toHaveTextContent('Cần tham vấn bác sĩ chuyên khoa')
  })

  it('hiển thị khối cảnh báo tài chính nổi bật khi topic = FINANCE', () => {
    render(
      <ContentSafetyAlert
        topic="FINANCE"
        disclaimer="Tuyên bố miễn trừ trách nhiệm chuẩn"
        adviceBlocks={[
          {
            title: 'Cảnh báo tài chính',
            content: 'Không sử dụng làm căn cứ đầu tư.',
            provenance: { note: 'CONTENT_SAFETY_FINANCE' },
          },
        ]}
      />,
    )

    const financeAlert = screen.getByRole('alert', { name: /an toàn tài chính/i })
    expect(financeAlert).toBeInTheDocument()
    expect(financeAlert).toHaveTextContent('CẢNH BÁO NGUYÊN TẮC AN TOÀN TÀI CHÍNH & ĐẦU TƯ')
    expect(financeAlert).toHaveTextContent('Không sử dụng làm căn cứ đầu tư')
  })

  it('luôn hiển thị tuyên bố miễn trừ trách nhiệm chung (disclaimer) cho mọi chủ đề', () => {
    render(
      <ContentSafetyAlert
        topic="CAREER"
        disclaimer="Hệ thống không đưa ra khẳng định chắc chắn về tương lai."
      />,
    )

    expect(
      screen.getByText(/không đưa ra khẳng định chắc chắn về tương lai/i),
    ).toBeInTheDocument()

    // Với CAREER, không có alert y tế/tài chính
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

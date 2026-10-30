import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIAdviceBlock } from '../AIAdviceBlock'
import * as divinationApi from '@/api/divination.api'
import { AIAdviceResponse } from '@/types/divination.types'
import { SubmissionResponse } from '@/types/governance.types'

vi.mock('@/api/divination.api', () => ({
  postAIAdvice: vi.fn(),
  saveAIAdviceDraft: vi.fn(),
}))

const mockSuccessAdvice: AIAdviceResponse = {
  advice_id: 'advice-uuid-001',
  title: 'Lời khuyên Hành động (CAREER) — Trợ lý Dịch sư',
  content:
    '- Về đại cục, vận trình đạt mức TIỂU CÁT, nên củng cố nội lực. [Ngũ hành·THE_DUNG_MAIN]\n' +
    '- Hào động 1 nhắc nhở tiềm phục, chớ nóng vội. [Hào từ 1, p. 11]\n' +
    '- Quẻ Biến mở ra hướng đi bền vững khi giữ chữ tín. [Ngũ hành·THE_TRANSFORMED_DUNG]\n' +
    '- Luôn giữ tâm niệm khiêm cung và tích đức hành thiện. [Đại tượng, p. 10]',
  citations: ['[Ngũ hành·THE_DUNG_MAIN]', '[Hào từ 1, p. 11]', '[Ngũ hành·THE_TRANSFORMED_DUNG]', '[Đại tượng, p. 10]'],
  is_fallback: false,
  validation_report: {
    passed: true,
    checks: [],
  },
  provenance: {
    source: 'AI_AUGMENTED_RAG',
    author_type: 'AI_DRAFT',
    review_status: 'AI_DRAFT',
    model: 'gemini-2.5-flash',
    prompt_version: 'v1.0',
  },
  disclaimer: 'Tuyên bố miễn trừ trách nhiệm.',
  draft_payload: {
    target_type: 'LINE',
    hexagram_id: 1,
    line_position: 1,
    topic: 'CAREER',
    summary: 'Về đại cục, vận trình đạt mức TIỂU CÁT, nên củng cố nội lực.',
    guidance: '- ...',
    polarity: 1,
    source_id: 1,
    author_type: 'AI_DRAFT',
    author_name: 'Trợ lý Dịch sư (AI)',
  },
}

describe('AIAdviceBlock Component (PA2\' + Save Draft)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Render mặc định: Khối CTA hiển thị nút "Tạo Lời Khuyên Hành Động từ AI"', () => {
    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    expect(screen.getByTestId('ai-advice-cta-block')).toBeInTheDocument()
    expect(screen.getByTestId('ai-advice-cta-btn')).toBeInTheDocument()
    expect(screen.getByText(/Thuần Càn/i)).toBeInTheDocument()
  })

  it('2. Bấm nút CTA: Hiển thị trạng thái Loading', async () => {
    vi.mocked(divinationApi.postAIAdvice).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSuccessAdvice), 500))
    )

    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    fireEvent.click(screen.getByTestId('ai-advice-cta-btn'))
    expect(screen.getByTestId('ai-advice-loading')).toBeInTheDocument()
  })

  it('3. Sinh thành công: Hiển thị các bullet, badge AI_DRAFT, model và trích dẫn citations', async () => {
    vi.mocked(divinationApi.postAIAdvice).mockResolvedValueOnce(mockSuccessAdvice)

    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    fireEvent.click(screen.getByTestId('ai-advice-cta-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-container')).toBeInTheDocument()
    })

    expect(screen.getByTestId('ai-advice-badge-draft')).toHaveTextContent('AI_DRAFT')
    expect(screen.getByTestId('ai-advice-badge-model')).toHaveTextContent('gemini-2.5-flash')
    expect(screen.getByText(/vận trình đạt mức TIỂU CÁT/i)).toBeInTheDocument()
    expect(screen.getByText(/Hào động 1 nhắc nhở/i)).toBeInTheDocument()

    // Citations
    expect(screen.getByTestId('ai-advice-citations')).toBeInTheDocument()
    expect(screen.getByText('[Ngũ hành·THE_DUNG_MAIN]')).toBeInTheDocument()

    // Nút lưu bản thảo
    expect(screen.getByTestId('ai-advice-save-btn')).toBeInTheDocument()
  })

  it('4. Fallback tất định: Hiển thị badge Thuật toán tất định (Fallback)', async () => {
    const fallbackAdvice: AIAdviceResponse = {
      ...mockSuccessAdvice,
      is_fallback: true,
      provenance: {
        ...mockSuccessAdvice.provenance,
        model: 'deterministic-fallback',
      },
    }
    vi.mocked(divinationApi.postAIAdvice).mockResolvedValueOnce(fallbackAdvice)

    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    fireEvent.click(screen.getByTestId('ai-advice-cta-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-badge-fallback')).toBeInTheDocument()
    })
    expect(screen.getByText(/Thuật toán tất định/i)).toBeInTheDocument()
  })

  it('5. Gặp lỗi API và bấm thử lại (Retry)', async () => {
    vi.mocked(divinationApi.postAIAdvice)
      .mockRejectedValueOnce(new Error('Lỗi máy chủ LLM (500)'))
      .mockResolvedValueOnce(mockSuccessAdvice)

    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    fireEvent.click(screen.getByTestId('ai-advice-cta-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-error')).toBeInTheDocument()
    })
    expect(screen.getByText(/Lỗi máy chủ LLM/i)).toBeInTheDocument()

    // Bấm thử lại
    fireEvent.click(screen.getByTestId('ai-advice-retry-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-container')).toBeInTheDocument()
    })
    expect(screen.getByTestId('ai-advice-badge-draft')).toBeInTheDocument()
  })

  it('6. Lưu bản thảo thành công: Hiển thị badge PENDING và mã duyệt', async () => {
    vi.mocked(divinationApi.postAIAdvice).mockResolvedValueOnce(mockSuccessAdvice)
    const mockSaveResult: SubmissionResponse = {
      interpretation_id: 999,
      review_status: 'PENDING',
      message: 'Bài đóng góp diễn giải đã được tiếp nhận thành công và chuyển vào hàng đợi kiểm duyệt (PENDING).',
    }
    vi.mocked(divinationApi.saveAIAdviceDraft).mockResolvedValueOnce(mockSaveResult)

    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    fireEvent.click(screen.getByTestId('ai-advice-cta-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-save-btn')).toBeInTheDocument()
    })

    // Bấm lưu bản thảo
    fireEvent.click(screen.getByTestId('ai-advice-save-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-saved-badge')).toBeInTheDocument()
    })

    expect(screen.getByText(/Đã gửi vào hàng đợi thẩm định \(PENDING\) — Mã #999/i)).toBeInTheDocument()
    expect(divinationApi.saveAIAdviceDraft).toHaveBeenCalledWith('case-100', 'advice-uuid-001')
  })

  it('7. Lưu bản thảo thất bại do hết hạn phiên (410): Hiển thị thông báo yêu cầu tạo lại', async () => {
    vi.mocked(divinationApi.postAIAdvice).mockResolvedValueOnce(mockSuccessAdvice)
    vi.mocked(divinationApi.saveAIAdviceDraft).mockRejectedValueOnce(
      new Error('HTTP 410: Phiên đã hết hạn hoặc bản thảo đã được lưu (DRAFT_EXPIRED)')
    )

    render(
      <AIAdviceBlock
        caseId="case-100"
        topic="CAREER"
        userLevel="NOVICE"
        initialHexagramName="Thuần Càn"
        movingLine={1}
      />
    )

    fireEvent.click(screen.getByTestId('ai-advice-cta-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-save-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('ai-advice-save-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('ai-advice-save-error')).toBeInTheDocument()
    })
    expect(screen.getByText(/Phiên đã hết hạn hoặc bản thảo đã được lưu/i)).toBeInTheDocument()
  })
})

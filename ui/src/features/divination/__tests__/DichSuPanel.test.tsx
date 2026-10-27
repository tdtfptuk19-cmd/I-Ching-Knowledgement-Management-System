import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DichSuPanel } from '../DichSuPanel'
import * as divinationApi from '@/api/divination.api'
import { InterpretResponse } from '@/types/divination.types'

vi.mock('@/api/divination.api', () => ({
  postInterpret: vi.fn(),
  postDivination: vi.fn(),
}))

const mockSuccessResponse: InterpretResponse = {
  markdown_text: '### 1. Phân Tích Thể Dụng\nThể [CAN_KIM] vượng tướng.\n### 2. Quá Trình Biến Hóa\nHào 3 động sinh tài.\n### 3. Kế Sách Tu Thân\nKiên định giữ đạo chính.',
  citations: ['[CAN_KIM]', '[BAT_QUAI_DOAN]'],
  disclaimer: 'Lời chiêm nghiệm mang tính triết học phương Đông.',
  is_fallback: false,
  model: 'gemini-1.5-flash',
  prompt_version: 'v2.1',
  attempts: 1,
  validation_report: {
    passed: true,
    checks: [{ description: 'three_sections', passed: true }],
  },
}

describe('DichSuPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Render mặc định: Textarea rỗng, counter 0/500 ký tự, nút gửi hiển thị', () => {
    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    expect(screen.getByText('Trợ Lý Dịch Sư — Luận Giải Chi Tiết')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/quẻ Thuần Càn/i)).toBeInTheDocument()
    expect(screen.getByText('0/500 ký tự')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nhờ trợ lý luận giải/i })).toBeInTheDocument()
  })

  it('2. Nhập câu hỏi cập nhật đúng số ký tự đếm được', () => {
    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    const textarea = screen.getByRole('textbox', { name: /câu hỏi chiêm đoán/i })
    fireEvent.change(textarea, { target: { value: 'Công việc sắp tới thế nào?' } })

    expect(screen.getByText('26/500 ký tự')).toBeInTheDocument()
  })

  it('3. Submit thành công hiển thị loading, sau đó hiển thị bài luận, badges và trích dẫn', async () => {
    vi.mocked(divinationApi.postInterpret).mockResolvedValueOnce(mockSuccessResponse)

    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    const submitBtn = screen.getByRole('button', { name: /nhờ trợ lý luận giải/i })
    fireEvent.click(submitBtn)

    // Loading status
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Trợ Lý Dịch Sư đang tổng hợp dữ kiện quẻ/i)).toBeInTheDocument()

    // Chờ kết quả hiển thị
    await waitFor(() => {
      expect(screen.getByText('1. Phân Tích Thể Dụng')).toBeInTheDocument()
    })

    expect(screen.getByText('2. Quá Trình Biến Hóa')).toBeInTheDocument()
    expect(screen.getByText('3. Kế Sách Tu Thân')).toBeInTheDocument()
    expect(screen.getByText('Luận giải từ Mô hình AI')).toBeInTheDocument()
    expect(screen.getByText('(gemini-1.5-flash)')).toBeInTheDocument()
    expect(screen.getByText('Nguồn & Thẻ Căn Cứ Trích Dẫn (2)')).toBeInTheDocument()
    expect(screen.getAllByText('[CAN_KIM]').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(mockSuccessResponse.disclaimer)).toBeInTheDocument()
  })

  it('4. Ngăn chặn spam click (inFlightRef) khi request đang xử lý', async () => {
    let resolvePromise: (value: InterpretResponse) => void
    const pendingPromise = new Promise<InterpretResponse>((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(divinationApi.postInterpret).mockReturnValue(pendingPromise)

    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    const formBtn = screen.getByRole('button', { name: /nhờ trợ lý luận giải/i })
    fireEvent.click(formBtn)
    fireEvent.click(formBtn)
    fireEvent.click(formBtn)

    expect(divinationApi.postInterpret).toHaveBeenCalledTimes(1)

    // Cleanup promise
    resolvePromise!(mockSuccessResponse)
    await waitFor(() => {
      expect(screen.getByText('1. Phân Tích Thể Dụng')).toBeInTheDocument()
    })
  })

  it('5. Hiển thị banner lỗi 404 phiên hết hạn khi mã lỗi là NOT_FOUND', async () => {
    const error404 = {
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'Không tìm thấy ca gieo quẻ với ID case-test-01 trong bộ nhớ.',
    }
    vi.mocked(divinationApi.postInterpret).mockRejectedValueOnce(error404)

    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /nhờ trợ lý luận giải/i }))

    await waitFor(() => {
      expect(screen.getByText('Phiên Gieo Quẻ Đã Hết Hạn')).toBeInTheDocument()
    })
    expect(screen.getByText(/Máy chủ vừa tái khởi động sau khoảng thời gian chờ/i)).toBeInTheDocument()
  })

  it('6. Hiển thị lỗi hệ thống thông thường và cho phép Thử Lại', async () => {
    const error500 = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Hệ thống gặp sự cố xử lý nội bộ. Vui lòng thử lại hoặc liên hệ quản trị viên.',
    }
    vi.mocked(divinationApi.postInterpret).mockRejectedValueOnce(error500)

    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /nhờ trợ lý luận giải/i }))

    await waitFor(() => {
      expect(screen.getByText('INTERNAL_SERVER_ERROR')).toBeInTheDocument()
    })
    expect(screen.getByText(/Hệ thống gặp sự cố xử lý nội bộ/i)).toBeInTheDocument()

    // Bấm nút "Thử Lại"
    vi.mocked(divinationApi.postInterpret).mockResolvedValueOnce(mockSuccessResponse)
    const retryBtn = screen.getByRole('button', { name: /thử lại/i })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('1. Phân Tích Thể Dụng')).toBeInTheDocument()
    })
  })

  it('7. Nút Luận giải lại đưa form về trạng thái ban đầu và tắt loading', async () => {
    vi.mocked(divinationApi.postInterpret).mockResolvedValueOnce(mockSuccessResponse)

    render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /nhờ trợ lý luận giải/i }))

    await waitFor(() => {
      expect(screen.getByText('Luận giải lại với câu hỏi khác')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /luận giải lại với câu hỏi khác/i }))

    // Form ban đầu hiển thị lại
    expect(screen.getByRole('button', { name: /nhờ trợ lý luận giải/i })).toBeInTheDocument()
    expect(screen.queryByText('1. Phân Tích Thể Dụng')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('8. Unmount component trong lúc đang request sẽ abort signal an toàn', () => {
    let capturedSignal: AbortSignal | undefined
    vi.mocked(divinationApi.postInterpret).mockImplementation((_req, signal) => {
      capturedSignal = signal
      return new Promise(() => {})
    })

    const { unmount } = render(
      <DichSuPanel
        caseId="case-test-01"
        userLevel="NOVICE"
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /nhờ trợ lý luận giải/i }))

    expect(capturedSignal).toBeDefined()
    expect(capturedSignal?.aborted).toBe(false)

    unmount()

    expect(capturedSignal?.aborted).toBe(true)
  })
})

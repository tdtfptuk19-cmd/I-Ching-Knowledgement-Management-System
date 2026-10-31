import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StrategyModal, extractSection3 } from '../StrategyModal'

describe('extractSection3 Utility', () => {
  it('1. Trích xuất chính xác từ văn bản chuẩn Fallback Executive Dossier', () => {
    const markdown = `## 1. Tổng quan cơ duyên Thể Dụng (Nhận định Cục diện & Vị thế)
Nội dung phần 1.

## 2. Quá trình chuyển hóa (Diễn tiến Thời cuộc: Quẻ Hỗ → Quẻ Biến)
Nội dung phần 2.

## 3. Chiến Lược Tu Thân & Xu Cát Tị Hung (Kế sách Hành động Chiến lược)
- Kế sách chủ động (Go): Nắm bắt cơ duyên thuận ứng thiên thời. [Ngũ hành·THE_DUNG_MAIN]
- Lằn ranh đỏ phòng ngừa (Stop/Mitigation): Cẩn trọng quan sát. [Ngũ hành·THE_UPPER_NUCLEAR]
- Nguyên tắc giữ vững nội lực (Tu thân): Kiên định trau dồi đức hạnh. [Ngũ hành·THE_TRANSFORMED_DUNG]

Quẻ chỉ là tấm gương soi, vận mệnh nằm ở việc tu thân và hành động của chính mình.`

    const result = extractSection3(markdown)
    expect(result).not.toBeNull()
    expect(result?.title).toBe('3. Chiến Lược Tu Thân & Xu Cát Tị Hung (Kế sách Hành động Chiến lược)')
    expect(result?.content).toContain('- Kế sách chủ động (Go): Nắm bắt cơ duyên')
    expect(result?.content).toContain('Quẻ chỉ là tấm gương soi, vận mệnh nằm ở việc tu thân')
    expect(result?.content).not.toContain('Nội dung phần 1.')
    expect(result?.content).not.toContain('Nội dung phần 2.')
  })

  it('2. Trích xuất từ tiêu đề H3 hoặc tên biến thể', () => {
    const markdown = `### 1. Phân Tích Thể Dụng
Nội dung 1.
### 2. Quá Trình Biến Hóa
Nội dung 2.
### 3. Kế Sách Tu Thân
Kiên định giữ đạo chính.`

    const result = extractSection3(markdown)
    expect(result).not.toBeNull()
    expect(result?.title).toBe('3. Kế Sách Tu Thân')
    expect(result?.content).toBe('Kiên định giữ đạo chính.')
  })

  it('3. Trả về null khi văn bản rỗng hoặc không có phần 3', () => {
    expect(extractSection3('')).toBeNull()
    expect(extractSection3('Chỉ có văn bản bình thường không có tiêu đề.')).toBeNull()
  })
})

describe('StrategyModal Component', () => {
  it('1. Không render gì khi isOpen = false', () => {
    const onClose = vi.fn()
    render(
      <StrategyModal
        isOpen={false}
        onClose={onClose}
        title="3. Chiến Lược Tu Thân"
        content="Nội dung kế sách"
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('2. Render đầy đủ khi isOpen = true, hiển thị đúng tiêu đề, nội dung và quẻ', () => {
    const onClose = vi.fn()
    render(
      <StrategyModal
        isOpen={true}
        onClose={onClose}
        title="3. Chiến Lược Tu Thân & Xu Cát Tị Hung (Kế sách Hành động Chiến lược)"
        content="- Kế sách chủ động (Go): Tiến bước thận trọng."
        hexagramName="Thuần Càn"
        topic="CAREER"
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Kế Sách Hành Động Chiến Lược · Xu Cát Tị Hung')).toBeInTheDocument()
    expect(screen.getByText('3. Chiến Lược Tu Thân & Xu Cát Tị Hung (Kế sách Hành động Chiến lược)')).toBeInTheDocument()
    expect(screen.getByText('Quẻ Thuần Càn')).toBeInTheDocument()
    expect(screen.getByText('Chủ đề: CAREER')).toBeInTheDocument()
    expect(screen.getByText(/Tiến bước thận trọng/i)).toBeInTheDocument()
  })

  it('3. Đóng modal khi nhấn phím Escape', () => {
    const onClose = vi.fn()
    render(
      <StrategyModal
        isOpen={true}
        onClose={onClose}
        title="3. Chiến Lược Tu Thân"
        content="Nội dung"
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('4. Bấm nút Xem toàn bộ 3 phần bài luận giải gọi onViewFullAnalysis', () => {
    const onClose = vi.fn()
    const onViewFullAnalysis = vi.fn()
    render(
      <StrategyModal
        isOpen={true}
        onClose={onClose}
        title="3. Chiến Lược Tu Thân"
        content="Nội dung"
        onViewFullAnalysis={onViewFullAnalysis}
      />
    )

    const viewFullBtn = screen.getByRole('button', { name: /xem toàn bộ 3 phần bài luận giải/i })
    fireEvent.click(viewFullBtn)

    expect(onViewFullAnalysis).toHaveBeenCalledTimes(1)
  })
})

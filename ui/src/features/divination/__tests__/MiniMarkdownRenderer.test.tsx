import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MiniMarkdownRenderer } from '../MiniMarkdownRenderer'

describe('MiniMarkdownRenderer: Bộ kết xuất Markdown an toàn qua React Elements', () => {
  it('An toàn XSS: chuỗi chứa thẻ script được hiển thị dạng văn bản tĩnh thuần túy', () => {
    const malicious = '<script>alert("xss")</script>'
    const { container } = render(<MiniMarkdownRenderer text={malicious} />)

    // Không tồn tại thẻ script trong DOM
    expect(container.querySelector('script')).toBeNull()
    // Nội dung được hiển thị dưới dạng văn bản tĩnh
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
  })

  it('Kết xuất đúng Tiêu đề H2 (## ) thành thẻ h3', () => {
    const md = '## 1. Tổng quan cơ duyên Thể Dụng'
    render(<MiniMarkdownRenderer text={md} />)

    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('1. Tổng quan cơ duyên Thể Dụng')
  })

  it('Kết xuất chữ đậm và thẻ căn cứ lồng nhau', () => {
    const md = '**Kết luận tổng hợp: BÌNH HÒA [Tổng hợp·MAI_HOA_THE_DUNG]**'
    const { container } = render(<MiniMarkdownRenderer text={md} />)

    const strong = container.querySelector('strong')
    expect(strong).toBeInTheDocument()
    expect(strong).toHaveTextContent('Kết luận tổng hợp: BÌNH HÒA')

    const citation = container.querySelector('span')
    expect(citation).toBeInTheDocument()
    expect(citation).toHaveTextContent('[Tổng hợp·MAI_HOA_THE_DUNG]')
  })

  it('Kết xuất danh sách gạch đầu dòng và danh sách có thứ tự', () => {
    const md = `
- Mục gạch đầu dòng 1
- Mục gạch đầu dòng 2
1. Mục thứ tự 1
2. Mục thứ tự 2
`
    const { container } = render(<MiniMarkdownRenderer text={md} />)

    const listItems = container.querySelectorAll('li')
    expect(listItems).toHaveLength(4)
    expect(listItems[0]).toHaveTextContent('Mục gạch đầu dòng 1')
    expect(listItems[2]).toHaveTextContent('Mục thứ tự 1')
  })

  it('Xử lý an toàn khi text rỗng', () => {
    const { container } = render(<MiniMarkdownRenderer text="" />)
    expect(container.firstChild).toBeNull()
  })

  it('Làm sạch thẻ căn cứ: render pill thân thiện và bật popover giải thích khi click', async () => {
    const md = 'Quẻ chủ có thế Thể Dụng tương sinh [Ngũ hành·THE_DUNG_MAIN]. Tuân thủ [Luật·PB_CAREER_SINH_NHAP].'
    render(<MiniMarkdownRenderer text={md} />)

    // Hiển thị pill thân thiện thay vì mã thô cứng nhắc
    const elementPill = screen.getByRole('button', { name: /Căn cứ: Ngũ hành Quẻ Chủ/i })
    expect(elementPill).toBeInTheDocument()

    const careerPill = screen.getByRole('button', { name: /Căn cứ: Luật Sự Nghiệp/i })
    expect(careerPill).toBeInTheDocument()

    // Ban đầu popover chưa mở
    expect(screen.queryByRole('dialog')).toBeNull()

    // Click vào pill Ngũ hành để mở popover
    fireEvent.click(elementPill)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Ngũ Hành Thể Dụng (Quẻ Chủ)')
    expect(dialog).toHaveTextContent('Mã kỹ thuật: [Ngũ hành·THE_DUNG_MAIN]')
    expect(dialog).toHaveTextContent(/Quan hệ sinh khắc trực tiếp giữa Thể quái/i)

    // Bấm nút đóng (X) trong popover
    const closeBtn = screen.getByRole('button', { name: /Đóng bảng giải thích/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

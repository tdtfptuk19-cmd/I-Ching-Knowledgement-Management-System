import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SearchPage } from '../SearchPage'
import { AuthProvider } from '@/auth/AuthContext'

function renderSearchComponent(initialRoute = '/search') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('SearchPage: UI gửi đúng tham số và render đúng dữ liệu mock', () => {
  it('Tìm kiếm không dấu (can) trả về kết quả quẻ Thuần Càn', async () => {
    renderSearchComponent('/search?q=can')

    await waitFor(() => {
      expect(screen.getAllByText(/Quẻ #1: Thuần Càn/i).length).toBeGreaterThan(0)
    })

    // Xác nhận hiển thị loại nội dung kinh văn
    expect(screen.getAllByText('Kinh Văn Cổ Điển').length).toBeGreaterThan(0)
  })

  it('Tìm kiếm có dấu (càn) đối chiếu mềm chính xác', async () => {
    renderSearchComponent('/search?q=càn')

    await waitFor(() => {
      expect(screen.getAllByText(/Quẻ #1: Thuần Càn/i).length).toBeGreaterThan(0)
    })
  })

  it('Hỗ trợ tìm kiếm theo Chữ Hán nguyên tác (EXPERT mode)', async () => {
    renderSearchComponent('/search?q=乾&user_level=EXPERT')

    await waitFor(() => {
      expect(screen.getAllByText(/Quẻ #1: Thuần Càn/i).length).toBeGreaterThan(0)
    })

    // Ở chế độ EXPERT, chữ Hán nguyên tác được hiển thị
    const hanLabels = screen.getAllByText(/Hán tự:/i)
    expect(hanLabels.length).toBeGreaterThan(0)
  })

  it('Trạng thái rỗng (Empty State) khi không có kết quả, hiển thị hướng dẫn gợi ý từ khóa', async () => {
    renderSearchComponent('/search?q=empty')

    await waitFor(() => {
      expect(screen.getByText(/Không tìm thấy kết quả nào phù hợp/i)).toBeInTheDocument()
    })

    // Có gợi ý cách tìm kiếm không dấu
    expect(screen.getByText(/Hệ thống hỗ trợ cơ chế bỏ dấu tiếng Việt tự động/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đặt lại toàn bộ bộ lọc/i })).toBeInTheDocument()
  })

  it('Debounce ô nhập: tự động cập nhật sau thời gian trễ', async () => {
    renderSearchComponent('/search')

    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()

    // Nhập từ khóa
    await userEvent.type(input, 'can')

    // Chờ debounce 300ms và fetch dữ liệu
    await waitFor(
      () => {
        expect(screen.getAllByText(/Quẻ #1: Thuần Càn/i).length).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )
  })

  it('Lọc theo chủ đề và quái cập nhật bộ lọc đa chiều', async () => {
    renderSearchComponent('/search')

    // Chọn chủ đề SỰ NGHIỆP
    const topicSelect = screen.getByLabelText(/Chủ Đề Áp Dụng/i)
    await userEvent.selectOptions(topicSelect, 'CAREER')

    expect(topicSelect).toHaveValue('CAREER')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HexagramDetailPage } from '../HexagramDetailPage'
import { AuthProvider } from '@/auth/AuthContext'
import { AppRole } from '@/i18n/roles'

function renderComponent(initialRoute = '/hexagrams/1', role: AppRole = 'ADMIN') {
  localStorage.setItem('kinhdich_simulated_role', role)

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
            <Route path="/hexagrams/:id" element={<HexagramDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('HexagramDetailPage: Cá nhân hóa tri thức 3 cấp độ (Wiig 1993) & Tuân thủ RBAC', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Cấp độ NOVICE: Ẩn toàn bộ chữ Hán và trường kiểm toán, hiển thị bản dịch tiếng Việt', async () => {
    renderComponent('/hexagrams/1', 'ADMIN')

    // Chờ tải xong dữ liệu
    await waitFor(() => {
      expect(screen.getByText('Thuần Càn')).toBeInTheDocument()
    })

    // Chọn tab NOVICE
    const noviceBtn = screen.getByRole('button', { name: 'NOVICE' })
    await userEvent.click(noviceBtn)

    // Kiểm tra: Có bản dịch tiếng Việt
    expect(screen.getByText(/Kiền là cội gốc muôn loài/i)).toBeInTheDocument()

    // Kiểm tra: Không hiển thị chữ Hán trong kinh văn
    expect(screen.queryByText('象曰天行健君子以自疆不息')).not.toBeInTheDocument()

    // Kiểm tra: Không hiển thị trường kiểm toán của chuyên gia
    expect(screen.queryByText(/Thẩm định: TruongNhom_IS1906/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/p\. 16/i)).not.toBeInTheDocument()
  })

  it('Cấp độ EXPERT: Hiển thị trọn vẹn Chữ Hán nguyên tác, nguồn gốc và chỉ số kiểm toán', async () => {
    renderComponent('/hexagrams/1', 'ADMIN')

    await waitFor(() => {
      expect(screen.getByText('Thuần Càn')).toBeInTheDocument()
    })

    // Chọn tab EXPERT
    const expertBtn = screen.getByRole('button', { name: 'EXPERT' })
    await userEvent.click(expertBtn)

    // Chờ cập nhật view EXPERT
    await waitFor(() => {
      expect(screen.getByText('乾為天')).toBeInTheDocument()
    })

    // Kiểm tra hiển thị nguyên tác chữ Hán
    expect(screen.getByText('象曰天行健君子以自疆不息')).toBeInTheDocument()

    // Kiểm tra hiển thị thông tin kiểm toán học thuật
    const verifiedBadges = screen.getAllByText(/Thẩm định: TruongNhom_IS1906/i)
    expect(verifiedBadges.length).toBeGreaterThan(0)
    expect(screen.getAllByText(/p\. 16/i).length).toBeGreaterThan(0)
  })

  it('Cấp độ PRACTITIONER: Hiển thị cấu trúc quẻ và bản dịch đầy đủ, ẩn trường kiểm toán', async () => {
    renderComponent('/hexagrams/1', 'ADMIN')

    await waitFor(() => {
      expect(screen.getByText('Thuần Càn')).toBeInTheDocument()
    })

    // Chọn tab PRACTITIONER
    const pracBtn = screen.getByRole('button', { name: 'PRACTITIONER' })
    await userEvent.click(pracBtn)

    // Chờ view PRACTITIONER
    await waitFor(() => {
      expect(screen.getByText(/Quái Thượng/i)).toBeInTheDocument()
    })

    // Có cấu trúc Quái Thượng và Quái Hạ
    expect(screen.getByText(/Quái Thượng/i)).toBeInTheDocument()
    expect(screen.getByText(/Quái Hạ/i)).toBeInTheDocument()

    // Ẩn trường kiểm toán chuyên sâu
    expect(screen.queryByText(/Thẩm định: TruongNhom_IS1906/i)).not.toBeInTheDocument()
  })

  it('RBAC Guard: Vai trò NOVICE không được chọn EXPERT (chỉ có nút NOVICE)', async () => {
    renderComponent('/hexagrams/1', 'NOVICE')

    await waitFor(() => {
      expect(screen.getByText('Thuần Càn')).toBeInTheDocument()
    })

    // Nút NOVICE tồn tại
    expect(screen.getByRole('button', { name: 'NOVICE' })).toBeInTheDocument()
    // Không có nút EXPERT hay PRACTITIONER
    expect(screen.queryByRole('button', { name: 'EXPERT' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'PRACTITIONER' })).not.toBeInTheDocument()
  })

  it('RBAC Guard: Vai trò PRACTITIONER chỉ được chọn NOVICE và PRACTITIONER (không có nút EXPERT)', async () => {
    renderComponent('/hexagrams/1', 'PRACTITIONER')

    await waitFor(() => {
      expect(screen.getByText('Thuần Càn')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'NOVICE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PRACTITIONER' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'EXPERT' })).not.toBeInTheDocument()
  })
})

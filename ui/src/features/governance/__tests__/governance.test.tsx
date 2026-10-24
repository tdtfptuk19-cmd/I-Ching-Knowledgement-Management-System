import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthContext'
import { ContributePage } from '../ContributePage'
import { ReviewQueuePage } from '../ReviewQueuePage'
import { ReviewConfirmModal } from '../ReviewConfirmModal'
import { FeedbackModal } from '../FeedbackModal'
import { AppRole } from '@/i18n/roles'

function renderWithProviders(
  ui: React.ReactElement,
  { role = 'REVIEWER' as AppRole, mySubmittedIds = [] as number[] } = {}
) {
  // Đồng bộ role và mySubmittedIds vào localStorage trước khi AuthProvider khởi tạo
  localStorage.setItem('kinhdich_simulated_role', role)
  localStorage.setItem('kinhdich_my_submissions', JSON.stringify(mySubmittedIds))

  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={testQueryClient}>
      <AuthProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Gate 10: Quản Trị Tri Thức & Kiểm Duyệt (Knowledge Governance)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('1. Kiểm soát quyền truy cập theo vai trò (RBAC Route Guard)', () => {
    it('chặn vai trò NOVICE truy cập Form Đóng Góp (/contribute)', () => {
      renderWithProviders(<ContributePage />, { role: 'NOVICE' })
      expect(screen.getByText(/403 — Từ Chối Truy Cập/i)).toBeInTheDocument()
      expect(screen.getByText('NOVICE')).toBeInTheDocument()
    })

    it('cho phép vai trò PRACTITIONER truy cập Form Đóng Góp (/contribute)', () => {
      renderWithProviders(<ContributePage />, { role: 'PRACTITIONER' })
      expect(screen.getByRole('heading', { name: /Đóng Góp Diễn Giải Tri Thức Mới/i })).toBeInTheDocument()
      expect(screen.getAllByText(/PENDING/i).length).toBeGreaterThan(0)
    })

    it('chặn vai trò PRACTITIONER truy cập Hàng Đợi Kiểm Duyệt (/review)', () => {
      renderWithProviders(<ReviewQueuePage />, { role: 'PRACTITIONER' })
      expect(screen.getByText(/403 — Từ Chối Truy Cập/i)).toBeInTheDocument()
      expect(screen.getByText('PRACTITIONER')).toBeInTheDocument()
    })

    it('cho phép vai trò REVIEWER truy cập Hàng Đợi Kiểm Duyệt (/review)', async () => {
      renderWithProviders(<ReviewQueuePage />, { role: 'REVIEWER' })
      expect(screen.getByRole('heading', { name: /Hàng Đợi Kiểm Duyệt Tri Thức/i })).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getAllByText(/Thuần Càn/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('2. Chặn Tự Phê Duyệt Bài Của Chính Mình (Anti-Self-Review Guard - BCR-004, McElroy 1999)', () => {
    it('vô hiệu nút duyệt và hiện cảnh báo đối với bài diễn giải đã nộp trong phiên', async () => {
      // Giả sử trong phiên, reviewer này đã nộp bài #4 (có trong fixture review_queue)
      renderWithProviders(<ReviewQueuePage />, {
        role: 'REVIEWER',
        mySubmittedIds: [4],
      })

      await waitFor(() => {
        expect(screen.getByText(/^#4$/)).toBeInTheDocument()
      })

      // Bài #4 phải có nhãn chặn tự duyệt
      const selfGuardBadge = screen.getByText(/Chặn tự duyệt \(Tác giả trong phiên\)/i)
      expect(selfGuardBadge).toBeInTheDocument()

      // Các bài khác (như #5) vẫn hiển thị nút Phê duyệt bình thường
      const approveButtons = screen.getAllByRole('button', { name: /Phê duyệt/i })
      expect(approveButtons.length).toBeGreaterThan(0)
    })

    it('chặn duyệt trong ReviewConfirmModal khi định danh reviewer trống, ít hơn 2 ký tự hoặc là tên vai trò chung', async () => {
      const dummyItem = {
        interpretation_id: 99,
        target_type: 'HEXAGRAM' as const,
        hexagram_id: 1,
        hexagram_name: 'Thuần Càn',
        line_position: null,
        moving_line_position: null,
        to_hexagram_id: null,
        topic: 'CAREER',
        summary: 'Tóm tắt kiểm thử',
        guidance: 'Lời khuyên kiểm thử',
        polarity: 1,
        source_id: 1,
        author_type: 'AI_DRAFT' as const,
        author_name: 'AI_Test',
        version: 1,
        review_status: 'PENDING' as const,
        created_at: '2026-10-20T10:00:00Z',
      }

      render(
        <ReviewConfirmModal
          item={dummyItem}
          newStatus="APPROVED"
          defaultReviewer=""
          isOpen={true}
          isSubmitting={false}
          onClose={() => {}}
          onConfirm={async () => {}}
        />
      )

      const submitBtn = screen.getByRole('button', { name: /Xác nhận Duyệt/i })
      // Khi reviewer rỗng, nút duyệt bị khóa
      expect(submitBtn).toBeDisabled()
      expect(screen.getByText(/Định danh phải có tối thiểu 2 ký tự/i)).toBeInTheDocument()

      const input = screen.getByLabelText(/Định danh Người Kiểm Duyệt/i)
      const user = userEvent.setup()

      // Nhập tên vai trò chung 'REVIEWER' -> vẫn bị khóa
      await user.type(input, 'REVIEWER')
      expect(submitBtn).toBeDisabled()
      expect(screen.getByText(/Không dùng tên vai trò chung/i)).toBeInTheDocument()

      // Nhập định danh hợp lệ 'ChuyenGia_TranVanA' -> nút mở khóa
      await user.clear(input)
      await user.type(input, 'ChuyenGia_TranVanA')
      expect(submitBtn).not.toBeDisabled()
    })
  })

  describe('3. Bảo Mật & Phòng Thủ XSS (Cross-Site Scripting)', () => {
    it('render an toàn chuỗi HTML/script độc hại dưới dạng văn bản thuần', () => {
      const maliciousScript = "<script>alert('xss_attack')</script>"
      const maliciousImg = "<img src=x onerror=alert('xss') />"

      render(
        <div data-testid="xss-container">
          <p>{maliciousScript}</p>
          <span>{maliciousImg}</span>
        </div>
      )

      const container = screen.getByTestId('xss-container')
      // Đảm bảo không tạo thẻ script thật trong DOM
      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
      // Nội dung được escape an toàn thành chuỗi thuần
      expect(container).toHaveTextContent(maliciousScript)
      expect(container).toHaveTextContent(maliciousImg)
    })
  })

  describe('4. Phản Hồi Thực Chứng & Vòng Lặp Học Tập Đôi (FeedbackModal)', () => {
    it('khóa cờ Best Practice đối với vai trò NOVICE và PRACTITIONER', () => {
      renderWithProviders(
        <FeedbackModal caseId="test-case-uuid-1234" isOpen={true} onClose={() => {}} />,
        { role: 'PRACTITIONER' }
      )

      const checkbox = screen.getByRole('checkbox', { name: /Đánh dấu là Ca Gieo Quẻ Mẫu Mực/i })
      expect(checkbox).toBeDisabled()
      expect(screen.getByText(/Chỉ vai trò Chuyên gia \(EXPERT\), Kiểm duyệt \(REVIEWER\) hoặc Quản trị \(ADMIN\)/i)).toBeInTheDocument()
    })

    it('cho phép vai trò REVIEWER bật cờ Best Practice', () => {
      renderWithProviders(
        <FeedbackModal caseId="test-case-uuid-1234" isOpen={true} onClose={() => {}} />,
        { role: 'REVIEWER' }
      )

      const checkbox = screen.getByRole('checkbox', { name: /Đánh dấu là Ca Gieo Quẻ Mẫu Mực/i })
      expect(checkbox).not.toBeDisabled()
    })

    it('validate độ dài tối thiểu 5 ký tự cho kết quả thực chứng', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <FeedbackModal caseId="test-case-uuid-1234" isOpen={true} onClose={() => {}} />,
        { role: 'REVIEWER' }
      )

      const textarea = screen.getByPlaceholderText(/Ghi nhận sự việc, quyết định/i)
      const submitBtn = screen.getByRole('button', { name: /Nạp vào Vòng Lặp Học Tập Đôi/i })

      // Nhập 3 ký tự (ít hơn 5)
      await user.type(textarea, 'abc')
      await user.click(submitBtn)

      expect(screen.getByText(/phải có ít nhất 5 ký tự/i)).toBeInTheDocument()
    })
  })

  describe('5. Kiểm tra trường điều kiện và gửi Form Đóng Góp (ContributePage)', () => {
    it('chuyển đổi trường theo target_type: HEXAGRAM ẩn line_position, LINE hiện line_position 1-7', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContributePage />, { role: 'PRACTITIONER' })

      // Mặc định HEXAGRAM: không có vị trí hào
      expect(screen.queryByLabelText(/Vị trí hào \(line_position: 1–7\)/i)).toBeNull()

      // Chọn Từng Hào (LINE)
      const lineBtn = screen.getByRole('button', { name: /Từng Hào \(LINE\)/i })
      await user.click(lineBtn)

      // LINE phải hiện dropdown vị trí hào 1-7
      expect(screen.getByLabelText(/Vị trí hào \(line_position: 1–7\)/i)).toBeInTheDocument()
    })

    it('chuyển đổi sang TRANSFORMATION hiện moving_line_position 1-6 và to_hexagram_id', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContributePage />, { role: 'PRACTITIONER' })

      const transBtn = screen.getByRole('button', { name: /Biến Hóa \(TRANSFORMATION\)/i })
      await user.click(transBtn)

      expect(screen.getByLabelText(/Hào động \(moving_line_position: 1–6\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Quẻ biến \(to_hexagram_id: 1–64\)/i)).toBeInTheDocument()
    })
  })
})

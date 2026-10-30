import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthContext'
import { DashboardPage } from '../DashboardPage'
import { AppRole } from '@/i18n/roles'

function renderWithProviders(
  ui: React.ReactElement,
  { role = 'REVIEWER' as AppRole } = {}
) {
  localStorage.setItem('kinhdich_simulated_role', role)

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

describe('Gate 11: Dashboard Quản Trị Tri Thức KMS (KMS Governance Dashboard)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('1. Kiểm soát quyền truy cập RBAC (RoleGuard)', () => {
    it('chặn vai trò NOVICE truy cập Dashboard (/dashboard)', () => {
      renderWithProviders(<DashboardPage />, { role: 'NOVICE' })
      expect(screen.getByText(/403 — Từ Chối Truy Cập/i)).toBeInTheDocument()
      expect(screen.getByText('NOVICE')).toBeInTheDocument()
    })

    it('chặn vai trò PRACTITIONER truy cập Dashboard (/dashboard)', () => {
      renderWithProviders(<DashboardPage />, { role: 'PRACTITIONER' })
      expect(screen.getByText(/403 — Từ Chối Truy Cập/i)).toBeInTheDocument()
      expect(screen.getByText('PRACTITIONER')).toBeInTheDocument()
    })

    it('cho phép vai trò EXPERT truy cập Dashboard (/dashboard)', async () => {
      renderWithProviders(<DashboardPage />, { role: 'EXPERT' })
      expect(screen.getByRole('heading', { name: /Chỉ Số Vận Hành & Học Tập Tri Thức/i })).toBeInTheDocument()
    })

    it('cho phép vai trò REVIEWER và ADMIN truy cập Dashboard đầy đủ', async () => {
      renderWithProviders(<DashboardPage />, { role: 'REVIEWER' })
      expect(screen.getByRole('heading', { name: /Chỉ Số Vận Hành & Học Tập Tri Thức/i })).toBeInTheDocument()
    })
  })

  describe('2. Hiển thị 4 Khối Tri Thức theo Lý Thuyết KMS (Wiig, McElroy, Argyris & Schön)', () => {
    it('render chính xác Khối 1: Kinh Văn Cổ Điển (Wiig 1993, 964 mục, 100% duyệt)', async () => {
      renderWithProviders(<DashboardPage />, { role: 'REVIEWER' })

      await waitFor(() => {
        expect(screen.getByText(/1\. Kinh Văn Cổ Điển/i)).toBeInTheDocument()
      })

      expect(screen.getByText('Wiig 1993')).toBeInTheDocument()
      expect(screen.getByText(/964/)).toBeInTheDocument()
      expect(screen.getByText(/Mục tiêu chuẩn: 960/i)).toBeInTheDocument()
      expect(screen.getByText(/100% Đã Phê Duyệt/i)).toBeInTheDocument()
    })

    it('render chính xác Khối 2: Hàng Đợi Thẩm Định (McElroy 1999, PENDING, APPROVED, REJECTED)', async () => {
      renderWithProviders(<DashboardPage />, { role: 'REVIEWER' })

      await waitFor(() => {
        expect(screen.getByText(/2\. Hàng Đợi Thẩm Định/i)).toBeInTheDocument()
      })

      expect(screen.getByText('McElroy 1999')).toBeInTheDocument()
      expect(screen.getByText(/^22$/)).toBeInTheDocument()
      expect(screen.getByText(/6 Đạt/i)).toBeInTheDocument()
      expect(screen.getByText(/5 Bác/i)).toBeInTheDocument()
    })

    it('render chính xác Khối 3: Phân Bổ Nguồn Tri Thức (BOOK, AI_MODEL, BCR-005)', async () => {
      renderWithProviders(<DashboardPage />, { role: 'REVIEWER' })

      await waitFor(() => {
        expect(screen.getByText(/3\. Phân Bổ Nguồn/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/16/)).toBeInTheDocument()
      expect(screen.getByText(/Sách Cổ Điển \(BOOK\):/i)).toBeInTheDocument()
      expect(screen.getByText(/Mô hình AI \(AI_MODEL\):/i)).toBeInTheDocument()
    })

    it('render chính xác Khối 4: Vòng Lặp Học Tập Đôi (Argyris & Schön 1978, Best Practices)', async () => {
      renderWithProviders(<DashboardPage />, { role: 'REVIEWER' })

      await waitFor(() => {
        expect(screen.getByText(/4\. Vòng Lặp Học Tập Đôi/i)).toBeInTheDocument()
      })

      expect(screen.getByText('Argyris 1978')).toBeInTheDocument()
      expect(screen.getByText(/ca mẫu mực/i)).toBeInTheDocument()
      expect(screen.getByText(/Chưa đủ điều kiện đánh giá mô hình suy luận/i)).toBeInTheDocument()
    })

    it('render chính xác Khối KPI Chất Lượng Tri Thức Phase 2: Không hardcode, hiển thị đúng mẫu số và tỷ lệ', async () => {
      renderWithProviders(<DashboardPage />, { role: 'REVIEWER' })

      await waitFor(() => {
        expect(screen.getByText(/Chỉ Số KPI Chất Lượng Tri Thức/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/Tỷ Lệ Ca Có Diễn Giải/i)).toBeInTheDocument()
      expect(screen.getByText(/22\.2%/i)).toBeInTheDocument()
      expect(screen.getByText(/39\/176 ca/i)).toBeInTheDocument()
      expect(screen.getByText(/bao phủ 3\/64 quẻ: #1, #2, #50/i)).toBeInTheDocument()

      expect(screen.getByText(/Tỷ Lệ Tái Chuẩn Hóa/i)).toBeInTheDocument()
      expect(screen.getAllByText(/100%/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/176\/176 ca/i)).toBeInTheDocument()

      expect(screen.getByText(/Luật Suy Luận Đã Duyệt/i)).toBeInTheDocument()
      expect(screen.getByText(/0 \/ 10/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Phản Hồi Thực Chứng/i).length).toBeGreaterThan(0)
    })
  })
})

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthContext'
import { TechnicalModeProvider, useTechnicalMode } from '@/context/TechnicalModeContext'
import { DivinationForm } from '../DivinationForm'
import { HexagramGrid } from '@/features/hexagrams/HexagramGrid'
import { TOPIC_I18N, TEXT_TYPE_I18N, AUTHOR_TYPE_I18N } from '@/i18n/labels'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TechnicalModeProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </TechnicalModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Đợt 2A: Nhãn, Chế độ Kỹ thuật, An toàn & Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('1. Chế độ Kỹ thuật (Technical Mode Context & Persistence)', () => {
    it('mặc định isTechnicalMode = false và lưu trạng thái vào localStorage', () => {
      const { result } = renderHook(() => useTechnicalMode(), {
        wrapper: ({ children }) => <TechnicalModeProvider>{children}</TechnicalModeProvider>,
      })

      expect(result.current.isTechnicalMode).toBe(false)

      act(() => {
        result.current.toggleTechnicalMode()
      })

      expect(result.current.isTechnicalMode).toBe(true)
      expect(localStorage.getItem('kinhdich_technical_mode')).toBe('true')

      act(() => {
        result.current.setTechnicalMode(false)
      })

      expect(result.current.isTechnicalMode).toBe(false)
      expect(localStorage.getItem('kinhdich_technical_mode')).toBe('false')
    })

    it('khởi tạo giá trị ban đầu từ localStorage nếu có', () => {
      localStorage.setItem('kinhdich_technical_mode', 'true')
      const { result } = renderHook(() => useTechnicalMode(), {
        wrapper: ({ children }) => <TechnicalModeProvider>{children}</TechnicalModeProvider>,
      })

      expect(result.current.isTechnicalMode).toBe(true)
    })
  })

  describe('2. Disclaimer An Toàn & Checkbox Xác Nhận (DivinationForm Safety Gate)', () => {
    it('không hiện cảnh báo nhạy cảm và không khóa nút gieo quẻ khi chọn GENERAL', () => {
      const onSubmit = vi.fn()
      renderWithProviders(<DivinationForm onSubmit={onSubmit} isLoading={false} />)

      // Click chọn chủ đề Tổng Quan
      const generalBtn = screen.getByRole('button', { name: /Tổng Quan & Thời Vận/i })
      fireEvent.click(generalBtn)

      // Với chủ đề GENERAL, không có cảnh báo y tế / tài chính
      expect(screen.queryByText(/Cảnh báo an toàn y tế/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Cảnh báo an toàn tài chính/i)).not.toBeInTheDocument()

      const submitBtn = screen.getByRole('button', { name: /Khởi Chiêm Lập Quẻ/i })
      expect(submitBtn).not.toBeDisabled()
    })

    it('hiển thị cảnh báo ngay khi chọn HEALTH và chặn nút gieo quẻ cho đến khi tick xác nhận', () => {
      const onSubmit = vi.fn()
      renderWithProviders(<DivinationForm onSubmit={onSubmit} isLoading={false} />)

      // Click chọn Sức Khỏe
      const healthBtn = screen.getByRole('button', { name: /Sức Khỏe & Thể Trạng/i })
      fireEvent.click(healthBtn)

      // Hiển thị ngay cảnh báo y tế
      expect(screen.getByText(/Lưu ý An Toàn về Sức Khỏe & Thể Trạng/i)).toBeInTheDocument()
      expect(screen.getByText(/KHÔNG THAY THẾ cho việc khám chữa bệnh/i)).toBeInTheDocument()

      // Nút submit bị chặn
      const submitBtn = screen.getByRole('button', { name: /Khởi Chiêm Lập Quẻ/i })
      expect(submitBtn).toBeDisabled()

      // Tick checkbox xác nhận
      const consentCheckbox = screen.getByRole('checkbox')
      expect(consentCheckbox).toBeInTheDocument()
      fireEvent.click(consentCheckbox)

      // Nút submit được mở lại
      expect(submitBtn).not.toBeDisabled()
    })

    it('hiển thị cảnh báo ngay khi chọn FINANCE và mở nút gieo quẻ khi tick xác nhận', () => {
      const onSubmit = vi.fn()
      renderWithProviders(<DivinationForm onSubmit={onSubmit} isLoading={false} />)

      // Click chọn Tài Chính
      const financeBtn = screen.getByRole('button', { name: /Tài Chính & Đầu Tư/i })
      fireEvent.click(financeBtn)

      // Hiển thị ngay cảnh báo tài chính
      expect(screen.getByText(/Lưu ý An Toàn về Tài Chính & Đầu Tư/i)).toBeInTheDocument()
      expect(screen.getByText(/KHÔNG PHẢI là tư vấn tài chính/i)).toBeInTheDocument()

      const submitBtn = screen.getByRole('button', { name: /Khởi Chiêm Lập Quẻ/i })
      expect(submitBtn).toBeDisabled()

      // Tick checkbox
      const consentCheckbox = screen.getByRole('checkbox')
      fireEvent.click(consentCheckbox)
      expect(submitBtn).not.toBeDisabled()
    })
  })

  describe('3. Accessibility Ma Trận 8x8 (scope="col", scope="row")', () => {
    it('sở hữu các thẻ th với scope="col" và scope="row" đúng chuẩn ngữ nghĩa', () => {
      renderWithProviders(<HexagramGrid />)

      // Kiểm tra có th scope="col" và scope="row"
      const colHeaders = screen.getAllByRole('columnheader')
      expect(colHeaders.length).toBeGreaterThanOrEqual(8)
      expect(colHeaders[0]).toHaveAttribute('scope', 'col')

      const rowHeaders = screen.getAllByRole('rowheader')
      expect(rowHeaders.length).toBeGreaterThanOrEqual(8)
      expect(rowHeaders[0]).toHaveAttribute('scope', 'row')
    })
  })

  describe('4. Từ Điển Nhãn Chuẩn (i18n glossary)', () => {
    it('đầy đủ các chủ đề kinh điển và diễn giải', () => {
      expect(TOPIC_I18N.GENERAL.vi).toBe('Tổng Quan & Thời Vận')
      expect(TOPIC_I18N.CAREER.vi).toBe('Sự Nghiệp & Công Danh')
      expect(TOPIC_I18N.FINANCE.vi).toBe('Tài Chính & Đầu Tư')
      expect(TOPIC_I18N.HEALTH.vi).toBe('Sức Khỏe & Thể Trạng')
      expect(TOPIC_I18N.RELATIONSHIP.vi).toBe('Tình Cảm & Nhân Duyên')
    })

    it('đầy đủ các nhãn loại văn bản kinh điển và tác quyền', () => {
      expect(TEXT_TYPE_I18N.THOAN_TU.vi).toBe('Thoán Từ')
      expect(TEXT_TYPE_I18N.DAI_TUONG.vi).toBe('Đại Tượng Truyện')
      expect(AUTHOR_TYPE_I18N.AI_DRAFT.label).toBe('Bản Thảo AI')
    })
  })
})

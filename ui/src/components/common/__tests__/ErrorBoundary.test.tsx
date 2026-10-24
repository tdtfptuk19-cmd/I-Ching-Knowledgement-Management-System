import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../ErrorBoundary'

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Cố ý gây lỗi kiểm thử ErrorBoundary')
  }
  return <div>Nội dung bình thường</div>
}

describe('ErrorBoundary Component', () => {
  it('render nội dung con bình thường khi không có lỗi', () => {
    render(
      <ErrorBoundary level="route">
        <ProblemChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Nội dung bình thường')).toBeInTheDocument()
  })

  it('bắt lỗi cấp route và hiển thị giao diện tiếng Việt với nút thử lại', async () => {
    // Tắt console.error cho test này
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const user = userEvent.setup()
    const handleReset = vi.fn()

    const { rerender } = render(
      <ErrorBoundary level="route" onReset={handleReset}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Không thể tải nội dung phần này')).toBeInTheDocument()
    expect(screen.getByText('Cố ý gây lỗi kiểm thử ErrorBoundary')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i })
    expect(retryBtn).toBeInTheDocument()

    // Bấm thử lại
    await user.click(retryBtn)
    expect(handleReset).toHaveBeenCalled()

    // Khôi phục lại
    rerender(
      <ErrorBoundary level="route" onReset={handleReset}>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    )

    consoleSpy.mockRestore()
  })

  it('bắt lỗi cấp app và hiển thị màn hình sự cố toàn app', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary level="app">
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Đã xảy ra sự cố trong Cổng Tri Thức')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tải lại trang/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Về trang chủ/i })).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})

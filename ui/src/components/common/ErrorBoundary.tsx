import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home, ChevronDown } from 'lucide-react'
import { reportRuntimeError } from '@/utils/telemetry'

interface ErrorBoundaryProps {
  children: ReactNode
  level?: 'app' | 'route' | 'component'
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, showDetails: false }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
    reportRuntimeError(error, 'REACT_ERROR', errorInfo.componentStack || undefined)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { level = 'route', fallbackTitle, fallbackMessage } = this.props
    const isAppLevel = level === 'app'

    const title = fallbackTitle || (isAppLevel
      ? 'Đã xảy ra sự cố trong Cổng Tri Thức'
      : 'Không thể tải nội dung phần này')

    const message = fallbackMessage || (isAppLevel
      ? 'Hệ thống gặp sự cố không mong muốn khi kết xuất giao diện. Bạn có thể thử tải lại trang hoặc quay về trang chính.'
      : 'Đã xảy ra lỗi khi tải dữ liệu cho trang này. Vui lòng bấm thử lại hoặc kiểm tra lại đường truyền mạng.')

    if (isAppLevel) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#faf7f2] text-stone-900 flex flex-col items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {message}
              </p>
            </div>

            {this.state.error && (
              <div className="text-left border border-stone-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="w-full px-3 py-2 bg-stone-50 text-xs font-medium text-stone-700 flex items-center justify-between hover:bg-stone-100 transition"
                  aria-expanded={this.state.showDetails}
                >
                  <span>Chi tiết lỗi kỹ thuật</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      this.state.showDetails ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {this.state.showDetails && (
                  <div className="p-3 bg-stone-900 text-stone-100 font-mono text-[11px] overflow-x-auto max-h-40 leading-snug">
                    <div className="font-bold text-rose-400">{this.state.error.name}: {this.state.error.message}</div>
                    {this.state.error.stack && (
                      <pre className="text-stone-400 whitespace-pre-wrap mt-1 text-[10px]">
                        {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-50 font-medium text-xs sm:text-sm transition shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/'
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-medium text-xs sm:text-sm transition"
              >
                <Home className="w-4 h-4 text-stone-500" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="max-w-2xl mx-auto my-8 p-6 bg-white border border-rose-200 rounded-xl shadow-sm space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="font-serif font-bold text-base text-stone-900">{title}</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{message}</p>
          </div>
        </div>

        {this.state.error && (
          <div className="p-2.5 bg-stone-50 rounded border border-stone-200 text-xs font-mono text-stone-700">
            {this.state.error.message || 'Lỗi không xác định'}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-50 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            Quay lại trang chủ →
          </button>
        </div>
      </div>
    )
  }
}

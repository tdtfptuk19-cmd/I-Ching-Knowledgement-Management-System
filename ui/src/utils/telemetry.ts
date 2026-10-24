/**
 * Hệ thống giám sát cơ bản phía Client (Telemetry & Error Monitoring)
 * - Ghi nhận và lưu vết các lỗi runtime (React Error, Uncaught Exception, Unhandled Rejection)
 * - Thu thập chỉ số Web Vitals (FCP, LCP, CLS, TTFB)
 * - Không phụ thuộc dịch vụ ngoài (zero external dependency), sẵn sàng hook vào Sentry khi cần.
 */

export interface TelemetryErrorEvent {
  id: string
  timestamp: string
  type: 'REACT_ERROR' | 'UNCAUGHT_EXCEPTION' | 'UNHANDLED_REJECTION'
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
}

export interface WebVitalsMetrics {
  fcp?: number
  lcp?: number
  cls?: number
  ttfb?: number
}

const STORAGE_KEY = 'kms_telemetry_errors'
const MAX_ERRORS = 50

function getStoredErrors(): TelemetryErrorEvent[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function storeError(event: TelemetryErrorEvent): void {
  try {
    const current = getStoredErrors()
    const updated = [event, ...current].slice(0, MAX_ERRORS)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('[Telemetry] Không thể lưu lỗi vào sessionStorage:', e)
  }
}

/**
 * Ghi nhận lỗi runtime và phát sóng tới dispatcher nếu có
 */
export function reportRuntimeError(
  error: unknown,
  type: TelemetryErrorEvent['type'] = 'REACT_ERROR',
  componentStack?: string
): void {
  const err = error instanceof Error ? error : new Error(String(error))
  const event: TelemetryErrorEvent = {
    id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    message: err.message || 'Lỗi không xác định',
    stack: err.stack,
    componentStack,
    url: typeof window !== 'undefined' ? window.location.pathname : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }

  storeError(event)

  if (import.meta.env.DEV) {
    console.error(`[Telemetry ${type}]:`, event)
  }

  // Hook mở rộng cho APM / Sentry nếu có gắn dispatcher toàn cục
  const globalDispatcher = (window as unknown as { __TELEMETRY_DISPATCHER__?: (evt: TelemetryErrorEvent) => void })
    .__TELEMETRY_DISPATCHER__
  if (typeof globalDispatcher === 'function') {
    try {
      globalDispatcher(event)
    } catch {
      // bỏ qua lỗi dispatcher
    }
  }
}

/**
 * Lấy danh sách các lỗi runtime đã thu thập trong phiên
 */
export function getCollectedErrors(): TelemetryErrorEvent[] {
  return getStoredErrors()
}

/**
 * Khởi tạo listener giám sát lỗi toàn cục và đo lường Web Vitals
 */
export function initTelemetry(): void {
  if (typeof window === 'undefined') return

  // 1. Giám sát window.onerror (Uncaught Exceptions)
  window.addEventListener('error', (event) => {
    reportRuntimeError(event.error || event.message, 'UNCAUGHT_EXCEPTION')
  })

  // 2. Giám sát window.onunhandledrejection (Promise rejections)
  window.addEventListener('unhandledrejection', (event) => {
    reportRuntimeError(event.reason, 'UNHANDLED_REJECTION')
  })

  // 3. Giám sát Web Vitals
  const vitals: WebVitalsMetrics = { cls: 0 }
  ;(window as unknown as { __KMS_VITALS__?: WebVitalsMetrics }).__KMS_VITALS__ = vitals

  try {
    // Navigation timing for TTFB
    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming
      vitals.ttfb = Math.round(nav.responseStart)
    }

    // FCP
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find((p) => p.name === 'first-contentful-paint')
    if (fcp) {
      vitals.fcp = Math.round(fcp.startTime)
    }

    // LCP Observer
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1] as unknown as { startTime: number }
        vitals.lcp = Math.round(lastEntry.startTime)
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })

    // CLS Observer
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const shift = entry as unknown as { hadRecentInput: boolean; value: number }
        if (!shift.hadRecentInput) {
          vitals.cls = Number(((vitals.cls || 0) + shift.value).toFixed(4))
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[Telemetry] PerformanceObserver not supported:', e)
    }
  }

  // Đăng ký phương thức tra cứu chỉ số vào window
  ;(window as unknown as { __getVitalsReport?: () => WebVitalsMetrics }).__getVitalsReport = () => vitals
}

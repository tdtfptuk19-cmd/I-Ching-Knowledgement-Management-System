import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { isMockMode } from './config/env.config'
import { initTelemetry } from './utils/telemetry'
import './index.css'

// Khởi tạo telemetry giám sát lỗi runtime và Web Vitals
initTelemetry()

async function prepareApp(): Promise<void> {
  if (isMockMode()) {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      })
    } catch (err) {
      console.error('[MSW Init Failed]:', err)
      throw new Error(
        'Không thể khởi động dịch vụ dữ liệu mô phỏng (Mock Service Worker). ' +
        'Trình duyệt có thể đang chặn Service Worker hoặc ở chế độ riêng tư hạn chế. ' +
        'Vui lòng tải lại trang hoặc kiểm tra quyền Service Worker trong cài đặt.'
      )
    }
  }
}

const rootElement = document.getElementById('root') as HTMLElement

prepareApp()
  .then(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary level="app">
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  })
  .catch((err: Error) => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#faf7f2] text-stone-900 flex flex-col items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 font-bold text-xl">
              !
            </div>
            <h2 className="font-serif font-bold text-xl text-stone-900">
              Lỗi Khởi Động Dữ Liệu Mô Phỏng
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed text-left">
              {err.message}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-50 font-medium text-xs sm:text-sm transition shadow-sm"
              >
                Tải lại trang (Reload)
              </button>
            </div>
          </div>
        </div>
      </React.StrictMode>,
    )
  })

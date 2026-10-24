import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthContext'
import { TechnicalModeProvider } from './context/TechnicalModeContext'
import { SimulatedBanner } from './auth/SimulatedBanner'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { DivinationPage } from './features/divination/DivinationPage'
import { HexagramGrid } from './features/hexagrams/HexagramGrid'
import { HexagramDetailPage } from './features/hexagrams/HexagramDetailPage'
import { SearchPage } from './features/search/SearchPage'
import { ContributePage } from './features/governance/ContributePage'
import { ReviewQueuePage } from './features/governance/ReviewQueuePage'
import { DashboardPage } from './features/dashboard/DashboardPage'

const ROUTE_TITLES: Record<string, string> = {
  '/divination': 'Gieo Quẻ Mai Hoa — Cổng Tri Thức Kinh Dịch',
  '/hexagrams': '64 Quẻ Kinh Dịch — Cổng Tri Thức Kinh Dịch',
  '/search': 'Tìm Kiếm Tri Thức — Cổng Tri Thức Kinh Dịch',
  '/contribute': 'Đóng Góp Diễn Giải — Cổng Tri Thức Kinh Dịch',
  '/review': 'Hàng Đợi Kiểm Duyệt — Cổng Tri Thức Kinh Dịch',
  '/dashboard': 'Dashboard Quản Trị KMS — Cổng Tri Thức Kinh Dịch',
}

const RouteTitleObserver: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/hexagrams/') && location.pathname !== '/hexagrams') {
      const id = location.pathname.split('/')[2]
      document.title = `Chi Tiết Quẻ #${id} — Cổng Tri Thức Kinh Dịch`
    } else {
      document.title = ROUTE_TITLES[location.pathname] || 'Cổng Tri Thức Kinh Dịch — KMS301 (Nhóm 5)'
    }
  }, [location.pathname])

  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 phút cache
    },
  },
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TechnicalModeProvider>
          <BrowserRouter>
            {/* Accessibility: Skip Link tới nội dung chính */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-900 focus:text-amber-50 focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-sm transition"
            >
              Bỏ qua tới nội dung chính (Skip to content)
            </a>

            <RouteTitleObserver />
            <div className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-900 overflow-x-clip">
              {/* RBAC Simulated Notice Banner */}
              <SimulatedBanner />

              {/* Main Header */}
              <Header />

              {/* Route Content */}
              <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
                <Routes>
                  <Route path="/" element={<Navigate to="/divination" replace />} />
                  <Route path="/divination" element={<DivinationPage />} />
                  <Route path="/hexagrams" element={<HexagramGrid />} />
                  <Route path="/hexagrams/:id" element={<HexagramDetailPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/contribute" element={<ContributePage />} />
                  <Route path="/review" element={<ReviewQueuePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="*" element={<Navigate to="/divination" replace />} />
                </Routes>
              </main>

              {/* Footer */}
              <Footer />
            </div>
          </BrowserRouter>
        </TechnicalModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

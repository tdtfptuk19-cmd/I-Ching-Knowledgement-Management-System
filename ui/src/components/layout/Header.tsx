import React, { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { AppRole, ROLE_CONFIGS } from '@/i18n/roles'
import { isRealApiMode } from '@/config/env.config'
import { HealthIndicator } from '../HealthIndicator'
import {
  Sparkles,
  Grid3X3,
  Search,
  FilePenLine,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  BookOpen,
  ExternalLink,
  Menu,
  X,
  User,
  SlidersHorizontal,
} from 'lucide-react'

export const Header: React.FC = () => {
  const location = useLocation()
  const {
    role,
    setRole,
    roleMeta,
    canSubmit,
    canReview,
    canDashboard,
    reviewerName,
    setReviewerName,
    setUserId,
  } = useAuth()

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isTechnicalMode, toggleTechnicalMode } = useTechnicalMode()
  const isReal = isRealApiMode()

  // Dark/Light Theme state được bảo lưu logic nhưng tạm ẩn nút toggle theo khuyến nghị
  const [isDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('kinhdich_theme') === 'dark' ||
        document.documentElement.classList.contains('dark')
      )
    }
    return false
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('kinhdich_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('kinhdich_theme', 'light')
    }
  }, [isDark])

  const rolesList: AppRole[] = ['NOVICE', 'PRACTITIONER', 'EXPERT', 'REVIEWER', 'ADMIN']

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition ${
      isActive
        ? 'bg-amber-900 text-amber-50 shadow-sm'
        : 'text-stone-700 hover:text-amber-900 hover:bg-stone-100'
    }`

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-amber-900 text-amber-50 shadow-sm'
        : 'text-stone-700 hover:bg-stone-100'
    }`

  const isAdminActive = location.pathname === '/review' || location.pathname === '/dashboard'

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <Link to="/divination" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex items-center justify-center font-serif font-bold text-lg sm:text-xl shadow-inner border border-amber-700/50">
              易
            </div>
            <div>
              <div className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-tight flex items-center gap-1.5">
                KinhDich_KB
                <span className="text-[10px] font-sans font-semibold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded border border-amber-200">
                  Tầng 3
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-stone-500 font-sans hidden sm:block">
                Cổng Tri Thức Kinh Dịch · KMS301 (Nhóm 5)
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links (Hiển thị từ breakpoint lg: 1024px trở lên) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            <NavLink to="/divination" className={navLinkClass}>
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Gieo Quẻ</span>
            </NavLink>

            <NavLink to="/hexagrams" className={navLinkClass}>
              <Grid3X3 className="w-4 h-4 text-stone-500" />
              <span>64 Quẻ</span>
            </NavLink>

            <NavLink to="/search" className={navLinkClass}>
              <Search className="w-4 h-4 text-stone-500" />
              <span>Tìm Kiếm</span>
            </NavLink>

            {canSubmit && (
              <NavLink to="/contribute" className={navLinkClass}>
                <FilePenLine className="w-4 h-4 text-emerald-600" />
                <span>Đóng Góp</span>
              </NavLink>
            )}

            {/* Gom nhóm Quản Trị (Kiểm Duyệt + Dashboard) vào Dropdown duy nhất */}
            {(canReview || canDashboard) && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition ${
                    isAdminActive
                      ? 'bg-amber-900 text-amber-50 shadow-sm'
                      : 'text-stone-700 hover:text-amber-900 hover:bg-stone-100'
                  }`}
                  aria-expanded={adminDropdownOpen}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Quản Trị</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50 text-left"
                    onMouseLeave={() => setAdminDropdownOpen(false)}
                  >
                    <div className="px-3 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                      Quản trị Tri Thức (KMS)
                    </div>
                    {canReview && (
                      <NavLink
                        to="/review"
                        onClick={() => setAdminDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-stone-50 transition ${
                            isActive ? 'text-amber-900 font-bold bg-amber-50/70 border-l-2 border-amber-800' : 'text-stone-700'
                          }`
                        }
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span>Hàng Đợi Kiểm Duyệt</span>
                      </NavLink>
                    )}
                    {canDashboard && (
                      <NavLink
                        to="/dashboard"
                        onClick={() => setAdminDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-stone-50 transition ${
                            isActive ? 'text-amber-900 font-bold bg-amber-50/70 border-l-2 border-amber-800' : 'text-stone-700'
                          }`
                        }
                      >
                        <BarChart3 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>Dashboard Quản Trị</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Controls - Desktop (Ẩn dưới breakpoint lg) */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Swagger Link (chỉ hiển thị ở môi trường Dev) */}
            {import.meta.env.DEV && (
              <a
                href={`http://${typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '127.0.0.1'}:8000/api/v1/docs`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-800 transition px-2 py-1.5 rounded border border-stone-200 hover:border-amber-300 whitespace-nowrap"
                title="Mở Swagger UI của Tầng 2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Swagger</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>
            )}

            {/* Environment Indicator: Nếu dữ liệu là demo thì giữ lại, nếu không còn là demo (kết nối thật) thì xóa đi */}
            {!isReal ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-200 text-xs font-medium text-amber-900 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Demo — dữ liệu mô phỏng</span>
              </span>
            ) : import.meta.env.DEV ? (
              <HealthIndicator />
            ) : null}

            {/* Toggle Chế Độ Kỹ Thuật (Học Thuật) */}
            <button
              type="button"
              onClick={toggleTechnicalMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-amber-600 ${
                isTechnicalMode
                  ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title={isTechnicalMode ? 'Tắt Chế độ Kỹ thuật (chuyển sang Tiếng Việt đại chúng)' : 'Bật Chế độ Kỹ thuật (hiển thị mã BCR, ADR, RBAC, W=0.xx)'}
              aria-pressed={isTechnicalMode}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Chế độ Kỹ thuật</span>
              <span className={`w-2 h-2 rounded-full ${isTechnicalMode ? 'bg-amber-300' : 'bg-stone-300'}`} />
            </button>

            {/* Role Switcher Dropdown (Desktop) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${roleMeta.badgeColor}`}
                title="Đổi vai trò mô phỏng"
                aria-label={`Vai trò: ${role} - Đổi vai trò mô phỏng`}
                aria-expanded={roleDropdownOpen}
              >
                <span>{role}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white border border-stone-200 rounded-xl shadow-xl py-2 z-50 text-left"
                  onMouseLeave={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                    Chọn Vai Trò Mô Phỏng (RBAC)
                  </div>
                  {rolesList.map((r) => {
                    const meta = ROLE_CONFIGS[r]
                    const isSelected = r === role
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r)
                          setRoleDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 hover:bg-stone-50 transition ${
                          isSelected ? 'bg-amber-50/70 border-l-4 border-amber-700' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-stone-800">{meta.nameVi}</span>
                          <span className="text-[10px] font-mono uppercase text-stone-500">{r}</span>
                        </div>
                        <span className="text-[11px] text-stone-500 leading-tight">{meta.description}</span>
                      </button>
                    )
                  })}

                  <div className="p-3 border-t border-stone-100 bg-stone-50 rounded-b-xl space-y-2 mt-1">
                    <label htmlFor="user-identity-input" className="block text-[11px] font-semibold text-stone-700">
                      Định danh Người Dùng (User / Reviewer):
                    </label>
                    <input
                      id="user-identity-input"
                      type="text"
                      value={reviewerName}
                      onChange={(e) => {
                        setReviewerName(e.target.value)
                        setUserId(e.target.value)
                      }}
                      placeholder="VD: ChuyenGia_TranVanA"
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white"
                    />
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Định danh dùng cho việc nộp bài, duyệt bài và ghi vết kiểm toán (Audit Trail).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right: CHỈ CÓ NÚT HAMBURGER dưới breakpoint lg */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
              aria-label="Menu điều hướng trên thiết bị di động"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Hiển thị toàn diện dưới lg: Nav + Role Switcher + Identity) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
          {/* 1. Bộ chọn Vai trò Mô phỏng trên Mobile */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" />
                Vai Trò Mô Phỏng (RBAC)
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${roleMeta.badgeColor}`}>
                {role}
              </span>
            </div>

            {/* Lưới chọn 5 vai trò */}
            <div className="grid grid-cols-2 gap-1.5">
              {rolesList.map((r) => {
                const isSelected = r === role
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition border ${
                      isSelected
                        ? 'bg-amber-900 text-amber-50 border-amber-900 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div>{ROLE_CONFIGS[r].nameVi}</div>
                    <div className="text-[9px] font-mono opacity-80">{r}</div>
                  </button>
                )
              })}
            </div>

            {/* Ô nhập định danh người dùng */}
            <div className="pt-2 border-t border-stone-200 space-y-1">
              <label htmlFor="mobile-user-identity" className="block text-[10px] font-semibold text-stone-600">
                Định danh Người Dùng / Reviewer:
              </label>
              <input
                id="mobile-user-identity"
                type="text"
                value={reviewerName}
                onChange={(e) => {
                  setReviewerName(e.target.value)
                  setUserId(e.target.value)
                }}
                placeholder="VD: ChuyenGia_TranVanA"
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 2. Menu Điều Hướng */}
          <div className="space-y-1 border-t border-stone-100 pt-2">
            <div className="px-1 pb-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Điều Hướng Cổng Tri Thức
            </div>

            <NavLink
              to="/divination"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Gieo Quẻ</span>
            </NavLink>

            <NavLink
              to="/hexagrams"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Grid3X3 className="w-4 h-4 text-stone-500" />
              <span>64 Quẻ Kinh Dịch</span>
            </NavLink>

            <NavLink
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Search className="w-4 h-4 text-stone-500" />
              <span>Tìm Kiếm Toàn Văn</span>
            </NavLink>

            {canSubmit && (
              <NavLink
                to="/contribute"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <FilePenLine className="w-4 h-4 text-emerald-600" />
                <span>Đóng Góp Diễn Giải</span>
              </NavLink>
            )}

            {canReview && (
              <NavLink
                to="/review"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Hàng Đợi Kiểm Duyệt</span>
              </NavLink>
            )}

            {canDashboard && (
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Dashboard Quản Trị KMS</span>
              </NavLink>
            )}
          </div>

          {/* 3. Bật/Tắt Chế Độ Kỹ Thuật trên Mobile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div>
              <div className="font-semibold text-xs text-stone-800">Chế độ Kỹ thuật / Học thuật</div>
              <div className="text-[11px] text-stone-500">Hiển thị mã truy vết RBAC, BCR, ADR, W=0.xx</div>
            </div>
            <button
              type="button"
              onClick={toggleTechnicalMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isTechnicalMode ? 'bg-amber-900' : 'bg-stone-300'
              }`}
              aria-pressed={isTechnicalMode}
              title="Bật/Tắt chế độ kỹ thuật"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isTechnicalMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 4. Badge môi trường trên Mobile: Chỉ hiện khi dữ liệu là Demo */}
          {!isReal && (
            <div className="pt-2 border-t border-stone-100 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200 text-xs text-amber-900">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Demo — Dữ liệu mô phỏng (MSW)</span>
              </span>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

import React from 'react'
import { useAuth } from './AuthContext'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { ShieldAlert, UserCheck } from 'lucide-react'

export const SimulatedBanner: React.FC = () => {
  const { role, roleMeta, userId } = useAuth()
  const { isTechnicalMode, toggleTechnicalMode } = useTechnicalMode()

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span className="font-medium">
            {isTechnicalMode
              ? 'Dữ liệu mô phỏng — tải lại trang sẽ đặt lại. RBAC mô phỏng phía client (BCR-001)'
              : 'Dữ liệu mô phỏng — tải lại trang sẽ đặt lại.'}
          </span>
          {isTechnicalMode && (
            <>
              <span className="hidden sm:inline text-amber-700/80">|</span>
              <span className="hidden sm:inline text-amber-800 font-mono text-xs">
                Nền tảng: <strong className="font-semibold">{roleMeta.wiigLevel}</strong>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-700">
            <UserCheck className="w-3.5 h-3.5 text-amber-800" />
            <span className="hidden md:inline">Định danh:</span>
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">{userId}</code>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${roleMeta.badgeColor}`}>
            {role}
          </span>
          <button
            type="button"
            onClick={toggleTechnicalMode}
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition focus-visible:ring-2 focus-visible:ring-amber-600 ${
              isTechnicalMode
                ? 'bg-amber-900 text-amber-50 border-amber-950'
                : 'bg-white text-stone-700 border-amber-300 hover:bg-amber-50'
            }`}
            title="Bật/Tắt hiển thị mã học thuật & kiến trúc KMS"
            aria-pressed={isTechnicalMode}
          >
            <span>{isTechnicalMode ? 'Kỹ thuật: BẬT' : 'Kỹ thuật: TẮT'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

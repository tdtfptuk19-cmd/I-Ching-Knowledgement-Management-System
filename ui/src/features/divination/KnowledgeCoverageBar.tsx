import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Check, X, AlertTriangle, Layers, Info } from 'lucide-react'

export interface KnowledgeCoverageBarProps {
  rulesCount: number
  interpretationsCount: number
  fiveElementCount?: number
  fallbackApplied: boolean
  coverageMessage?: string
}

export const KnowledgeCoverageBar: React.FC<KnowledgeCoverageBarProps> = ({
  rulesCount,
  interpretationsCount,
  fallbackApplied,
  coverageMessage,
}) => {
  const { canDashboard } = useAuth()
  const [showExplanation, setShowExplanation] = useState(false)

  // 3 Trụ cột tri thức:
  // 1. Ngũ hành Mai Hoa (bắt buộc)
  // 2. Luật suy luận (rules_fired)
  // 3. Diễn giải chuyên đề (interpretations)
  const hasFiveElement = true
  const hasRules = rulesCount > 0
  const hasInterp = interpretationsCount > 0

  const activePillars = (hasFiveElement ? 1 : 0) + (hasRules ? 1 : 0) + (hasInterp ? 1 : 0)
  const isNormalized = fallbackApplied || activePillars < 3

  return (
    <div
      data-testid="knowledge-coverage-bar"
      className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tiêu đề & 3 Trụ cột */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-stone-600">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Tri thức đang dùng:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Trụ cột 1: Ngũ hành */}
            <span
              data-testid="pillar-element"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ngũ hành (bắt buộc)</span>
            </span>

            {/* Trụ cột 2: Luật suy luận */}
            <span
              data-testid="pillar-rules"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium ${
                hasRules
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-50 text-stone-500 border-stone-200'
              }`}
            >
              {hasRules ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span>
                Luật suy luận — {rulesCount > 0 ? `${rulesCount} luật kích hoạt` : '0 luật kích hoạt'}
              </span>
            </span>

            {/* Trụ cột 3: Diễn giải chuyên đề */}
            <span
              data-testid="pillar-interp"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium ${
                hasInterp
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-50 text-stone-500 border-stone-200'
              }`}
            >
              {hasInterp ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span>
                Diễn giải chuyên đề — {interpretationsCount > 0 ? `${interpretationsCount} bài đã duyệt` : '0 bài đã duyệt'}
              </span>
            </span>
          </div>
        </div>

        {/* Badge Tái Chuẩn Hóa Tỷ Trọng khi thiếu trụ cột */}
        {isNormalized && (
          <div className="flex items-center gap-2">
            <div
              data-testid="normalization-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <span>Đang tái chuẩn hóa tỷ trọng — kết quả chỉ dựa trên {activePillars}/3 trụ cột</span>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="p-1.5 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 transition"
              title="Xem giải thích tái chuẩn hóa"
              aria-label="Xem giải thích tái chuẩn hóa"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Chi tiết giải thích tái chuẩn hóa khi người dùng bấm xem hoặc có thông báo coverage */}
      {(showExplanation || coverageMessage) && isNormalized && (
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1 animate-fadeIn">
          {coverageMessage && (
            <p className="font-medium">
              <strong>Thông báo hệ thống:</strong> {coverageMessage}
            </p>
          )}
          <p className="text-stone-700 leading-relaxed">
            Hệ thống áp dụng cơ chế suy diễn an toàn (Defensive Inference): Khi một hoặc nhiều trụ cột tri thức chưa có dữ liệu phê duyệt, điểm số tổng hợp sẽ được tự động phân bổ lại sang các trụ cột còn lại để tránh làm sai lệch kết luận.{' '}
            {canDashboard ? (
              <Link
                to="/dashboard"
                className="text-amber-800 font-semibold underline hover:text-amber-950"
              >
                Vì sao thiếu? Xem Dashboard Quản Trị
              </Link>
            ) : (
              <span className="text-stone-500 italic">
                (Xem thêm chi tiết tại Bảng Phân Rã Điểm bên dưới).
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
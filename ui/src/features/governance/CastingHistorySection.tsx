import React, { useState, useEffect } from 'react'
import { DivinationHistoryItem } from '../divination/DivinationPage'
import { FeedbackModal } from './FeedbackModal'
import { History, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { formatDateTime } from '@/utils/date.utils'

const HISTORY_STORAGE_KEY = 'kinhdich_divination_history'

interface CastingHistorySectionProps {
  onSelectCase?: (caseId: string) => void
}

interface StoredHistoryItem extends DivinationHistoryItem {
  is_feedback_submitted?: boolean
  verified_outcome?: string
}

export function getOutcomeMatch(polarityLabel: string, score: number, outcome?: string): {
  label: 'Khớp' | 'Lệch' | 'Chưa đủ dữ liệu'
  badgeClass: string
} {
  if (!outcome || outcome.trim().length < 3) {
    return { label: 'Chưa đủ dữ liệu', badgeClass: 'bg-stone-100 text-stone-600 border-stone-200' }
  }
  const lower = outcome.toLowerCase()
  // BÌNH HÒA là trạng thái trung tính, không dự đoán cát hay hung nên không thể tính là Khớp hay Lệch
  const isNeutral = polarityLabel.includes('BÌNH HÒA') || (Math.abs(score) < 0.2)
  if (isNeutral) {
    return { label: 'Chưa đủ dữ liệu', badgeClass: 'bg-stone-100 text-stone-600 border-stone-200' }
  }

  const isPositivePredict = polarityLabel.includes('CÁT') || score >= 0.2
  const isNegativePredict = polarityLabel.includes('HUNG') || score <= -0.2

  const positiveKeywords = ['thành công', 'thuận', 'tốt', 'đạt', 'thắng', 'được', 'hài lòng', 'khớp', 'positive', 'success']
  const negativeKeywords = ['thất bại', 'hỏng', 'không thành', 'xấu', 'mất', 'hung', 'trục trặc', 'khó khăn', 'fail', 'lệch']

  const hasPos = positiveKeywords.some(kw => lower.includes(kw))
  const hasNeg = negativeKeywords.some(kw => lower.includes(kw))

  if (hasPos && !hasNeg) {
    if (isPositivePredict) return { label: 'Khớp', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    if (isNegativePredict) return { label: 'Lệch', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' }
  } else if (hasNeg && !hasPos) {
    if (isNegativePredict) return { label: 'Khớp', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    if (isPositivePredict) return { label: 'Lệch', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' }
  }
  return { label: 'Chưa đủ dữ liệu', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' }
}

export const CastingHistorySection: React.FC<CastingHistorySectionProps> = () => {
  const [history, setHistory] = useState<StoredHistoryItem[]>([])
  const [activeFeedbackCaseId, setActiveFeedbackCaseId] = useState<string | null>(null)

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      setHistory([])
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleFeedbackSuccess = (caseId: string, outcome: string) => {
    const updated = history.map((item) =>
      item.case_id === caseId
        ? { ...item, is_feedback_submitted: true, verified_outcome: outcome }
        : item
    )
    setHistory(updated)
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Ignored
    }
  }

  if (history.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-700" />
          <h3 className="font-serif font-bold text-base text-stone-900">
            Lịch Sử Ca Gieo Quẻ (Vòng Lặp Học Tập Đôi)
          </h3>
        </div>
        <span className="text-xs text-stone-500">
          Lưu trữ {history.length} ca gần nhất trong phiên
        </span>
      </div>

      <div className="divide-y divide-stone-100">
        {history.map((item) => (
          <div key={item.case_id} className="py-3 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800 text-sm">
                    {item.initial_name} → {item.transformed_name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[11px]">
                    Động Hào {item.moving_line}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium text-[11px]">
                    {item.topic}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                  <span className="font-mono">Case: {item.case_id.slice(0, 8)}...</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(item.created_at)}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-stone-700">{item.polarity_label} ({item.score > 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.is_feedback_submitted ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã nạp thực chứng
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveFeedbackCaseId(item.case_id)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Nạp phản hồi thực chứng</span>
                  </button>
                )}
              </div>
            </div>

            {/* Đối chiếu Dự đoán vs Thực chứng (P2.1 - Vòng Lặp Học Tập Đôi Argyris & Schön) */}
            {item.is_feedback_submitted && item.verified_outcome && (
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-semibold text-stone-700">Dự đoán:</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100 font-medium text-stone-800">
                    {item.polarity_label} ({item.score > 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)})
                  </span>
                  <span className="text-stone-300">↔</span>
                  <span className="font-semibold text-stone-700">Thực chứng:</span>
                  <span className="text-stone-800 italic">&ldquo;{item.verified_outcome}&rdquo;</span>
                </div>

                {(() => {
                  const match = getOutcomeMatch(item.polarity_label, item.score, item.verified_outcome)
                  return (
                    <span
                      data-testid="outcome-match-badge"
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${match.badgeClass}`}
                    >
                      Đối chiếu: {match.label}
                    </span>
                  )
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeFeedbackCaseId && (
        <FeedbackModal
          caseId={activeFeedbackCaseId}
          isOpen={true}
          onClose={() => setActiveFeedbackCaseId(null)}
          onSuccess={(res) => handleFeedbackSuccess(res.case_id, res.verified_outcome)}
        />
      )}
    </div>
  )
}

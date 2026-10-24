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
          <div
            key={item.case_id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
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

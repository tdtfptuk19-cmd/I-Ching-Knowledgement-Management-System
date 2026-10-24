import React, { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { submitDivinationFeedback } from '@/api/governance.api'
import { FeedbackRequest, FeedbackResponse } from '@/types/governance.types'
import { RefreshCw, CheckCircle2, Award, AlertTriangle, Sparkles, X } from 'lucide-react'

interface FeedbackModalProps {
  caseId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (res: FeedbackResponse) => void
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  caseId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { role } = useAuth()
  const [outcome, setOutcome] = useState<string>('')
  const [isBestPractice, setIsBestPractice] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<FeedbackResponse | null>(null)

  if (!isOpen) return null

  // Chỉ REVIEWER, EXPERT hoặc ADMIN mới được bật cờ Best Practice
  const canMarkBestPractice = role === 'REVIEWER' || role === 'EXPERT' || role === 'ADMIN'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (outcome.trim().length < 5) {
      setErrorMsg('Nội dung kết quả thực tế (verified_outcome) phải có ít nhất 5 ký tự.')
      return
    }

    const payload: FeedbackRequest = {
      verified_outcome: outcome.trim(),
      is_reviewed_for_best_practice: canMarkBestPractice ? isBestPractice : false,
    }

    try {
      setIsSubmitting(true)
      const res = await submitDivinationFeedback(caseId, payload)
      setSuccessResult(res)
      if (onSuccess) {
        onSuccess(res)
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      setErrorMsg(error?.message || 'Có lỗi xảy ra khi nạp phản hồi thực chứng.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setOutcome('')
    setIsBestPractice(false)
    setErrorMsg(null)
    setSuccessResult(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-base">Phản Hồi Thực Chứng Sau Chiêm Đoán</h3>
              <p className="text-[11px] text-stone-300">
                Mô-đun 6 · Vòng lặp Học tập Đôi (Double-Loop Learning — Argyris & Schön 1978)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {successResult ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm">Ghi nhận thực chứng thành công!</div>
                <p className="text-xs leading-relaxed">{successResult.message}</p>
                {successResult.is_reviewed_for_best_practice && (
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-300">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Đã gắn cờ: Ca Gieo Quẻ Mẫu Mực (Best Practice)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Đóng hộp thoại
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Theoretical clarification */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Mục đích khoa học quản trị tri thức</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                Dữ liệu thực chứng đời sống được dùng để đối soát tính đúng đắn và tái hiệu chuẩn các quy tắc suy luận (Inference Rules), <strong>hoàn toàn không phải một cuộc bình chọn hài lòng cá nhân</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Case ID badge */}
            <div className="text-xs text-stone-500 font-mono bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 flex items-center justify-between">
              <span>Mã ca gieo (Case ID):</span>
              <span className="font-bold text-stone-800">{caseId}</span>
            </div>

            {/* Verified Outcome Input */}
            <div>
              <label htmlFor="outcome-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Diễn biến và Kết quả Thực tế Diễn ra <span className="text-red-500">*</span> (tối thiểu 5 ký tự)
              </label>
              <textarea
                id="outcome-input"
                rows={4}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Ghi nhận sự việc, quyết định và kết quả thực tế đã diễn ra sau khi chiêm đoán..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Best Practice Checkbox (Role Guarded) */}
            <div className="pt-2 border-t border-stone-100">
              <label
                className={`flex items-start gap-2.5 text-xs ${
                  canMarkBestPractice ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isBestPractice}
                  disabled={!canMarkBestPractice}
                  onChange={(e) => setIsBestPractice(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-amber-700 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-stone-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Đánh dấu là Ca Gieo Quẻ Mẫu Mực (Best Practice Case)
                  </span>
                  <span className="text-[11px] text-stone-500 block leading-relaxed">
                    {canMarkBestPractice
                      ? 'Ca mẫu mực sẽ được ưu tiên đưa vào bộ quy chuẩn kiểm định và huấn luyện quy tắc mới.'
                      : 'Chỉ vai trò Chuyên gia (EXPERT), Kiểm duyệt (REVIEWER) hoặc Quản trị (ADMIN) mới có quyền bật cờ này.'}
                  </span>
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang nạp thực chứng...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Nạp vào Vòng Lặp Học Tập Đôi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { Topic, UserLevel, AIAdviceResponse } from '@/types/divination.types'
import { SubmissionResponse } from '@/types/governance.types'
import { postAIAdvice, saveAIAdviceDraft } from '@/api/divination.api'
import {
  Sparkles,
  Bot,
  RotateCcw,
  BookmarkPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react'

export interface AIAdviceBlockProps {
  caseId: string
  topic: Topic
  userLevel: UserLevel
  initialHexagramName?: string
  movingLine: number
}

export const AIAdviceBlock: React.FC<AIAdviceBlockProps> = ({
  caseId,
  topic,
  userLevel,
  initialHexagramName,
  movingLine,
}) => {
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedResult, setSavedResult] = useState<SubmissionResponse | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = async () => {
    abortRef.current?.abort()
    const currentController = new AbortController()
    abortRef.current = currentController

    setIsLoading(true)
    setError(null)
    setSaveError(null)
    setSavedResult(null)

    try {
      const res = await postAIAdvice(
        caseId,
        {
          topic,
          user_level: userLevel,
        },
        currentController.signal,
      )
      setAdvice(res)
    } catch (err: unknown) {
      if (currentController.signal.aborted) return
      const msg = err instanceof Error ? err.message : 'Không thể sinh lời khuyên từ AI'
      setError(msg)
    } finally {
      if (abortRef.current === currentController) {
        setIsLoading(false)
      }
    }
  }

  const handleSaveDraft = async () => {
    if (!advice || isSaving || savedResult) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await saveAIAdviceDraft(caseId, advice.advice_id)
      setSavedResult(res)
    } catch (err: unknown) {
      const errorMsg = String(err)
      if (errorMsg.includes('410') || errorMsg.includes('DRAFT_EXPIRED') || errorMsg.includes('hết hạn')) {
        setSaveError('Phiên đã hết hạn hoặc bản thảo đã được lưu, vui lòng tạo lại lời khuyên.')
      } else {
        setSaveError('Lỗi khi gửi bản thảo vào hàng đợi kiểm duyệt. Vui lòng thử lại.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (import.meta.env.VITE_AI_ADVICE_AUTO_LOAD === 'true') {
      handleGenerate()
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [caseId])

  // Trạng thái 1: Chưa sinh lời khuyên (CTA ban đầu)
  if (!advice && !isLoading && !error) {
    return (
      <div
        className="bg-gradient-to-r from-amber-50/70 via-stone-50 to-orange-50/50 border border-amber-200/80 rounded-xl p-5 shadow-sm space-y-3"
        data-testid="ai-advice-cta-block"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100/80 rounded-lg text-amber-900">
              <Bot className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Lời Khuyên Hành Động Thực Tiễn (AI Copilot)
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Sinh khối hành động súc tích (3–5 dòng có thẻ căn cứ) gắn liền với hào động{' '}
                <span className="font-semibold text-stone-800">#{movingLine}</span> quẻ{' '}
                <span className="font-semibold text-stone-800">{initialHexagramName || ''}</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            data-testid="ai-advice-cta-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tạo Lời Khuyên Hành Động từ AI</span>
          </button>
          <span className="text-[11px] text-stone-500 italic">
            * Áp dụng PA2': Không thay đổi điểm số tất định, lưu bản thảo AI_DRAFT.
          </span>
        </div>
      </div>
    )
  }

  // Trạng thái 2: Đang tải
  if (isLoading) {
    return (
      <div
        className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center space-y-3 min-h-[160px]"
        data-testid="ai-advice-loading"
      >
        <Loader2 className="w-6 h-6 text-amber-700 animate-spin" />
        <div className="text-center">
          <p className="text-xs font-semibold text-stone-800">
            Đang triệu hồi Dịch sư Copilot và phân tích tương tác Thể Dụng...
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Kiểm tra 10 rào chắn Guardrails & căn cứ nguồn gốc tri thức.
          </p>
        </div>
      </div>
    )
  }

  // Trạng thái 3: Gặp lỗi khi sinh
  if (error && !advice) {
    return (
      <div
        className="bg-red-50/70 border border-red-200 rounded-xl p-5 shadow-sm space-y-3"
        data-testid="ai-advice-error"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-900">Không thể tạo lời khuyên hành động</h4>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
        <div className="pt-1">
          <button
            type="button"
            onClick={handleGenerate}
            data-testid="ai-advice-retry-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    )
  }

  if (!advice) return null

  // Trạng thái 4: Hiển thị kết quả thành công
  const bullets = advice.content.split('\n').filter((l) => l.trim().length > 0)

  return (
    <div
      className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4"
      data-testid="ai-advice-container"
    >
      {/* Tiêu đề & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <h3 className="font-serif font-bold text-base text-stone-900">
            {advice.title || 'Lời Khuyên Hành Động Thực Tiễn (AI Copilot)'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span
            className="px-2 py-0.5 rounded-full font-mono font-semibold bg-purple-100 text-purple-800 border border-purple-200"
            data-testid="ai-advice-badge-draft"
          >
            AI_DRAFT
          </span>

          <span
            className="px-2 py-0.5 rounded-full font-mono bg-stone-100 text-stone-700 border border-stone-200"
            data-testid="ai-advice-badge-model"
          >
            {advice.provenance.model}
          </span>

          {advice.is_fallback && (
            <span
              className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200"
              data-testid="ai-advice-badge-fallback"
            >
              Thuật toán tất định (Fallback)
            </span>
          )}
        </div>
      </div>

      {/* Nội dung các gạch đầu dòng */}
      <ul className="space-y-2 text-xs text-stone-700 leading-relaxed list-none pl-0">
        {bullets.map((bullet, idx) => {
          const cleanText = bullet.startsWith('- ') ? bullet.slice(2) : bullet
          return (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-800 font-bold mt-0.5">•</span>
              <span className="flex-1 whitespace-pre-line">{cleanText}</span>
            </li>
          )
        })}
      </ul>

      {/* Thẻ căn cứ nguồn gốc tri thức */}
      {advice.citations && advice.citations.length > 0 && (
        <div className="pt-2 border-t border-stone-100 space-y-1.5" data-testid="ai-advice-citations">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Căn cứ suy luận (Citations):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {advice.citations.map((c, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-amber-50 text-amber-900 border border-amber-200/80"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Thông báo lỗi khi lưu */}
      {saveError && (
        <div
          className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2"
          data-testid="ai-advice-save-error"
        >
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Thông báo lưu thành công */}
      {savedResult && (
        <div
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2"
          data-testid="ai-advice-saved-badge"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Đã gửi vào hàng đợi thẩm định (PENDING) — Mã #{savedResult.interpretation_id}
          </span>
        </div>
      )}

      {/* Thanh tác vụ: Lưu bản thảo + Tạo lại */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          {!savedResult ? (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              data-testid="ai-advice-save-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-[0.98]"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu bản thảo để chuyên gia duyệt'}</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Bản thảo đã được tiếp nhận</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          data-testid="ai-advice-retry-btn"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-medium rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tạo lại</span>
        </button>
      </div>
    </div>
  )
}

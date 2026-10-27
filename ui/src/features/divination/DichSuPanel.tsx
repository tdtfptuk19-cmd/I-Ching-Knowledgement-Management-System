import React, { useState, useRef, useEffect } from 'react'
import { UserLevel, Topic, InterpretResponse } from '@/types/divination.types'
import { NormalizedError } from '@/types/common.types'
import { postInterpret } from '@/api/divination.api'
import { normalizeApiError } from '@/api/error-normalizer'
import { MiniMarkdownRenderer } from './MiniMarkdownRenderer'
import {
  Sparkles,
  Send,
  RotateCcw,
  AlertCircle,
  Clock,
  BookOpen,
  ShieldCheck,
} from 'lucide-react'

interface DichSuPanelProps {
  caseId: string
  userLevel: UserLevel
  hexagramName?: string
  topic: Topic
}

export const DichSuPanel: React.FC<DichSuPanelProps> = ({
  caseId,
  userLevel,
  hexagramName,
}) => {
  const [userQuestion, setUserQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<InterpretResponse | null>(null)
  const [apiError, setApiError] = useState<NormalizedError | null>(null)
  const [hasRequested, setHasRequested] = useState(false)

  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleReset = () => {
    abortRef.current?.abort()
    abortRef.current = null
    inFlightRef.current = false
    setIsLoading(false)
    setResult(null)
    setApiError(null)
    setUserQuestion('')
    setHasRequested(false)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (inFlightRef.current) return

    setApiError(null)
    abortRef.current?.abort()

    const currentController = new AbortController()
    abortRef.current = currentController
    inFlightRef.current = true
    setIsLoading(true)

    try {
      const res = await postInterpret(
        {
          case_id: caseId,
          user_question: userQuestion.trim() || undefined,
          user_level: userLevel,
        },
        currentController.signal
      )

      if (abortRef.current === currentController) {
        setResult(res)
        setHasRequested(true)
      }
    } catch (err: unknown) {
      if (currentController.signal.aborted) {
        return
      }
      if (abortRef.current === currentController) {
        setApiError(normalizeApiError(err))
      }
    } finally {
      if (abortRef.current === currentController) {
        inFlightRef.current = false
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
      inFlightRef.current = false
    }
  }, [])

  const placeholderText = hexagramName
    ? `Nhập câu hỏi hoặc bối cảnh cần chiêm đoán về quẻ ${hexagramName}...`
    : 'Nhập câu hỏi hoặc bối cảnh cần chiêm đoán của bạn...'

  const isSessionExpired = apiError?.code === 'NOT_FOUND'

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header Panel */}
      <div className="border-b border-stone-100 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-1.5">
              <span>Trợ Lý Dịch Sư — Luận Giải Chi Tiết</span>
            </h3>
            <p className="text-xs text-stone-500">
              Phân tích 3 mục chuyên sâu (Thể Dụng, Quá trình chuyển hóa, Kế sách tu thân) bám sát kinh văn
            </p>
          </div>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            {result.is_fallback ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Luận giải theo quy tắc từ Kinh văn (Tất định)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Luận giải từ Mô hình AI</span>
                <span className="hidden sm:inline text-emerald-700 font-mono text-[10px]">
                  ({result.model})
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lỗi phiên hết hạn 404 */}
      {isSessionExpired && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
          <div className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Phiên Gieo Quẻ Đã Hết Hạn</span>
          </div>
          <p className="leading-relaxed">
            Máy chủ vừa tái khởi động sau khoảng thời gian chờ, dữ liệu ca gieo tạm thời không còn trong bộ nhớ.
            Vui lòng thực hiện khởi chiêm quẻ mới ở khung bên trái.
          </p>
        </div>
      )}

      {/* Lỗi hệ thống khác có nút thử lại */}
      {apiError && !isSessionExpired && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{apiError.code}</div>
              <p className="mt-0.5 leading-relaxed">{apiError.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg font-semibold text-rose-800 transition text-xs flex-shrink-0"
          >
            Thử Lại
          </button>
        </div>
      )}

      {/* Vùng Form nhập câu hỏi (khi chưa có kết quả) */}
      {!hasRequested && !result && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <label htmlFor="user-question-input" className="font-medium text-stone-700">
                Câu hỏi hoặc việc cần tham vấn riêng (tùy chọn):
              </label>
              <span className="font-mono text-[11px] text-stone-400">
                {userQuestion.length}/500 ký tự
              </span>
            </div>
            <textarea
              id="user-question-input"
              aria-label="Câu hỏi chiêm đoán"
              maxLength={500}
              rows={3}
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder={placeholderText}
              disabled={isLoading}
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition disabled:bg-stone-100 placeholder:text-stone-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-stone-500 italic">
              * Có thể để trống nếu chỉ muốn nhận bài luận tổng quát về quẻ và hào động.
            </span>

            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium text-xs sm:text-sm transition shadow-sm w-full sm:w-auto ${
                isLoading
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Đang Luận Giải...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Nhờ Trợ Lý Luận Giải</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Trạng thái Loading đang suy luận */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="p-6 bg-stone-50 border border-stone-200 rounded-xl text-center space-y-3"
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
            <RotateCcw className="w-5 h-5 animate-spin" />
          </div>
          <div className="text-xs text-stone-600 font-medium">
            Trợ Lý Dịch Sư đang tổng hợp dữ kiện quẻ và xây dựng bài luận giải...
          </div>
          <div className="flex justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-amber-700 animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-amber-700 animate-pulse delay-200" />
          </div>
        </div>
      )}

      {/* Vùng Hiển thị Kết quả Bài Luận Giải */}
      {result && (
        <div className="space-y-4 pt-1">
          {/* Nội dung bài luận 3 mục qua MiniMarkdownRenderer */}
          <div className="p-4 bg-stone-50/70 border border-stone-200/90 rounded-xl space-y-2">
            <MiniMarkdownRenderer text={result.markdown_text} />
          </div>

          {/* Danh mục Thẻ căn cứ (Citations Footnotes) */}
          {result.citations && result.citations.length > 0 && (
            <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-lg space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-950 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                <span>Nguồn & Thẻ Căn Cứ Trích Dẫn ({result.citations.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.citations.map((cite, i) => (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-white text-stone-800 border border-stone-200"
                  >
                    {cite}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lời tuyên bố miễn trừ & Chân trang */}
          <div className="border-t border-stone-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-start gap-1.5 max-w-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-stone-500">
                {result.disclaimer}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition self-start sm:self-auto flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-stone-500" />
              <span>Luận giải lại với câu hỏi khác</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

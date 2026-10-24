import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DivinationRequest, DivinationResponse, Topic } from '@/types/divination.types'
import { postDivination } from '@/api/divination.api'
import { DivinationForm } from './DivinationForm'
import { DivinationResult } from './DivinationResult'
import { FeedbackModal } from '../governance/FeedbackModal'
import { CastingHistorySection } from '../governance/CastingHistorySection'
import { normalizeApiError } from '@/api/error-normalizer'
import { NormalizedError } from '@/types/common.types'
import { AlertCircle, Sparkles } from 'lucide-react'

export interface DivinationHistoryItem {
  case_id: string
  created_at: string
  topic: Topic
  initial_name: string
  transformed_name: string
  moving_line: number
  score: number
  polarity_label: string
}

const HISTORY_STORAGE_KEY = 'kinhdich_divination_history'

export const DivinationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<DivinationResponse | null>(null)
  const [currentTopic, setCurrentTopic] = useState<Topic>('CAREER')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [apiError, setApiError] = useState<NormalizedError | null>(null)
  const [feedbackCaseId, setFeedbackCaseId] = useState<string | null>(() => {
    return searchParams.get('open_feedback') === 'true' ? 'case-demo-7ecfc7b2-kms301' : null
  })

  // Gửi request gieo quẻ
  const handleDivinationSubmit = async (req: DivinationRequest) => {
    setIsLoading(true)
    setApiError(null)
    setCurrentTopic(req.topic)

    try {
      const response = await postDivination(req)
      setResult(response)

      // Lưu vết vào lịch sử cục bộ cho Double-Loop learning
      try {
        const historyItem: DivinationHistoryItem = {
          case_id: response.case_id,
          created_at: new Date().toISOString(),
          topic: req.topic,
          initial_name: response.initial_hexagram.name_vn,
          transformed_name: response.transformed_hexagram.name_vn,
          moving_line: response.moving_line,
          score: response.synthesis.score,
          polarity_label: response.synthesis.polarity_label,
        }
        const existing = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]')
        const updated = [historyItem, ...existing.filter((i: DivinationHistoryItem) => i.case_id !== response.case_id)].slice(0, 20)
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignored localStorage error
      }

      // Scroll mượt xuống khối kết quả
      setTimeout(() => {
        window.scrollTo({ top: 400, behavior: 'smooth' })
      }, 100)
    } catch (err: unknown) {
      setApiError(normalizeApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tiêu đề & Giới thiệu triết học */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Hệ Thống Suy Luận Tri Thức Dịch Học — Mai Hoa Dịch Số</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Cổng Chiêm Đoán & Luận Giải Quẻ Dịch
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Ứng dụng nguyên lý âm dương tiêu trưởng, ngũ hành sinh khắc của Thiệu Ung (Nhà Tống) kết hợp bộ luật suy luận logic AST an toàn và diễn giải chuyên gia có kiểm toán.
        </p>
      </div>

      {/* Hiển thị lỗi chuẩn hóa nếu có */}
      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold flex items-center gap-2">
              <span>{apiError.code}</span>
              <span className="text-stone-400">|</span>
              <span>Lỗi máy chủ</span>
            </div>
            <p className="leading-relaxed">{apiError.message}</p>
          </div>
        </div>
      )}

      {/* Grid: Form gieo quẻ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5">
          <DivinationForm onSubmit={handleDivinationSubmit} isLoading={isLoading} />
        </div>

        {/* Khối kết quả luận giải */}
        <div className="lg:col-span-7">
          {result ? (
            <DivinationResult
              data={result}
              topic={currentTopic}
              onOpenFeedbackModal={(caseId) => setFeedbackCaseId(caseId)}
            />
          ) : (
            <div className="p-12 border-2 border-dashed border-stone-200 rounded-xl text-center bg-white/50 text-stone-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-300 font-serif text-2xl font-bold">
                卦
              </div>
              <div className="font-serif font-semibold text-stone-600 text-base">
                Chưa có dữ liệu quẻ chiêm
              </div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                Vui lòng chọn chủ đề và bấm nút <strong className="text-amber-900">“Khởi Chiêm Lập Quẻ”</strong> ở khung bên trái để nhận luận giải tiến trình 3 quẻ và phân rã điểm ngũ hành.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử ca gieo quẻ & Vòng lặp học tập đôi */}
      <CastingHistorySection />

      {/* Feedback Modal */}
      {feedbackCaseId && (
        <FeedbackModal
          caseId={feedbackCaseId}
          isOpen={true}
          onClose={() => setFeedbackCaseId(null)}
        />
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { RoleGuard } from '@/auth/RoleGuard'
import { useAuth } from '@/auth/AuthContext'
import { submitInterpretation } from '@/api/governance.api'
import {
  TargetType,
  AuthorType,
  InterpretationSubmissionRequest,
  SubmissionResponse,
} from '@/types/governance.types'
import { TOPIC_LABELS } from '@/i18n/topics'
import { Topic } from '@/types/divination.types'
import hexagramIndex from '@/data/hexagram-index.json'
import { CheckCircle2, Clock, Info, ShieldAlert, Sparkles, BookOpen, Bot } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

// Danh mục 16 nguồn chính thức đã thẩm định và lưu trong bảng `sources` của Tầng 1
export interface RecognizedSource {
  id: number
  kind: 'AI_MODEL' | 'BOOK' | 'EXPERT_PERSON'
  title: string
  author?: string
}

export const RECOGNIZED_SOURCES: RecognizedSource[] = [
  { id: 1, kind: 'AI_MODEL', title: 'Gemini 3.8 Flash + Knowledge Extractor Prompt (Mô hình AI)', author: 'Google DeepMind (2026)' },
  { id: 2, kind: 'BOOK', title: 'Tập 9. Quốc Văn Chu Dịch Diễn Giải', author: 'Phan Bội Châu' },
  { id: 3, kind: 'BOOK', title: 'Kinh Dịch Diễn Giảng', author: 'Kiều Xuân Dũng (2006)' },
  { id: 4, kind: 'BOOK', title: 'Dịch Học Tinh Hoa', author: 'Nguyễn Duy Cần (1992)' },
  { id: 5, kind: 'BOOK', title: 'Chu Dịch - Khả Năng Phát Hiện (Quyển 1)', author: 'Dương Kiện Toàn (2003)' },
  { id: 6, kind: 'BOOK', title: 'Dịch Kinh Đại Toàn Tập I - Dịch Kinh Yếu Chỉ', author: 'Nguyễn Văn Thọ, Huyền Linh Yến Lê' },
  { id: 7, kind: 'BOOK', title: 'Dịch Kinh Đại Toàn - Thượng Kinh', author: 'Nguyễn Văn Thọ, Huyền Linh Yến Lê' },
  { id: 8, kind: 'BOOK', title: 'Dịch Kinh Đại Toàn - Hạ Kinh', author: 'Nguyễn Văn Thọ, Huyền Linh Yến Lê' },
  { id: 9, kind: 'BOOK', title: 'Lược Giải Kinh Dịch', author: 'Dương Đình Khuê' },
  { id: 10, kind: 'BOOK', title: 'Dịch Tự Bản Nghĩa', author: 'Trần Mạnh Linh' },
  { id: 11, kind: 'BOOK', title: 'Đường Vào Dịch', author: 'Nguyên K (2015)' },
  { id: 12, kind: 'BOOK', title: 'Dịch Lý Và Phương Pháp Luận', author: 'Quảng Đức' },
  { id: 13, kind: 'BOOK', title: 'Ý Nghĩa Của 64 Dịch Tượng và 384 Hào', author: 'Khuyết danh' },
  { id: 14, kind: 'BOOK', title: 'Kinh Dịch - Đạo Của Người Quân Tử', author: 'Nguyễn Hiến Lê' },
  { id: 15, kind: 'BOOK', title: 'Mai Hoa Dịch Số', author: 'Thiệu Ung (Bắc Tống)' },
  { id: 16, kind: 'BOOK', title: 'Tuyển Tập Bài Viết Kinh Dịch Chọn Lọc (Số 1 - 16)', author: 'Nhiều tác giả (2026)' },
]

export const ContributePage: React.FC = () => {
  const { role, userId, reviewerName, recordSubmission, canReview } = useAuth()
  const [searchParams] = useSearchParams()

  const hexParam = searchParams.get('hexagram_id')
  const topicParam = searchParams.get('topic')
  const parsedHex = hexParam ? parseInt(hexParam, 10) : NaN
  const initialHexId = !isNaN(parsedHex) && parsedHex >= 1 && parsedHex <= 64 ? parsedHex : 1
  const validTopics = ['GENERAL', 'CAREER', 'FINANCE', 'RELATIONSHIP', 'HEALTH', 'ACADEMIC']
  const initialTopic = topicParam && validTopics.includes(topicParam) ? topicParam : 'CAREER'

  // Form State
  const [targetType, setTargetType] = useState<TargetType>('HEXAGRAM')
  const [hexagramId, setHexagramId] = useState<number>(initialHexId)
  const [linePosition, setLinePosition] = useState<number>(1)
  const [movingLinePosition, setMovingLinePosition] = useState<number>(1)
  const [toHexagramId, setToHexagramId] = useState<number>(2)
  const [topic, setTopic] = useState<string>(initialTopic)
  const [summary, setSummary] = useState<string>('')
  const [guidance, setGuidance] = useState<string>('')
  const [polarity, setPolarity] = useState<number>(1)
  const [sourceId, setSourceId] = useState<number>(1)
  const [authorType, setAuthorType] = useState<AuthorType>('EXPERT')
  const [authorName, setAuthorName] = useState<string>(
    role === 'REVIEWER' || role === 'ADMIN' ? reviewerName : userId
  )

  // Request State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validate client-side
    if (summary.trim().length < 5) {
      setErrorMsg('Tóm tắt ý nghĩa (summary) phải có ít nhất 5 ký tự.')
      return
    }
    if (guidance.trim().length < 5) {
      setErrorMsg('Lời khuyên hành động (guidance) phải có ít nhất 5 ký tự.')
      return
    }

    const payload: InterpretationSubmissionRequest = {
      target_type: targetType,
      hexagram_id: hexagramId,
      line_position: targetType === 'LINE' ? linePosition : null,
      moving_line_position: targetType === 'TRANSFORMATION' ? movingLinePosition : null,
      to_hexagram_id: targetType === 'TRANSFORMATION' ? toHexagramId : null,
      topic,
      summary: summary.trim(),
      guidance: guidance.trim(),
      polarity,
      source_id: sourceId,
      author_type: authorType,
      author_name: authorName.trim() || undefined,
    }

    try {
      setIsSubmitting(true)
      const res = await submitInterpretation(payload)
      setSubmissionResult(res)
      // Lưu lại ID vào danh sách bài đã nộp của phiên (chống tự duyệt)
      recordSubmission(res.interpretation_id)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || ''
      if (
        msg.includes('author_type khong khop source_kind') ||
        msg.includes('trg_check_author_type')
      ) {
        setErrorMsg(
          'Lỗi toàn vẹn dữ liệu (Trigger trg_check_author_type): Phân loại tác quyền "' +
            authorType +
            '" không tương thích với loại nguồn tham chiếu #' +
            sourceId +
            ' trong cơ sở dữ liệu. Nếu đóng góp bản thảo AI, vui lòng chọn nguồn #1 (AI_MODEL). (Lưu ý: cơ sở dữ liệu hiện tại chỉ lưu trữ nguồn AI_MODEL và BOOK).'
        )
      } else if (
        msg.includes('FOREIGN KEY') ||
        msg.includes('fk_interp') ||
        msg.includes('khóa ngoại')
      ) {
        setErrorMsg(
          'Lỗi khóa ngoại (Foreign Key Constraint): Mã nguồn (source_id=' +
            sourceId +
            ') hoặc quẻ tham chiếu không tồn tại trong hệ thống.'
        )
      } else {
        setErrorMsg(msg || 'Có lỗi xảy ra khi gửi bài đóng góp.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSummary('')
    setGuidance('')
    setSubmissionResult(null)
    setErrorMsg(null)
  }

  return (
    <RoleGuard requiredPermission="submit">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Breadcrumb & KMS Theory */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Mô-đun 5 · Cổng Kiểm duyệt & Kiến tạo Tri thức (McElroy 1999)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Đóng Góp Diễn Giải Tri Thức Mới
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Mọi bài đóng góp từ người hành dụng và chuyên gia sẽ được đưa vào hàng đợi{' '}
            <span className="font-semibold text-amber-800">PENDING</span> để Hội đồng thẩm định kiểm duyệt trước khi trở thành tri thức chính thức.
          </p>
        </div>

        {submissionResult ? (
          /* Thành công: Thông báo PENDING & Ghi nhận phiên */
          <div className="bg-white border-2 border-amber-300 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-full flex-shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-stone-900">Tiếp nhận thành công!</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    PENDING · Chờ thẩm định
                  </span>
                </div>
                <p className="text-sm text-stone-600">
                  Mã bài diễn giải: <strong className="text-stone-900">#{submissionResult.interpretation_id}</strong>
                </p>
              </div>
            </div>

            {/* KMS Theoretical Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold">
                <Info className="w-4 h-4 flex-shrink-0 text-amber-700" />
                <span>Quy trình Kiến tạo Tri thức (McElroy Knowledge Life Cycle 1999)</span>
              </div>
              <p className="leading-relaxed">
                Diễn giải này <strong>CHƯA PHẢI</strong> tri thức chính thức. Theo nguyên lý <em>Separation of Concerns</em> và <em>Validation Gate</em>, bài đã được lưu vào phiên làm việc của bạn. Nếu bạn là Kiểm duyệt viên (Reviewer), hệ thống sẽ <strong>chặn quyền tự phê duyệt</strong> bài này (BCR-004) nhằm đảm bảo tính khách quan của kho tri thức.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-sm transition-colors"
              >
                Đóng góp thêm bài diễn giải khác
              </button>
              {canReview && (
                <Link
                  to="/review"
                  className="px-4 py-2 text-sm font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Chuyển tới Hàng đợi kiểm duyệt
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Form đóng góp */
          <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Target Type Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                1. Cấp độ diễn giải (Target Type)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'HEXAGRAM', label: 'Quẻ Kép (HEXAGRAM)', desc: 'Ý nghĩa tổng quan quẻ' },
                  { value: 'LINE', label: 'Từng Hào (LINE)', desc: 'Ý nghĩa theo hào vị cụ thể (1–7)' },
                  { value: 'TRANSFORMATION', label: 'Biến Hóa (TRANSFORMATION)', desc: 'Chuyển quẻ khi động hào' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTargetType(t.value as TargetType)}
                    className={`p-3 text-left rounded-lg border text-sm transition-all ${
                      targetType === t.value
                        ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600 font-medium'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <div className="font-semibold text-stone-900">{t.label}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Quẻ & Tọa độ theo Target Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              {/* Hexagram ID */}
              <div>
                <label htmlFor="hexagram-select" className="block text-xs font-semibold text-stone-700 mb-1">
                  Quẻ chủ đạo (hexagram_id)
                </label>
                <select
                  id="hexagram-select"
                  value={hexagramId}
                  onChange={(e) => setHexagramId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {hexagramIndex.map((h) => (
                    <option key={h.hexagram_id} value={h.hexagram_id}>
                      #{h.hexagram_id} · {h.name_vn} ({h.name_han})
                    </option>
                  ))}
                </select>
              </div>

              {/* LINE: line_position (1..7) */}
              {targetType === 'LINE' && (
                <div>
                  <label htmlFor="line-position-select" className="block text-xs font-semibold text-stone-700 mb-1">
                    Vị trí hào (line_position: 1–7)
                  </label>
                  <select
                    id="line-position-select"
                    value={linePosition}
                    onChange={(e) => setLinePosition(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={1}>Hào Sơ (Vị trí 1)</option>
                    <option value={2}>Hào Nhị (Vị trí 2)</option>
                    <option value={3}>Hào Tam (Vị trí 3)</option>
                    <option value={4}>Hào Tứ (Vị trí 4)</option>
                    <option value={5}>Hào Ngũ (Vị trí 5)</option>
                    <option value={6}>Hào Thượng (Vị trí 6)</option>
                    <option value={7}>Hào 7 (Dụng Cửu / Dụng Lục)</option>
                  </select>
                </div>
              )}

              {/* TRANSFORMATION: moving_line_position (1..6) and to_hexagram_id (1..64) */}
              {targetType === 'TRANSFORMATION' && (
                <>
                  <div>
                    <label htmlFor="moving-line-select" className="block text-xs font-semibold text-stone-700 mb-1">
                      Hào động (moving_line_position: 1–6)
                    </label>
                    <select
                      id="moving-line-select"
                      value={movingLinePosition}
                      onChange={(e) => setMovingLinePosition(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((p) => (
                        <option key={p} value={p}>
                          Hào {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="to-hexagram-select" className="block text-xs font-semibold text-stone-700 mb-1">
                      Quẻ biến (to_hexagram_id: 1–64)
                    </label>
                    <select
                      id="to-hexagram-select"
                      value={toHexagramId}
                      onChange={(e) => setToHexagramId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {hexagramIndex.map((h) => (
                        <option key={h.hexagram_id} value={h.hexagram_id}>
                          #{h.hexagram_id} · {h.name_vn} ({h.name_han})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* 3. Topic & Polarity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label htmlFor="topic-select" className="block text-xs font-semibold text-stone-700 mb-1">
                  Chủ đề ứng dụng (Topic)
                </label>
                <select
                  id="topic-select"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {(Object.keys(TOPIC_LABELS) as Topic[]).map((tCode) => (
                    <option key={tCode} value={tCode}>
                      {TOPIC_LABELS[tCode]} ({tCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="polarity-select" className="block text-xs font-semibold text-stone-700 mb-1">
                  Định hướng Cát / Hung (Polarity: -2 đến +2)
                </label>
                <select
                  id="polarity-select"
                  value={polarity}
                  onChange={(e) => setPolarity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={2}>+2 · Đại Cát (Rất thuận lợi)</option>
                  <option value={1}>+1 · Cát (Thuận lợi)</option>
                  <option value={0}>0 · Bình hòa (Trung tính)</option>
                  <option value={-1}>-1 · Hung (Bất lợi)</option>
                  <option value={-2}>-2 · Đại Hung (Rất bất lợi)</option>
                </select>
              </div>
            </div>

            {/* 4. Summary & Guidance */}
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <div>
                <label htmlFor="summary-input" className="block text-xs font-semibold text-stone-700 mb-1">
                  Tóm tắt ý nghĩa (summary) <span className="text-red-500">*</span> (tối thiểu 5 ký tự)
                </label>
                <textarea
                  id="summary-input"
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Nhập ý nghĩa biểu tượng, hoàn cảnh và thông điệp cốt lõi..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="guidance-input" className="block text-xs font-semibold text-stone-700 mb-1">
                  Lời khuyên hành động (guidance) <span className="text-red-500">*</span> (tối thiểu 5 ký tự)
                </label>
                <textarea
                  id="guidance-input"
                  rows={3}
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                  placeholder="Nhập chỉ dẫn hành vi, thái độ ứng xử và giải pháp thực tế..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {/* 5. Provenance Metadata (Author & Source) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100 text-xs">
              <div>
                <label htmlFor="author-type-select" className="block font-semibold text-stone-700 mb-1">
                  Phân loại tác quyền (author_type)
                </label>
                <select
                  id="author-type-select"
                  value={authorType}
                  onChange={(e) => {
                    const nextType = e.target.value as AuthorType
                    setAuthorType(nextType)
                    if (nextType === 'AI_DRAFT') {
                      setSourceId(1)
                    } else if (nextType === 'CLASSIC' && sourceId === 1) {
                      setSourceId(2)
                    }
                  }}
                  className="w-full px-2.5 py-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="EXPERT">EXPERT · Chuyên gia thực hành</option>
                  <option value="AI_DRAFT">AI_DRAFT · Bản thảo gợi ý từ AI</option>
                  {role === 'ADMIN' ? (
                    <option value="CLASSIC">CLASSIC · Kinh điển (Đã nạp Tầng 1)</option>
                  ) : (
                    <option value="CLASSIC" disabled>
                      CLASSIC · Kinh điển (Khóa: Chỉ ADMIN)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="author-name-input" className="block font-semibold text-stone-700 mb-1">
                  Định danh tác giả (author_name)
                </label>
                <input
                  id="author-name-input"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-2.5 py-2 border border-stone-300 rounded-lg"
                  placeholder="VD: Expert_NguyenVanA"
                />
              </div>

              <div>
                <label htmlFor="source-id-select" className="block font-semibold text-stone-700 mb-1">
                  Nguồn tham chiếu (source_id)
                </label>
                <select
                  id="source-id-select"
                  value={sourceId}
                  onChange={(e) => setSourceId(Number(e.target.value))}
                  className="w-full px-2.5 py-2 border border-stone-300 rounded-lg bg-white text-xs truncate"
                >
                  <optgroup label="Mô hình Trí Tuệ Nhân Tạo (AI_MODEL)">
                    {RECOGNIZED_SOURCES.filter((s) => s.kind === 'AI_MODEL').map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · {s.title}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Sách & Kinh Điển Đã Thẩm Định (BOOK)">
                    {RECOGNIZED_SOURCES.filter((s) => s.kind === 'BOOK').map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · {s.title} ({s.author || 'Cổ điển'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Nhãn cảnh báo nổi bật khi chọn AI_DRAFT */}
              {authorType === 'AI_DRAFT' && (
                <div className="sm:col-span-3 p-3 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5 animate-fadeIn">
                  <Bot className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-blue-950">Nhãn cảnh báo Bản thảo AI (AI_DRAFT): </strong>
                    Nội dung này được sinh hoặc trích xuất tự động từ mô hình AI (Nguồn #1). Theo quy chuẩn
                    Kiến tạo Tri thức (McElroy 1999), bản thảo bắt buộc phải qua Hội đồng thẩm định độc lập
                    phê duyệt (Validation Gate) và không được xem là tri thức thẩm quyền trước khi thông qua.
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Trạng thái ban đầu luôn là <strong className="text-amber-800">PENDING</strong>.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi bài...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gửi bài đóng góp (PENDING)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </RoleGuard>
  )
}

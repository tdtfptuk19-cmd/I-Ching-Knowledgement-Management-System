import React, { useState, useEffect, useTransition } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchKnowledge } from '@/api/search.api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/auth/AuthContext'
import { TOPIC_I18N } from '@/i18n/labels'
import { UserLevel } from '@/types/divination.types'
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  RotateCcw,
} from 'lucide-react'

const TOPIC_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tất cả chủ đề' },
  { value: 'GENERAL', label: 'Tổng quát (GENERAL)' },
  { value: 'CAREER', label: 'Sự nghiệp (CAREER)' },
  { value: 'FINANCE', label: 'Tài chính (FINANCE)' },
  { value: 'HEALTH', label: 'Sức khỏe (HEALTH)' },
  { value: 'RELATIONSHIP', label: 'Tình cảm (RELATIONSHIP)' },
  { value: 'ACADEMIC', label: 'Học tập (ACADEMIC)' },
]

const TRIGRAM_OPTIONS = [
  { value: '', label: 'Tất cả quái' },
  { value: 'Càn', label: 'Càn (Trời / Kim)' },
  { value: 'Đoài', label: 'Đoài (Đầm / Kim)' },
  { value: 'Ly', label: 'Ly (Lửa / Hỏa)' },
  { value: 'Chấn', label: 'Chấn (Sấm / Mộc)' },
  { value: 'Tốn', label: 'Tốn (Gió / Mộc)' },
  { value: 'Khảm', label: 'Khảm (Nước / Thủy)' },
  { value: 'Cấn', label: 'Cấn (Núi / Thổ)' },
  { value: 'Khôn', label: 'Khôn (Đất / Thổ)' },
]

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { userLevel: authUserLevel } = useAuth()
  const [, startTransition] = useTransition()

  // Đọc params khởi tạo từ URL
  const initialQ = searchParams.get('q') || ''
  const initialTopic = searchParams.get('topic') || ''
  const initialUpper = searchParams.get('upper_trigram') || ''
  const initialLower = searchParams.get('lower_trigram') || ''
  const initialLevel = (searchParams.get('user_level') as UserLevel) || authUserLevel || 'NOVICE'
  const initialPage = parseInt(searchParams.get('page') || '1', 10)

  // Local state cho input để debounce
  const [queryInput, setQueryInput] = useState(initialQ)
  const debouncedQuery = useDebounce(queryInput, 300)

  const [topic, setTopic] = useState(initialTopic)
  const [upperTrigram, setUpperTrigram] = useState(initialUpper)
  const [lowerTrigram, setLowerTrigram] = useState(initialLower)
  const [userLevel, setUserLevel] = useState<UserLevel>(initialLevel)
  const [page, setPage] = useState(initialPage)

  // Đồng bộ debouncedQuery và các filters vào URL searchParams
  useEffect(() => {
    startTransition(() => {
      const nextParams = new URLSearchParams()
      if (debouncedQuery.trim()) nextParams.set('q', debouncedQuery.trim())
      if (topic) nextParams.set('topic', topic)
      if (upperTrigram) nextParams.set('upper_trigram', upperTrigram)
      if (lowerTrigram) nextParams.set('lower_trigram', lowerTrigram)
      if (userLevel) nextParams.set('user_level', userLevel)
      if (page > 1) nextParams.set('page', String(page))

      setSearchParams(nextParams, { replace: true })
    })
  }, [debouncedQuery, topic, upperTrigram, lowerTrigram, userLevel, page, setSearchParams])

  // Gọi API tìm kiếm
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['search', debouncedQuery, topic, upperTrigram, lowerTrigram, userLevel, page],
    queryFn: () =>
      searchKnowledge({
        q: debouncedQuery.trim() || undefined,
        topic: topic || undefined,
        upper_trigram: upperTrigram || undefined,
        lower_trigram: lowerTrigram || undefined,
        user_level: userLevel,
        page,
        page_size: 10,
      }),
  })

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setQueryInput('')
    setTopic('')
    setUpperTrigram('')
    setLowerTrigram('')
    setPage(1)
  }

  // Chuyển trang
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Khung tìm kiếm chính */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-700" />
            <span>Tra Cứu & Tìm Kiếm Tri Thức Toàn Văn</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Hỗ trợ tìm kiếm tiếng Việt không dấu (can/càn), nguyên tác Chữ Hán (乾, 君子), lọc đa chiều theo chủ đề và Bát quái Thượng / Hạ.
          </p>
        </div>

        {/* Thanh tìm kiếm chính có Debounce */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            role="searchbox"
            value={queryInput}
            onChange={e => {
              setQueryInput(e.target.value)
              setPage(1) // Reset trang khi đổi từ khóa
            }}
            placeholder="Nhập từ khóa tìm kiếm (ví dụ: 'can', 'càn', 'quân tử', '乾', 'hanh lợi trinh')..."
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-sans"
          />
          {queryInput && (
            <button
              type="button"
              onClick={() => {
                setQueryInput('')
                setPage(1)
              }}
              className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              title="Xóa từ khóa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Gợi ý từ khóa nhanh (Quick Search Chips) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-stone-600 text-xs font-medium mr-1">Gợi ý từ khóa:</span>
          {['Thuần Càn', 'can', 'quân tử', '乾', 'Lôi Thủy Giải', 'thiên hành kiện'].map(keyword => (
            <button
              key={keyword}
              type="button"
              onClick={() => {
                setQueryInput(keyword)
                setPage(1)
              }}
              className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition font-sans"
            >
              {keyword}
            </button>
          ))}
        </div>

        {/* Hàng bộ lọc đa chiều (Filters) */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Lọc Chủ đề */}
          <div>
            <label htmlFor="topic-select" className="block text-xs uppercase font-bold text-stone-600 mb-1">
              Chủ Đề Áp Dụng
            </label>
            <select
              id="topic-select"
              value={topic}
              onChange={e => {
                setTopic(e.target.value)
                setPage(1)
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {TOPIC_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Quái Thượng */}
          <div>
            <label htmlFor="upper-select" className="block text-xs uppercase font-bold text-stone-600 mb-1">
              Quái Thượng (Quẻ Trên)
            </label>
            <select
              id="upper-select"
              value={upperTrigram}
              onChange={e => {
                setUpperTrigram(e.target.value)
                setPage(1)
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {TRIGRAM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Quái Hạ */}
          <div>
            <label htmlFor="lower-select" className="block text-xs uppercase font-bold text-stone-600 mb-1">
              Quái Hạ (Quẻ Dưới)
            </label>
            <select
              id="lower-select"
              value={lowerTrigram}
              onChange={e => {
                setLowerTrigram(e.target.value)
                setPage(1)
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {TRIGRAM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cấp độ người dùng (Cá nhân hóa) */}
          <div>
            <label htmlFor="userlevel-select" className="block text-xs uppercase font-bold text-stone-600 mb-1">
              Cấp Độ Tri Thức
            </label>
            <select
              id="userlevel-select"
              value={userLevel}
              onChange={e => {
                setUserLevel(e.target.value as UserLevel)
                setPage(1)
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold text-amber-900"
            >
              <option value="NOVICE">NOVICE (Ẩn Hán tự)</option>
              <option value="PRACTITIONER">PRACTITIONER (Thực hành)</option>
              <option value="EXPERT">EXPERT (Đủ Hán tự & Kiểm toán)</option>
            </select>
          </div>
        </div>

        {/* Nút đặt lại bộ lọc */}
        {(queryInput || topic || upperTrigram || lowerTrigram) && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc và đặt lại</span>
            </button>
          </div>
        )}
      </div>

      {/* Trạng thái Loading / Fetching */}
      {isLoading && (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3 shadow-sm" aria-live="polite">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
          <p className="text-stone-600 text-sm">Đang tìm kiếm tri thức trong Cổng Kinh Dịch...</p>
        </div>
      )}

      {/* Lỗi */}
      {error && !isLoading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2" aria-live="polite">
          <h3 className="font-bold text-rose-900">Đã xảy ra lỗi khi tìm kiếm</h3>
          <p className="text-xs text-rose-700">{(error as Error)?.message}</p>
        </div>
      )}

      {/* KẾT QUẢ TÌM KIẾM */}
      {data && !isLoading && (
        <div className="space-y-4" aria-live="polite">
          {/* Header kết quả */}
          <div className="flex items-center justify-between text-xs text-stone-600 px-1">
            <div>
              Tìm thấy <span className="font-bold text-stone-900">{data.total}</span> kết quả
              {debouncedQuery && <span> cho từ khóa "{debouncedQuery}"</span>}
              {isFetching && <span className="ml-2 text-amber-600 font-semibold">(Đang làm mới...)</span>}
            </div>
            {data.total_pages > 1 && (
              <div>
                Trang <span className="font-bold text-stone-900">{data.page}</span> / {data.total_pages}
              </div>
            )}
          </div>

          {/* TRƯỜNG HỢP RỖNG: EMPTY STATE */}
          {data.items.length === 0 ? (
            <div className="p-12 bg-white border border-stone-200 rounded-xl text-center space-y-3 shadow-sm">
              <FileQuestion className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="font-serif font-bold text-stone-800 text-base">
                Không tìm thấy kết quả nào phù hợp
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Hệ thống hỗ trợ cơ chế bỏ dấu tiếng Việt tự động. Hãy thử tìm từ khóa dạng không dấu như{' '}
                <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">can</code> thay vì{' '}
                <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">càn</code>, hoặc thử tìm theo tên quẻ
                hay ký tự Chữ Hán như <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">乾</code>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100 transition font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Đặt lại toàn bộ bộ lọc</span>
                </button>
              </div>
            </div>
          ) : (
            /* DANH SÁCH THẺ KẾT QUẢ */
            <div className="space-y-3">
              {data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-stone-200 rounded-xl shadow-sm hover:border-amber-400 transition space-y-2.5"
                >
                  {/* Header card kết quả */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          item.item_type === 'CLASSIC_TEXT'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {item.item_type === 'CLASSIC_TEXT' ? 'Kinh Văn Cổ Điển' : 'Diễn Giải Chuyên Gia'}
                      </span>

                      <Link
                        to={`/hexagrams/${item.hexagram_id}`}
                        className="font-serif font-bold text-sm text-stone-900 hover:text-amber-700 transition"
                      >
                        Quẻ #{item.hexagram_id}: {item.hexagram_name}
                      </Link>

                      {item.line_position && (
                        <span className="text-xs font-semibold text-rose-700 font-mono">
                          (Hào {item.line_position})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.topic && (
                        <span
                          className="text-xs font-mono px-1.5 py-0.5 bg-stone-100 rounded text-stone-700"
                          title={TOPIC_I18N[item.topic]?.description}
                        >
                          {TOPIC_I18N[item.topic]?.label || item.topic}
                        </span>
                      )}
                      <Link
                        to={`/hexagrams/${item.hexagram_id}`}
                        className="text-xs text-amber-700 font-bold hover:underline"
                      >
                        Xem chi tiết quẻ →
                      </Link>
                    </div>
                  </div>

                  {/* Tiêu đề mục */}
                  <h4 className="font-semibold text-xs text-stone-800">{item.title}</h4>

                  {/* Chữ Hán nguyên tác (chỉ hiện khi EXPERT và có content_han) */}
                  {userLevel === 'EXPERT' && item.content_han && (
                    <div
                      lang="zh-Hant"
                      className="p-2.5 bg-amber-50/60 rounded border border-amber-200/70 font-han font-serif text-sm text-stone-800"
                    >
                      <span className="text-xs font-mono text-amber-800 font-bold mr-2 uppercase">
                        Hán tự:
                      </span>
                      {item.content_han}
                    </div>
                  )}

                  {/* Nội dung tiếng Việt */}
                  <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line font-sans">
                    {item.content}
                  </p>

                  {/* Metadata kiểm toán cho EXPERT */}
                  {userLevel === 'EXPERT' && item.provenance && (
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs text-stone-600 font-mono">
                      {item.provenance.source_ref && (
                        <span>Tham chiếu: {String(item.provenance.source_ref)}</span>
                      )}
                      {item.provenance.confidence && (
                        <span>Độ tin cậy: {String(item.provenance.confidence)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PHÂN TRANG (PAGINATION) */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4 text-stone-600" />
              </button>

              <span className="text-xs text-stone-600 font-medium px-2">
                Trang <span className="font-bold text-stone-900">{page}</span> / {data.total_pages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(data.total_pages, page + 1))}
                disabled={page >= data.total_pages}
                className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4 text-stone-600" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

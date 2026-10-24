import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RoleGuard } from '@/auth/RoleGuard'
import { useAuth } from '@/auth/AuthContext'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { AUTHOR_TYPE_I18N, TOPIC_I18N } from '@/i18n/labels'
import { getReviewQueue, reviewInterpretation } from '@/api/governance.api'
import { ReviewQueueItem, ReviewRequest } from '@/types/governance.types'
import { ReviewConfirmModal } from './ReviewConfirmModal'
import { formatDateTime } from '@/utils/date.utils'
import {
  ShieldAlert,
  Bot,
  UserCheck,
  Check,
  X,
  Filter,
  Eye,
  Clock,
  BookOpen,
  AlertCircle,
} from 'lucide-react'

export const ReviewQueuePage: React.FC = () => {
  const { reviewerName, isMySubmission } = useAuth()
  const { isTechnicalMode } = useTechnicalMode()
  const queryClient = useQueryClient()

  // Filters & Sorting
  const [topicFilter, setTopicFilter] = useState<string>('ALL')
  const [authorFilter, setAuthorFilter] = useState<string>('ALL')
  const [targetFilter, setTargetFilter] = useState<string>('ALL')
  const [sortField, setSortField] = useState<'created_at' | 'polarity' | 'hexagram_id'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Selected item for details & review
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionItem, setActionItem] = useState<{
    item: ReviewQueueItem
    status: 'APPROVED' | 'REJECTED'
  } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [searchParams] = useSearchParams()
  const initialOpenModal = searchParams.get('open_modal') === 'true'

  // Query Queue
  const {
    data: queue = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reviewQueue'],
    queryFn: getReviewQueue,
  })

  // Mở modal nếu có query param ?open_modal=true (cho demo / kiểm thử)
  useEffect(() => {
    if (initialOpenModal && queue.length > 0 && !actionItem) {
      // Chọn item không phải do mình nộp để demo modal phê duyệt
      const target = queue.find((q) => !isMySubmission(q.interpretation_id)) || queue[0]
      setActionItem({ item: target, status: 'APPROVED' })
    }
  }, [initialOpenModal, queue, actionItem, isMySubmission])

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ReviewRequest }) => {
      return reviewInterpretation(id, payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviewQueue'] })
      setActionItem(null)
      setToastMessage(data.message || `Đã xử lý bài đóng góp #${data.interpretation_id} (${data.review_status})`)
      setTimeout(() => setToastMessage(null), 5000)
    },
  })

  // Filter & Sort Logic
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        if (topicFilter !== 'ALL' && item.topic !== topicFilter) return false
        if (authorFilter !== 'ALL' && item.author_type !== authorFilter) return false
        if (targetFilter !== 'ALL' && item.target_type !== targetFilter) return false
        return true
      })
      .sort((a, b) => {
        let diff = 0
        if (sortField === 'created_at') {
          diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        } else if (sortField === 'polarity') {
          diff = a.polarity - b.polarity
        } else if (sortField === 'hexagram_id') {
          diff = a.hexagram_id - b.hexagram_id
        }
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [queue, topicFilter, authorFilter, targetFilter, sortField, sortOrder])

  return (
    <RoleGuard requiredPermission="review">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm animate-bounce">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Mô-đun 5 · Cổng Thẩm Định Chuyên Gia (Validation Gate - McElroy 1999)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Hàng Đợi Kiểm Duyệt Tri Thức (Review Queue)
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Người kiểm duyệt: <strong className="text-amber-800">{reviewerName}</strong> · Đang chờ duyệt:{' '}
              <span className="font-semibold">{queue.length}</span> bài
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-xs text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Chặn tự duyệt (BCR-004):</strong> Hệ thống tự động vô hiệu hóa nút duyệt đối với các bài do bạn đóng góp trong phiên.
            </span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
              <Filter className="w-4 h-4" />
              <span>Bộ lọc:</span>
            </div>

            {/* Topic Filter */}
            <select
              id="review-topic-filter"
              aria-label="Lọc theo chủ đề"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả chủ đề</option>
              <option value="GENERAL">Chung (GENERAL)</option>
              <option value="CAREER">Sự nghiệp (CAREER)</option>
              <option value="FINANCE">Tài chính (FINANCE)</option>
              <option value="RELATIONSHIP">Tình cảm (RELATIONSHIP)</option>
              <option value="HEALTH">Sức khỏe (HEALTH)</option>
              <option value="ACADEMIC">Học tập (ACADEMIC)</option>
            </select>

            {/* Author Type Filter */}
            <select
              id="review-author-filter"
              aria-label="Lọc theo phân loại tác quyền"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Tất cả tác quyền</option>
              <option value="AI_DRAFT">Bản thảo AI (AI_DRAFT)</option>
              <option value="EXPERT">Chuyên gia (EXPERT)</option>
              <option value="CLASSIC">Kinh điển (CLASSIC)</option>
            </select>

            {/* Target Type Filter */}
            <select
              id="review-target-filter"
              aria-label="Lọc theo cấp độ đối tượng"
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Mọi cấp độ</option>
              <option value="HEXAGRAM">Quẻ kép (HEXAGRAM)</option>
              <option value="LINE">Từng hào (LINE)</option>
              <option value="TRANSFORMATION">Biến hóa (TRANSFORMATION)</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-semibold">Sắp xếp:</span>
            <select
              id="review-sort-field"
              aria-label="Chọn trường sắp xếp danh sách"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'created_at' | 'polarity' | 'hexagram_id')}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800"
            >
              <option value="created_at">Thời gian tạo</option>
              <option value="polarity">Định hướng Cát/Hung</option>
              <option value="hexagram_id">Số thứ tự quẻ</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-700 hover:bg-stone-50"
            >
              {sortOrder === 'asc' ? '↑ Tăng' : '↓ Giảm'}
            </button>
          </div>
        </div>

        {/* Content Table / Queue Items */}
        {isLoading ? (
          <div className="p-12 text-center text-stone-500 bg-white border border-stone-200 rounded-xl">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải hàng đợi kiểm duyệt tri thức...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <div className="font-semibold">Lỗi tải hàng đợi kiểm duyệt</div>
            <p className="text-xs">{(error as Error)?.message || 'Không thể kết nối CSDL.'}</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-stone-500 bg-white border border-stone-200 rounded-xl space-y-2">
            <Check className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-base font-semibold text-stone-800">Hàng đợi đang rỗng!</div>
            <p className="text-xs text-stone-500">
              Không có bài đóng góp nào cần thẩm định khớp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQueue.map((item) => {
              const isSelf = isMySubmission(item.interpretation_id)
              const isExpanded = expandedId === item.interpretation_id
              const isAi = item.author_type === 'AI_DRAFT'

              return (
                <div
                  key={item.interpretation_id}
                  className={`bg-white border rounded-xl transition-all shadow-sm overflow-hidden ${
                    isSelf
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Item Main Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Metadata */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* ID */}
                        <span className="font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                          #{item.interpretation_id}
                        </span>

                        {/* Author Type Badge */}
                        {isAi ? (
                          <span
                            className="px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"
                            title={AUTHOR_TYPE_I18N.AI_DRAFT.description}
                          >
                            <Bot className="w-3 h-3" />
                            {isTechnicalMode ? 'AI_DRAFT · Bản Thảo AI' : 'Bản Thảo AI'}
                            <span className="sr-only">AI_DRAFT</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {AUTHOR_TYPE_I18N[item.author_type]?.label || item.author_type}
                            {isTechnicalMode && (
                              <span className="font-mono text-xs ml-0.5">({item.author_type})</span>
                            )}
                          </span>
                        )}

                        {/* Target Badge */}
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                          {item.target_type === 'HEXAGRAM' && 'Quẻ Toàn Thể'}
                          {item.target_type === 'LINE' && `Hào ${item.line_position}`}
                          {item.target_type === 'TRANSFORMATION' &&
                            `Động Hào ${item.moving_line_position} ➔ Quẻ #${item.to_hexagram_id}`}
                        </span>

                        {/* Topic */}
                        <span
                          className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-medium border border-amber-200"
                          title={TOPIC_I18N[item.topic]?.description}
                        >
                          {TOPIC_I18N[item.topic]?.label || item.topic}
                          {isTechnicalMode && (
                            <span className="font-mono text-xs ml-1">({item.topic})</span>
                          )}
                        </span>

                        {/* Polarity */}
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            item.polarity > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : item.polarity < 0
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-stone-50 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {item.polarity > 0 ? `+${item.polarity} Cát` : item.polarity < 0 ? `${item.polarity} Hung` : '0 Bình hòa'}
                        </span>
                      </div>

                      {/* Quẻ Name & Summary Snippet */}
                      <div className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                        <span>Quẻ #{item.hexagram_id} {item.hexagram_name && `(${item.hexagram_name})`}</span>
                        <span className="text-stone-300">·</span>
                        <span className="text-stone-700 font-normal line-clamp-1">
                          {item.summary}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-stone-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Nộp lúc: {formatDateTime(item.created_at)}</span>
                      </div>
                    </div>

                    {/* Right: Actions / Anti-Self Guard */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                      {/* View Details Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.interpretation_id)}
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                      </button>

                      {/* Anti-Self Guard Warning or Action Buttons */}
                      {isSelf ? (
                        <div
                          className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
                          title="Quy tắc Separation of Concerns (McElroy 1999): Tác giả bài đóng góp trong phiên bị chặn tự phê duyệt bài của chính mình (BCR-004)."
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>Chặn tự duyệt (Tác giả trong phiên)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActionItem({ item, status: 'APPROVED' })}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Phê duyệt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionItem({ item, status: 'REJECTED' })}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 text-xs space-y-4">
                      {/* Summary */}
                      <div>
                        <div className="font-semibold text-stone-800 uppercase tracking-wider text-xs mb-1">
                          Tóm tắt diễn giải (summary):
                        </div>
                        <div className="p-3 bg-white border border-stone-200 rounded-lg text-stone-800 leading-relaxed">
                          {item.summary}
                        </div>
                      </div>

                      {/* Guidance */}
                      <div>
                        <div className="font-semibold text-stone-800 uppercase tracking-wider text-xs mb-1">
                          Lời khuyên hành động (guidance):
                        </div>
                        <div className="p-3 bg-white border border-stone-200 rounded-lg text-stone-800 leading-relaxed">
                          {item.guidance}
                        </div>
                      </div>

                      {/* Technical Meta & References */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-700 pt-2 border-t border-stone-200">
                        <div>
                          <span className="text-stone-600 block">Mã nguồn (source_id):</span>
                          <span className="font-mono font-medium">{item.source_id}</span>
                        </div>
                        <div>
                          <span className="text-stone-600 block">Trạng thái hiện tại:</span>
                          <span className="font-bold text-amber-800">{item.review_status}</span>
                        </div>
                        <div>
                          <span className="text-stone-600 block">Định hướng Cát/Hung:</span>
                          <span className="font-medium">{item.polarity}</span>
                        </div>
                        <div>
                          <span className="text-stone-600 block">Tác quyền:</span>
                          <span className="font-medium">{AUTHOR_TYPE_I18N[item.author_type]?.label || item.author_type}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Confirmation Modal */}
        {actionItem && (
          <ReviewConfirmModal
            item={actionItem.item}
            newStatus={actionItem.status}
            defaultReviewer={reviewerName}
            isOpen={true}
            isSubmitting={reviewMutation.isPending}
            onClose={() => setActionItem(null)}
            onConfirm={async (payload) => {
              await reviewMutation.mutateAsync({
                id: actionItem.item.interpretation_id,
                payload,
              })
            }}
          />
        )}
      </div>
    </RoleGuard>
  )
}

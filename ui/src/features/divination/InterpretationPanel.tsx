import React from 'react'
import { Link } from 'react-router-dom'
import { InterpretationItem, UserLevel } from '@/types/divination.types'
import { AUTHOR_TYPE_I18N, TOPIC_I18N } from '@/i18n/labels'
import { useAuth } from '@/auth/AuthContext'
import { CheckCircle2, Clock, X, PlusCircle, ShieldCheck, Sparkles, BookOpen, History, AlertCircle } from 'lucide-react'

export interface InterpretationPanelProps {
  interpretations: InterpretationItem[]
  topic?: string
  hexagramId?: number
  userLevel?: UserLevel
}

export const InterpretationPanel: React.FC<InterpretationPanelProps> = ({
  interpretations,
  topic,
  hexagramId,
  userLevel,
}) => {
  const { userLevel: authUserLevel, role, canReview, canSubmit } = useAuth()
  const effectiveLevel = userLevel || authUserLevel || (role === 'NOVICE' ? 'NOVICE' : 'EXPERT')
  const isNovice = effectiveLevel === 'NOVICE'

  // Empty State: Quan trọng khi quẻ chưa có diễn giải chuyên đề đã duyệt
  if (!interpretations || interpretations.length === 0) {
    const contributeHref = hexagramId
      ? `/contribute?hexagram_id=${hexagramId}&topic=${topic || 'GENERAL'}`
      : '/contribute'
    const reviewHref = hexagramId
      ? `/review?hexagram_id=${hexagramId}&topic=${topic || 'GENERAL'}`
      : '/review'

    return (
      <div
        data-testid="interpretation-empty-state"
        className="p-6 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 space-y-4 text-center"
      >
        <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 max-w-lg mx-auto">
          <h4 className="font-serif font-bold text-sm text-stone-900">
            Chưa Có Diễn Giải Chuyên Đề Đã Duyệt
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            Chưa có diễn giải chuyên đề nào được duyệt cho quẻ này. Hệ thống đang dùng ngũ hành + kinh văn; điểm số có thể đã được tái chuẩn hóa.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {canSubmit && (
            <Link
              to={contributeHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Đóng góp diễn giải</span>
            </Link>
          )}

          {canReview && (
            <Link
              to={reviewHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-lg transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span>Mở hàng đợi duyệt</span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Nhóm diễn giải theo Topic nếu có nhiều chủ đề
  const topicGroups = interpretations.reduce<Record<string, InterpretationItem[]>>((acc, item) => {
    const key = item.topic || 'GENERAL'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const groupKeys = Object.keys(topicGroups)
  const isMultipleTopics = groupKeys.length > 1

  return (
    <div className="space-y-6" data-testid="interpretation-panel">
      {groupKeys.map((groupTopic) => {
        const topicMeta = TOPIC_I18N[groupTopic]
        const rawItems = topicGroups[groupTopic]

        // Phân nhóm tri thức theo đơn vị (target_type + hexagram_id + line_position + moving_line + to_hexagram)
        const knowledgeUnits = rawItems.reduce<
          Record<string, { latest: InterpretationItem; history: InterpretationItem[] }>
        >((acc, item) => {
          const unitKey = `${item.target_type ?? 'HEXAGRAM'}_${item.hexagram_id}_${item.line_position ?? 'ALL'}_${item.moving_line_position ?? 'ALL'}_${item.to_hexagram_id ?? 'ALL'}`
          if (!acc[unitKey]) {
            acc[unitKey] = { latest: item, history: [] }
          } else {
            const currentLatest = acc[unitKey].latest
            const currentVer = currentLatest.version ?? 1
            const itemVer = item.version ?? 1

            if (itemVer > currentVer) {
              acc[unitKey].history.push(currentLatest)
              acc[unitKey].latest = item
            } else {
              acc[unitKey].history.push(item)
            }
          }
          return acc
        }, {})

        const unitsList = Object.values(knowledgeUnits)

        return (
          <div key={groupTopic} className="space-y-3" data-testid={`topic-group-${groupTopic}`}>
            {isMultipleTopics && (
              <div className="flex items-center gap-2 border-b border-stone-200 pb-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">
                  {topicMeta?.vi || groupTopic} ({unitsList.length})
                </h4>
              </div>
            )}

            <div className="space-y-3">
              {unitsList.map(({ latest: item, history: previousVersions }) => {
                const authorInfo = AUTHOR_TYPE_I18N[item.author_type]
                const authorLabel = authorInfo?.vi || authorInfo?.label || item.author_type
                const sourceLabel = item.source_title || `Source #${item.source_id}`

                // Trạng thái phê duyệt (dùng trực tiếp trường review_status, không tự gán APPROVED nếu thiếu)
                const status = item.review_status
                const statusMap: Record<string, { label: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
                  APPROVED: { label: 'Đã duyệt', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
                  PENDING: { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
                  REJECTED: { label: 'Từ chối', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: X },
                }
                const statusConfig = (status && statusMap[status]) || {
                  label: 'Chưa xác định',
                  bg: 'bg-stone-100 text-stone-700 border-stone-300',
                  icon: AlertCircle,
                }

                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={item.interpretation_id}
                    data-testid={`interpretation-card-${item.interpretation_id}`}
                    className="p-4 bg-stone-50 rounded-lg border border-stone-200/90 space-y-3 text-xs"
                  >
                    {/* Header thông tin quản trị: chỉ hiển thị cho PRACTITIONER & EXPERT (Wiig 1993) */}
                    {!isNovice && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2 text-[11px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Badge Tác Giả */}
                          <span
                            data-testid="author-badge"
                            className="px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 border border-amber-200"
                            title={authorInfo?.description}
                          >
                            {authorLabel}
                          </span>

                          {/* Badge Phiên bản */}
                          {item.version !== undefined && (
                            <span
                              data-testid="version-badge"
                              className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-stone-200 text-stone-700"
                            >
                              Bản #{item.version}
                            </span>
                          )}

                          {/* Badge Trạng thái duyệt động theo review_status */}
                          <span
                            data-testid="status-badge"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] border ${statusConfig.bg}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig.label}</span>
                          </span>
                        </div>

                        {/* Nguồn trích xuất */}
                        <div data-testid="source-label" className="text-stone-500 font-mono text-[10px]">
                          <span>Nguồn: </span>
                          <span className="font-semibold text-stone-700">{sourceLabel}</span>
                        </div>
                      </div>
                    )}

                    {/* Nội dung Diễn Giải Chuyên Đề: summary (đậm) + guidance */}
                    <div className="space-y-1.5">
                      <div className="font-serif font-bold text-sm text-stone-900 leading-snug">
                        {item.summary}
                      </div>
                      <div className="text-stone-700 leading-relaxed whitespace-pre-line">
                        {item.guidance}
                      </div>
                    </div>

                    {/* Vị trí hào nếu diễn giải theo hào */}
                    {item.line_position && (
                      <div className="text-[11px] text-amber-900 font-medium pt-1">
                        Áp dụng riêng cho: Hào {item.line_position}
                      </div>
                    )}

                    {/* Lịch sử các phiên bản trước (nếu có bản sửa đổi) */}
                    {!isNovice && previousVersions.length > 0 && (
                      <details className="mt-2 pt-2 border-t border-stone-200/50 text-[10px] font-mono text-stone-500">
                        <summary className="cursor-pointer hover:text-stone-800 flex items-center gap-1">
                          <History className="w-3 h-3 text-stone-400" />
                          <span>Lịch sử chỉnh sửa ({previousVersions.length} phiên bản trước)</span>
                        </summary>
                        <div className="mt-1.5 space-y-1 pl-3 border-l-2 border-stone-200">
                          {previousVersions.map((pv) => (
                            <div key={pv.interpretation_id} className="text-stone-600">
                              <span className="font-semibold">Bản #{pv.version || 1}:</span> {pv.source_title || `Source #${pv.source_id}`} · {pv.summary.slice(0, 60)}...
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

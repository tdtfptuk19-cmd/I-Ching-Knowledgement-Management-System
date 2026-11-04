import React, { useMemo } from 'react'
import { DivinationResponse, PolarityLabel, Topic } from '@/types/divination.types'
import { POLARITY_CONFIGS } from '@/i18n/polarity'
import { TOPIC_LABELS } from '@/i18n/topics'
import { buildDecisionBrief } from './decisionBrief'
import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Compass,
  Users,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

export interface DecisionBriefCardProps {
  data: DivinationResponse
  topic: Topic
}

/**
 * Thẻ "Bản định hướng hành động" dành cho người dùng phổ thông:
 * cục diện tóm tắt + NÊN LÀM + NÊN TRÁNH + thời hiệu 3–12 tháng.
 * Toàn bộ nội dung suy ra tất định từ kết quả engine (không gọi LLM).
 */
export const DecisionBriefCard: React.FC<DecisionBriefCardProps> = ({ data, topic }) => {
  const brief = useMemo(() => buildDecisionBrief(data, topic), [data, topic])
  const polarity =
    POLARITY_CONFIGS[data.synthesis.polarity_label as PolarityLabel] || POLARITY_CONFIGS['BÌNH HÒA']

  return (
    <section
      aria-labelledby="decision-brief-heading"
      data-testid="decision-brief"
      className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header: cục diện tổng quan */}
      <div className="p-5 bg-gradient-to-r from-amber-50/80 via-white to-white border-b border-stone-100 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
              <span>Bản Định Hướng Hành Động · {TOPIC_LABELS[topic]}</span>
            </div>
            <h3
              id="decision-brief-heading"
              className="font-serif font-bold text-lg text-stone-900 mt-1 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Điều Bạn Nên Làm Ngay</span>
            </h3>
          </div>

          <span
            data-testid="decision-brief-polarity"
            className={`px-3 py-1 rounded-full text-xs font-bold border ${polarity.bgColor} ${polarity.textColor} ${polarity.borderColor}`}
          >
            {polarity.label}
          </span>
        </div>

        <p className="text-sm text-stone-700 leading-relaxed" data-testid="decision-brief-trend">
          {brief.generalTrend}
        </p>
      </div>

      {/* Thời hiệu dự báo */}
      <div className="px-5 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-950">
        <Clock3 className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <span>
          <strong className="font-semibold">Thời hiệu dự báo:</strong> {brief.timeHorizon}
        </span>
      </div>

      {/* Nên làm / Nên tránh */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
          <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Nên Làm</span>
          </h4>
          <ul className="space-y-1.5" data-testid="decision-brief-dos">
            {brief.dos.map((item, idx) => (
              <li key={`do-${idx}`} className="flex items-start gap-2 text-xs text-stone-800 leading-relaxed">
                <span className="mt-0.5 text-emerald-700 font-bold" aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60 space-y-2">
          <h4 className="text-sm font-bold text-orange-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-700" />
            <span>Nên Tránh</span>
          </h4>
          <ul className="space-y-1.5" data-testid="decision-brief-donts">
            {brief.donts.map((item, idx) => (
              <li key={`dont-${idx}`} className="flex items-start gap-2 text-xs text-stone-800 leading-relaxed">
                <span className="mt-0.5 text-orange-700 font-bold" aria-hidden="true">
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Người đồng hành & phương hướng */}
      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/80 flex items-start gap-2">
          <Users className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-stone-700 leading-relaxed">
            <div className="font-semibold text-stone-900">Người đồng hành nên tìm</div>
            <div>{brief.keyPeople}</div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/80 flex items-start gap-2">
          <Compass className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-stone-700 leading-relaxed">
            <div className="font-semibold text-stone-900">Hướng nên ưu tiên</div>
            <div>{brief.favorableDirection}</div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <p className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-600 italic leading-relaxed">
          {brief.philosophyNote}
        </p>
      </div>
    </section>
  )
}

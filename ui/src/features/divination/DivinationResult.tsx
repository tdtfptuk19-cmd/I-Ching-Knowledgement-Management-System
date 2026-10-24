import React, { useState } from 'react'
import { DivinationResponse, Topic } from '@/types/divination.types'
import { useAuth } from '@/auth/AuthContext'
import { HexagramVisual } from './HexagramVisual'
import { ScoreDecomposition } from './ScoreDecomposition'
import { ContentSafetyAlert } from './ContentSafetyAlert'
import { FIVE_ELEMENT_COLORS } from '@/i18n/trigrams'
import {
  Compass,
  Workflow,
  Sparkles,
  Send,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'

interface DivinationResultProps {
  data: DivinationResponse
  topic: Topic
  onOpenFeedbackModal?: (caseId: string) => void
}

export const DivinationResult: React.FC<DivinationResultProps> = ({
  data,
  topic,
  onOpenFeedbackModal,
}) => {
  const { canViewExpert } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'classics' | 'rules' | 'interp'>('overview')

  const theColor = FIVE_ELEMENT_COLORS[data.the_element] || { bg: 'bg-stone-100', text: 'text-stone-900', border: 'border-stone-400' }
  const dungColor = FIVE_ELEMENT_COLORS[data.dung_element] || { bg: 'bg-stone-100', text: 'text-stone-900', border: 'border-stone-400' }

  return (
    <div className="space-y-6">
      {/* 1. Header ca gieo quẻ & Case ID */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-700" />
            <span>Kết Quả Lập Quẻ & Luận Giải Chi Tiết</span>
          </div>
          <div className="font-serif font-bold text-xl text-stone-900 mt-1">
            {data.initial_hexagram.name_vn} ({data.initial_hexagram.name_han}) → {data.transformed_hexagram.name_vn}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Phương pháp: <span className="font-semibold text-stone-700">{data.casting_meta.casting_method}</span> · Hào động: <span className="font-semibold text-rose-600">Hào {data.moving_line}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] font-mono text-stone-400">
            Case ID: <span className="font-semibold text-stone-600">{data.case_id.slice(0, 8)}...</span>
          </div>
          {onOpenFeedbackModal && (
            <button
              type="button"
              onClick={() => onOpenFeedbackModal(data.case_id)}
              className="inline-flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Send className="w-3.5 h-3.5 text-amber-700" />
              <span>Gửi Phản Hồi Thực Chứng (Double-Loop)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CẢNH BÁO AN TOÀN NỘI DUNG (SAFETY ALERT: BẮT BUỘC KHÔNG THỂ ẨN CHO HEALTH / FINANCE) */}
      <ContentSafetyAlert
        topic={topic}
        disclaimer={data.disclaimer}
        adviceBlocks={data.synthesis.advice_blocks}
      />

      {/* 3. ĐỘ PHỦ TRI THỨC (COVERAGE & FALLBACK BANNER) */}
      {data.coverage.fallback_applied && (
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Thông Báo Trạng Thái Tri Thức (Coverage): </span>
            <span>{data.coverage.message}</span>
          </div>
        </div>
      )}

      {/* 4. BA QUẺ CỐT LÕI (INITIAL -> NUCLEAR -> TRANSFORMED) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center justify-between">
          <span>Tiến Trình 3 Quẻ Mai Hoa</span>
          <span className="text-[11px] text-stone-500 font-normal">Quẻ Chủ (Bắt đầu) → Quẻ Hỗ (Diễn biến) → Quẻ Biến (Chung cuộc)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HexagramVisual
            hexagram={data.initial_hexagram}
            movingLine={data.moving_line}
            roleLabel="Quẻ Chủ (Gốc)"
            elementColor="border-amber-700"
            theDungSide={data.dung_side as 'UPPER' | 'LOWER'}
          />

          <HexagramVisual
            hexagram={data.nuclear_hexagram}
            roleLabel="Quẻ Hỗ (Trung gian)"
            elementColor="border-stone-400"
          />

          <HexagramVisual
            hexagram={data.transformed_hexagram}
            roleLabel="Quẻ Biến (Chung cuộc)"
            elementColor="border-emerald-700"
          />
        </div>
      </div>

      {/* 5. PHÂN ĐỊNH THỂ / DỤNG & NGŨ HÀNH */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Workflow className="w-4 h-4 text-amber-700" />
            <span>Phân Định Thể — Dụng & Tương Tác Ngũ Hành Mai Hoa</span>
          </h3>
          <span className="text-xs text-stone-400">Nguồn: Thiệu Ung (Mai Hoa Dịch Số, source_id=15)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Thể */}
          <div className={`p-4 rounded-xl border ${theColor.border} ${theColor.bg} space-y-1`}>
            <div className="text-[11px] uppercase tracking-wider font-bold text-stone-600">
              Chủ Thể (Thể Quái) — Bản Thân / Nội Tại
            </div>
            <div className={`text-xl font-serif font-bold ${theColor.text}`}>
              {data.dung_side === 'UPPER' ? data.initial_hexagram.lower_trigram.name_vn : data.initial_hexagram.upper_trigram.name_vn}
              {' '}
              <span className="text-sm font-sans font-semibold">({data.the_element})</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Thể đại diện cho chủ sự, tâm thế và bản thể của người chiêm quẻ.
            </p>
          </div>

          {/* Dụng */}
          <div className={`p-4 rounded-xl border ${dungColor.border} ${dungColor.bg} space-y-1`}>
            <div className="text-[11px] uppercase tracking-wider font-bold text-stone-600">
              Khách Thể (Dụng Quái) — Ngoại Cảnh / Đối Tác
            </div>
            <div className={`text-xl font-serif font-bold ${dungColor.text}`}>
              {data.dung_side === 'UPPER' ? data.initial_hexagram.upper_trigram.name_vn : data.initial_hexagram.lower_trigram.name_vn}
              {' '}
              <span className="text-sm font-sans font-semibold">({data.dung_element})</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Dụng đại diện cho sự việc bên ngoài, thời cuộc và đối phương cần giao dịch.
            </p>
          </div>
        </div>

        {/* Bảng tương tác ngũ hành qua các chặng */}
        <div className="pt-2">
          <div className="text-xs font-semibold text-stone-700 mb-2">
            Chi Tiết Tương Tác Ngũ Hành 4 Cặp (Chủ · Thượng Hỗ · Hạ Hỗ · Biến):
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2 px-3">Giai đoạn</th>
                  <th className="py-2 px-3">Cặp Ngũ Hành</th>
                  <th className="py-2 px-3">Quan hệ</th>
                  <th className="py-2 px-3">Trọng số</th>
                  <th className="py-2 px-3">Luận giải ý nghĩa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.five_element_analysis.map((rel, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="py-2 px-3 font-semibold text-stone-800 font-mono">{rel.pair}</td>
                    <td className="py-2 px-3">{rel.primary_element} ↔ {rel.target_element}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] bg-stone-100 text-stone-800">
                        {rel.relation_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-stone-900">
                      {rel.polarity_weight >= 0 ? `+${rel.polarity_weight}` : rel.polarity_weight}
                    </td>
                    <td className="py-2 px-3 text-stone-600 leading-relaxed">{rel.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. PHÂN RÃ ĐIỂM MINH BẠCH (SCORE DECOMPOSITION) */}
      <ScoreDecomposition
        synthesis={data.synthesis}
        fallbackApplied={data.coverage.fallback_applied}
      />

      {/* 7. KHỐI LỜI KHUYÊN & ĐỊNH HƯỚNG TƯ DUY (ADVICE BLOCKS) */}
      {data.synthesis.advice_blocks.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Khối Lời Khuyên & Định Hướng Hành Động Thực Tiễn</span>
          </h3>

          <div className="space-y-3">
            {data.synthesis.advice_blocks.map((block, idx) => (
              <div key={idx} className="p-4 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1.5">
                <div className="font-semibold text-xs text-amber-950 flex items-center justify-between">
                  <span>{block.title}</span>
                  {block.provenance?.rule_ref && (
                    <span className="text-[10px] font-mono text-stone-400">
                      Luật: {block.provenance.rule_ref}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                  {block.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TABS NÂNG CAO: KINH VĂN CỔ ĐIỂN & VẾT LUẬT SUY LUẬN (Wiig 1993) */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex border-b border-stone-200 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Kinh Văn Cổ Điển ({data.classic_texts.length})
          </button>

          {canViewExpert && (
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`pb-2 border-b-2 transition flex items-center gap-1 ${
                activeTab === 'rules'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Vết Luật Suy Luận ({data.rules_fired.length}) — Expert</span>
            </button>
          )}
        </div>

        {/* Tab Kinh văn cổ điển */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {data.classic_texts.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Không có kinh văn cổ điển liên kết.</p>
            ) : (
              data.classic_texts.map((ct) => (
                <div key={ct.text_id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-500 text-[11px] border-b border-stone-200/60 pb-1">
                    <span className="font-semibold text-stone-800">
                      {ct.text_type} {ct.line_position ? `(Hào ${ct.line_position})` : ''}
                    </span>
                    <span className="font-mono text-stone-400">ID #{ct.text_id}</span>
                  </div>

                  {/* Chữ Hán chỉ hiển thị cho EXPERT / REVIEWER / ADMIN (Wiig 1993) */}
                  {ct.text_han && canViewExpert && (
                    <div className="font-serif text-sm font-semibold text-stone-900 bg-amber-50/50 p-2 rounded border border-amber-100">
                      {ct.text_han}
                    </div>
                  )}

                  {/* Bản dịch tiếng Việt */}
                  <div className="text-stone-800 leading-relaxed whitespace-pre-line">
                    {ct.text_vn}
                  </div>

                  {/* Siêu dữ liệu học thuật (chỉ hiện cho EXPERT+) */}
                  {canViewExpert && (
                    <div className="pt-1 border-t border-stone-200/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500 font-mono">
                      <span>Nguồn: {ct.source_title || `Source #${ct.source_id}`} {ct.source_ref ? `(${ct.source_ref})` : ''}</span>
                      <span>Duyệt bởi: {ct.verified_by || 'Verified'}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Vết luật suy luận (Expert+) */}
        {activeTab === 'rules' && canViewExpert && (
          <div className="space-y-3">
            {data.rules_fired.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Không có luật DSL nào kích hoạt cho quẻ này.</p>
            ) : (
              data.rules_fired.map((rf) => (
                <div key={rf.rule_id} className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-900">
                      {rf.rule_code} (Ưu tiên: {rf.priority})
                    </span>
                    <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-mono">
                      Rule ID #{rf.rule_id}
                    </span>
                  </div>
                  <div className="text-stone-800 leading-relaxed font-medium">
                    {rf.conclusion}
                  </div>
                  <div className="p-2 bg-white rounded border border-purple-100 font-mono text-[10px] text-stone-600 overflow-x-auto">
                    <pre>{JSON.stringify(rf.trace, null, 2)}</pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

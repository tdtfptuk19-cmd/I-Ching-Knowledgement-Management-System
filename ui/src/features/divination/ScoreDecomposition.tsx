import React, { useState } from 'react'
import { SynthesisResult, PolarityLabel } from '@/types/divination.types'
import { POLARITY_CONFIGS } from '@/i18n/polarity'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { AlertCircle, Scale, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'

interface ScoreDecompositionProps {
  synthesis: SynthesisResult
  fallbackApplied?: boolean
  rulesFiredCount?: number
  interpretationsCount?: number
}

export const ScoreDecomposition: React.FC<ScoreDecompositionProps> = ({
  synthesis,
  fallbackApplied,
  rulesFiredCount,
  interpretationsCount,
}) => {
  const [showAssumptionInfo, setShowAssumptionInfo] = useState(false)
  const { isTechnicalMode } = useTechnicalMode()

  const label = (synthesis.polarity_label || 'BÌNH HÒA') as PolarityLabel
  const config = POLARITY_CONFIGS[label] || POLARITY_CONFIGS['BÌNH HÒA']

  const decomp = synthesis.decomposition || {
    element_score: 0,
    rule_score: 0,
    interpretation_score: 0,
  }

  // Xác định chính xác trạng thái vắng mặt của từng trụ cột
  const isRuleMissing =
    rulesFiredCount !== undefined
      ? rulesFiredCount === 0
      : decomp.rule_score === 0 && Boolean(fallbackApplied)

  const isInterpMissing =
    interpretationsCount !== undefined
      ? interpretationsCount === 0
      : decomp.interpretation_score === 0 && Boolean(fallbackApplied)

  const isFallbackActive = Boolean(fallbackApplied) || isRuleMissing || isInterpMissing

  // Chuyển đổi điểm S [-2, +2] thành phần trăm thanh đo [0%, 100%]
  // S = -2 -> 0%; S = 0 -> 50%; S = +2 -> 100%
  const scorePercent = Math.min(Math.max(((synthesis.score + 2) / 4) * 100, 0), 100)

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header: Điểm số & Nhãn phân cực Cát/Hung */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-700 font-bold flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-700" />
            <span>Tổng Hợp Tri Thức 3 Trụ Cột</span>
            {isTechnicalMode && (
              <span className="text-xs text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono font-bold">
                Three-Pillar Synthesis
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-serif font-bold text-stone-900">
              {synthesis.score >= 0 ? `+${synthesis.score.toFixed(2)}` : synthesis.score.toFixed(2)}
            </span>
            <span className="text-xs text-stone-600 font-medium">Thang đo định lượng [-2.00, +2.00]</span>
          </div>
        </div>

        {/* Polarity Badge */}
        <div className={`px-4 py-2 rounded-lg border-2 ${config.borderColor} ${config.bgColor} flex flex-col items-end`}>
          <div className={`font-serif font-bold text-base ${config.textColor} flex items-center gap-1.5`}>
            <span>{config.nameVi}</span>
          </div>
          <span className="text-xs text-stone-700 font-mono font-medium">{config.scoreRange}</span>
        </div>
      </div>

      {/* Ý nghĩa Cát/Hung & Khẳng định phi tuyệt đối */}
      <div className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-200 leading-relaxed">
        <strong className="text-stone-900">Định hướng chiêm nghiệm:</strong> {config.meaning}
      </div>

      {/* Thanh đo trực quan Cát / Hung (Đạt WCAG AA: Nhãn văn bản rõ ràng ở cả 5 mốc, contrast >= 4.5:1) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-stone-700 font-medium">
          <span>Đại Hung (-2.0)</span>
          <span>Tiểu Hung (-0.8)</span>
          <span>Bình Hòa (0.0)</span>
          <span>Tiểu Cát (+0.8)</span>
          <span>Đại Cát (+2.0)</span>
        </div>

        <div className="relative h-3.5 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full overflow-hidden shadow-inner">
          {/* Kim chỉ thị điểm số */}
          <div
            className="absolute top-0 bottom-0 w-3 bg-white border-2 border-stone-900 rounded-full -ml-1.5 shadow"
            style={{ left: `${scorePercent}%` }}
            title={`Điểm số hiện tại: ${synthesis.score.toFixed(2)}`}
          />
        </div>
      </div>

      {/* Phân rã 3 trụ cột (Decomposition) */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
            Phân Rã Điểm Minh Bạch (3 Trụ Cột)
          </span>

          {/* Nút mở rộng giải thích Giả định & Trọng số */}
          <button
            type="button"
            onClick={() => setShowAssumptionInfo(!showAssumptionInfo)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-800" />
            <span>
              {isTechnicalMode ? 'ASSUMPTION (ADR-002)' : 'Cơ Chế Trọng Số & Giả Định'}
              <span className="sr-only">ASSUMPTION (ADR-002)</span>
            </span>
            {showAssumptionInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Khối giải thích Assumption & Cơ chế Tái Chuẩn Hóa Fallback */}
        {showAssumptionInfo && (
          <div className="mb-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-stone-800 leading-relaxed space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-800 flex-shrink-0" />
              <span>
                {isTechnicalMode
                  ? 'Quy ước Giả định Kỹ thuật (ADR-002) & Cơ chế Tái Chuẩn Hóa (synthesis_engine.py)'
                  : 'Cơ Chế Phân Bổ Trọng Số Điểm & Chuẩn Hóa Động'}
                <span className="sr-only">Quy ước Giả định Kỹ thuật</span>
              </span>
            </div>
            <p>
              <strong>Công thức lý thuyết chuẩn (khi đủ cả 3 trụ cột tri thức):</strong><br />
              <code className="bg-amber-200/80 px-2 py-0.5 rounded font-mono text-xs text-amber-950 font-bold">
                Điểm Tổng Hợp = (0.40 × Ngũ Hành) + (0.35 × Quy Tắc) + (0.25 × Diễn Giải)
                <span className="sr-only">S = 0.40 · S_elem + 0.35 · S_rules + 0.25 · S_interp</span>
              </code>
              {isTechnicalMode && (
                <span className="block font-mono text-xs text-stone-600 mt-1">
                  S = 0.40 · S_elem + 0.35 · S_rules + 0.25 · S_interp
                </span>
              )}
            </p>
            <p className="text-stone-700">
              <strong>Cơ chế tự động Tái chuẩn hóa tỷ trọng: </strong>
              Khi một hoặc hai trụ cột chưa có dữ liệu đã duyệt (ví dụ diễn giải đang ở hàng đợi chờ kiểm duyệt), hệ thống tự động tái cân bằng trọng số giữa các trụ cột đang hiện diện để bảo đảm điểm số khách quan, không bị kéo về 0 do thiếu dữ liệu.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
              <li>Chỉ có Ngũ hành + Luật: <code className="font-mono">S = (0.40/0.75) · S_elem + (0.35/0.75) · S_rules</code></li>
              <li>Chỉ có Ngũ hành + Diễn giải: <code className="font-mono">S = (0.40/0.65) · S_elem + (0.25/0.65) · S_interp</code></li>
              <li>Chỉ có Ngũ hành (Fallback hoàn toàn): <code className="font-mono">S = S_elem</code> (Trụ cột Ngũ hành chiếm 100% tỷ trọng).</li>
            </ul>
          </div>
        )}

        {/* Cảnh báo trạng thái tái chuẩn hóa tỷ trọng nếu có trụ cột vắng */}
        {isFallbackActive && (
          <div className="mb-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <span>Trạng thái Tái Chuẩn Hóa Tỷ Trọng (ADR-002):</span>
            </div>
            <p className="text-blue-900">
              Hệ thống phát hiện tình trạng phân bổ tri thức cho ca gieo này:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-blue-900 text-xs">
              {isRuleMissing ? (
                <li>
                  <strong>Trụ Cột 2 (Quy tắc suy luận):</strong> Đang vắng (chưa có quy tắc nào khớp với tiền đề của quẻ này).
                </li>
              ) : (
                <li className="text-emerald-800">
                  <strong>Trụ Cột 2 (Quy tắc suy luận):</strong> Đang hiện diện ({rulesFiredCount ? `${rulesFiredCount} luật kích hoạt` : 'hợp lệ'}{decomp.rule_score === 0 ? ', Điểm Bình Hòa: 0.00' : `, Điểm: ${decomp.rule_score > 0 ? `+${decomp.rule_score.toFixed(2)}` : decomp.rule_score.toFixed(2)}`}).
                </li>
              )}
              {isInterpMissing ? (
                <li>
                  <strong>Trụ Cột 3 (Diễn giải chuyên gia):</strong> Đang vắng (chờ bổ sung bài đóng góp đã duyệt theo chủ đề).
                </li>
              ) : (
                <li className="text-emerald-800">
                  <strong>Trụ Cột 3 (Diễn giải chuyên gia):</strong> Đang hiện diện ({interpretationsCount ? `${interpretationsCount} diễn giải đã duyệt` : 'hợp lệ'}).
                </li>
              )}
            </ul>
            <p className="text-xs text-blue-900 pt-1 font-medium">
              {isRuleMissing && isInterpMissing
                ? '→ Trụ Cột 1 (Ngũ Hành Mai Hoa) tạm thời gánh 100% tỷ trọng để bảo đảm kết quả suy luận luôn có căn cứ vững chắc.'
                : !isRuleMissing && isInterpMissing
                ? '→ Tỷ trọng tái phân bổ: Trụ Cột 1 Ngũ Hành (0.40/0.75 ≈ 53.3%) + Trụ Cột 2 Quy Tắc (0.35/0.75 ≈ 46.7%).'
                : isRuleMissing && !isInterpMissing
                ? '→ Tỷ trọng tái phân bổ: Trụ Cột 1 Ngũ Hành (0.40/0.65 ≈ 61.5%) + Trụ Cột 3 Diễn Giải (0.25/0.65 ≈ 38.5%).'
                : '→ Đầy đủ 3 Trụ Cột: Ngũ Hành (40%) + Quy Tắc (35%) + Diễn Giải (25%).'}
            </p>
          </div>
        )}

        {/* 3 Khối trụ cột */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Trụ cột 1 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-700">
              <span className="font-semibold">Trụ Cột 1 (40%)</span>
              <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                {isTechnicalMode ? 'W=0.40' : '40%'}
                <span className="sr-only">W=0.40</span>
              </span>
            </div>
            <div className="font-semibold text-xs text-stone-900">
              Ngũ Hành Mai Hoa
            </div>
            <div className="text-lg font-bold text-stone-900">
              {decomp.element_score >= 0 ? `+${decomp.element_score.toFixed(2)}` : decomp.element_score.toFixed(2)}
            </div>
            <div className="text-xs text-stone-600">
              Tương tác Thể - Dụng qua 3 chặng quẻ
            </div>
          </div>

          {/* Trụ cột 2 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-700">
              <span className="font-semibold">Trụ Cột 2 (35%)</span>
              <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                {isTechnicalMode ? 'W=0.35' : '35%'}
                <span className="sr-only">W=0.35</span>
              </span>
            </div>
            <div className="font-semibold text-xs text-stone-900">
              Quy Tắc Suy Luận
            </div>
            <div className="text-lg font-bold text-stone-900">
              {decomp.rule_score >= 0 ? `+${decomp.rule_score.toFixed(2)}` : decomp.rule_score.toFixed(2)}
            </div>
            <div className="text-xs text-stone-600">
              {rulesFiredCount !== undefined && rulesFiredCount > 0
                ? `Đã kích hoạt ${rulesFiredCount} quy tắc suy luận`
                : isRuleMissing
                ? 'Chưa có quy tắc kích hoạt cho quẻ này'
                : 'Bộ luật suy luận logic có nguồn gốc'}
            </div>
          </div>

          {/* Trụ cột 3 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-700">
              <span className="font-semibold">Trụ Cột 3 (25%)</span>
              <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                {isTechnicalMode ? 'W=0.25' : '25%'}
                <span className="sr-only">W=0.25</span>
              </span>
            </div>
            <div className="font-semibold text-xs text-stone-900">
              Diễn Giải Chuyên Gia
            </div>
            <div className="text-lg font-bold text-stone-900">
              {decomp.interpretation_score >= 0 ? `+${decomp.interpretation_score.toFixed(2)}` : decomp.interpretation_score.toFixed(2)}
            </div>
            <div className="text-xs text-stone-600">
              {interpretationsCount !== undefined && interpretationsCount > 0
                ? `Có ${interpretationsCount} diễn giải đã duyệt`
                : isInterpMissing
                ? 'Chờ diễn giải chuyên gia theo chủ đề'
                : 'Tri thức bối cảnh đã qua kiểm duyệt'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import {
  CastingMethod,
  Topic,
  RatHourRule,
  DivinationRequest,
  LunarConvertResponse,
} from '@/types/divination.types'
import { TOPIC_LABELS, TOPIC_DESCRIPTIONS } from '@/i18n/topics'
import { useAuth } from '@/auth/AuthContext'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { getLunarConvert } from '@/api/divination.api'
import {
  Clock,
  Hash,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'

interface DivinationFormProps {
  onSubmit: (req: DivinationRequest) => Promise<void>
  isLoading: boolean
}

export const DivinationForm: React.FC<DivinationFormProps> = ({ onSubmit, isLoading }) => {
  const { userLevel, userId } = useAuth()
  const { isTechnicalMode } = useTechnicalMode()

  // Form State
  const [method, setMethod] = useState<CastingMethod>('MAI_HOA_TIME')
  const [topic, setTopic] = useState<Topic>('CAREER')
  const [safetyConsent, setSafetyConsent] = useState<boolean>(false)

  // State cho phương pháp Thời gian
  const nowIsoLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
  const [solarDateTime, setSolarDateTime] = useState<string>(nowIsoLocal)
  const [ratHourRule, setRatHourRule] = useState<RatHourRule>('NEXT_DAY')
  const [lunarPreview, setLunarPreview] = useState<LunarConvertResponse | null>(null)
  const [isLoadingLunar, setIsLoadingLunar] = useState<boolean>(false)

  // State cho phương pháp Hai số
  const [numberUpper, setNumberUpper] = useState<number>(1)
  const [numberLower, setNumberLower] = useState<number>(1)

  // Validation Error message
  const [formError, setFormError] = useState<string | null>(null)

  const isSensitiveTopic = topic === 'HEALTH' || topic === 'FINANCE'

  const handleTopicChange = (newTopic: Topic) => {
    setTopic(newTopic)
    if (newTopic === 'HEALTH' || newTopic === 'FINANCE') {
      setSafetyConsent(false)
    }
  }

  // Gọi xem trước Âm lịch
  const handlePreviewLunar = async () => {
    setIsLoadingLunar(true)
    setFormError(null)
    try {
      const dateWithTz = `${solarDateTime}:00+07:00`
      const res = await getLunarConvert(dateWithTz, ratHourRule)
      setLunarPreview(res)
    } catch {
      setFormError('Không thể tra cứu lịch âm cho thời điểm này. Vui lòng kiểm tra lại ngày giờ.')
    } finally {
      setIsLoadingLunar(false)
    }
  }

  // Chọn nhanh 5 ca kinh điển Mai Hoa (Thiệu Ung)
  const applyGoldenPreset = (presetIndex: number) => {
    setMethod('MAI_HOA_NUMBER')
    switch (presetIndex) {
      case 1:
        setTopic('GENERAL')
        setNumberUpper(2)
        setNumberLower(3)
        break
      case 2:
        setTopic('GENERAL')
        setNumberUpper(4)
        setNumberLower(6)
        break
      case 3:
        setTopic('GENERAL')
        setNumberUpper(7)
        setNumberLower(8)
        break
      case 4:
        setTopic('GENERAL')
        setNumberUpper(1)
        setNumberLower(5)
        break
      case 5:
        setTopic('GENERAL')
        setNumberUpper(1)
        setNumberLower(5)
        break
    }
    setSafetyConsent(false)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (isSensitiveTopic && !safetyConsent) {
      setFormError('Vui lòng xác nhận bạn đã hiểu rõ lưu ý an toàn trước khi gieo quẻ.')
      return
    }

    if (method === 'MAI_HOA_NUMBER') {
      if (!numberUpper || numberUpper < 1 || !numberLower || numberLower < 1) {
        setFormError('Số Thượng và Số Hạ phải lớn hơn hoặc bằng 1.')
        return
      }

      await onSubmit({
        casting_method: 'MAI_HOA_NUMBER',
        topic,
        number_upper: Number(numberUpper),
        number_lower: Number(numberLower),
        user_id: userId,
        user_level: userLevel,
      })
    } else {
      if (!solarDateTime) {
        setFormError('Vui lòng chọn ngày giờ gieo quẻ.')
        return
      }

      const isoWithTz = `${solarDateTime}:00+07:00`

      await onSubmit({
        casting_method: 'MAI_HOA_TIME',
        topic,
        solar_datetime: isoWithTz,
        rat_hour_rule: ratHourRule,
        user_id: userId,
        user_level: userLevel,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="border-b border-stone-100 pb-3">
        <h2 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span>Khởi Chiêm Lập Quẻ (Mai Hoa Dịch Số)</span>
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Hệ thống suy luận khách quan dựa trên quy luật Ngũ hành Mai Hoa và triết học Kinh Dịch.
        </p>
      </div>

      {/* 1. Chọn Chủ Đề (Topic) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
          1. Chọn Chủ Đề Quan Tâm
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => {
            const isSelected = topic === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTopicChange(t)}
                className={`p-3 rounded-lg border text-left transition flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-amber-600 ${
                  isSelected
                    ? 'border-amber-700 bg-amber-50/80 text-amber-950 ring-1 ring-amber-700 shadow-xs'
                    : 'border-stone-200 hover:border-amber-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="text-sm font-bold">{TOPIC_LABELS[t]}</span>
                <span className="text-xs text-stone-600 line-clamp-2 mt-1">
                  {TOPIC_DESCRIPTIONS[t]}
                </span>
              </button>
            )
          })}
        </div>

        {/* CẢNH BÁO AN TOÀN CHUYÊN BIỆT & CHECKBOX XÁC NHẬN KHI CHỌN CHỦ ĐỀ NHẠY CẢM (HEALTH / FINANCE) */}
        {isSensitiveTopic && (
          <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-3 text-stone-800 animate-fadeIn shadow-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-800 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-950">
                  {topic === 'HEALTH' ? 'Lưu ý An Toàn về Sức Khỏe & Thể Trạng' : 'Lưu ý An Toàn về Tài Chính & Đầu Tư'}
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {topic === 'HEALTH'
                    ? 'Lời giải Dịch học về ngũ hành tạng phủ chỉ mang tính chất tham khảo triết học dưỡng sinh. Quẻ Dịch KHÔNG THAY THẾ cho việc khám chữa bệnh, chẩn đoán y khoa hay phác đồ điều trị của bác sĩ chuyên khoa.'
                    : 'Luận giải quẻ Dịch chỉ mang góc nhìn tham khảo về thời vận và đạo xử thế. Quẻ Dịch KHÔNG PHẢI là tư vấn tài chính, cam kết sinh lời hay khuyến nghị đầu tư mạo hiểm.'}
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={safetyConsent}
                onChange={(e) => setSafetyConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-800 focus:ring-amber-600 cursor-pointer"
                required
              />
              <span className="text-xs font-medium text-stone-800 leading-normal">
                Tôi hiểu và xác nhận: Kết quả gieo quẻ chỉ mang tính chất chiêm nghiệm triết lý, không thay thế cho quyết định chuyên môn thực tế.
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 2. Chọn Phương Pháp (Casting Method Tabs) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
          2. Chọn Phương Pháp Lập Quẻ
        </label>
        <div className="flex border border-stone-200 rounded-lg p-1 bg-stone-50">
          <button
            type="button"
            onClick={() => {
              setMethod('MAI_HOA_TIME')
              setFormError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition ${
              method === 'MAI_HOA_TIME'
                ? 'bg-white text-amber-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Theo Thời Gian (Năm, Tháng, Ngày, Giờ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('MAI_HOA_NUMBER')
              setFormError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition ${
              method === 'MAI_HOA_NUMBER'
                ? 'bg-white text-amber-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Hash className="w-4 h-4 text-amber-700" />
            <span>Theo Hai Số Ngẫu Nhiên (Trực Đoán)</span>
          </button>
        </div>

        {/* Cột form phương pháp Thời Gian */}
        {method === 'MAI_HOA_TIME' && (
          <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="solar-datetime-input" className="block text-xs font-semibold text-stone-700 mb-1">
                  Thời điểm Dương lịch:
                </label>
                <input
                  id="solar-datetime-input"
                  aria-label="Thời điểm Dương lịch"
                  type="datetime-local"
                  value={solarDateTime}
                  onChange={(e) => setSolarDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-mono"
                  required
                />
                <p className="text-xs text-stone-600 mt-1">
                  Định dạng: Ngày/Tháng/Năm Giờ:Phút (DD/MM/YYYY HH:mm) · Giờ chuẩn Việt Nam (UTC+7)
                </p>
              </div>

              <div>
                <label htmlFor="rat-hour-rule-select" className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Quy ước Giờ Tý (23:00 – 00:59):</span>
                  {isTechnicalMode && (
                    <span className="text-xs text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">
                      ADR-003
                    </span>
                  )}
                </label>
                <select
                  id="rat-hour-rule-select"
                  aria-label="Quy ước Giờ Tý"
                  value={ratHourRule}
                  onChange={(e) => setRatHourRule(e.target.value as RatHourRule)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="NEXT_DAY">NEXT_DAY (Tính sang ngày hôm sau — Mặc định)</option>
                  <option value="SAME_DAY">SAME_DAY (Giữ nguyên ngày cũ)</option>
                </select>
              </div>
            </div>

            {/* Nút tra cứu xem trước Âm lịch */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handlePreviewLunar}
                disabled={isLoadingLunar}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-amber-900 hover:text-amber-950 font-medium px-3.5 py-2 rounded bg-amber-100 hover:bg-amber-200/80 border border-amber-300 transition"
              >
                <Calendar className="w-4 h-4 text-amber-800" />
                <span>{isLoadingLunar ? 'Đang chuyển đổi lịch...' : 'Xem trước Âm lịch & Can Chi'}</span>
              </button>

              <span className="text-xs text-stone-600">Múi giờ hệ thống: UTC+7 (Việt Nam)</span>
            </div>

            {/* Khối hiển thị xem trước Âm lịch */}
            {lunarPreview && (
              <div className="p-3.5 bg-white border border-amber-200 rounded-lg text-xs sm:text-sm space-y-2.5 shadow-xs">
                <div className="font-bold text-amber-950 flex items-center justify-between">
                  <span>Kết quả Lịch Âm Hồ Ngọc Đức & Can Chi:</span>
                  <span className="text-xs text-stone-600 font-mono">{lunarPreview.solar_term}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-700">
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Âm lịch:</span>
                    <span className="font-semibold text-stone-900">
                      Ngày {String(lunarPreview.lunar_day).padStart(2, '0')}/{String(lunarPreview.lunar_month).padStart(2, '0')}/{lunarPreview.lunar_year}
                      {lunarPreview.is_leap_month ? ' (Nhuận)' : ''}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Năm Can Chi:</span>
                    <span className="font-semibold text-stone-900">{lunarPreview.can_chi_year} (Chi {lunarPreview.year_branch_name} #{lunarPreview.year_branch_num})</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Ngày Can Chi:</span>
                    <span className="font-semibold text-stone-900">{lunarPreview.can_chi_day}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Giờ Can Chi:</span>
                    <span className="font-semibold text-stone-900">{lunarPreview.can_chi_hour} (Chi {lunarPreview.hour_branch_name} #{lunarPreview.hour_branch_num})</span>
                  </div>
                </div>
                {lunarPreview.assumption_note && (
                  <div className="text-xs text-amber-900 italic bg-amber-50/70 p-1.5 rounded border border-amber-200/50">
                    * {lunarPreview.assumption_note}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cột form phương pháp Hai Số */}
        {method === 'MAI_HOA_NUMBER' && (
          <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="number-upper-input" className="block text-xs font-semibold text-stone-700 mb-1">
                  Số thứ nhất (Quẻ Thượng):
                </label>
                <input
                  id="number-upper-input"
                  aria-label="Số thứ nhất (Quẻ Thượng)"
                  type="number"
                  min={1}
                  value={numberUpper}
                  onChange={(e) => setNumberUpper(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-mono"
                  required
                />
                <span className="text-xs text-stone-600">Quy tắc Mai Hoa: Số % 8 (dư 0 tính là 8 - Khôn)</span>
              </div>

              <div>
                <label htmlFor="number-lower-input" className="block text-xs font-semibold text-stone-700 mb-1">
                  Số thứ hai (Quẻ Hạ & Hào động):
                </label>
                <input
                  id="number-lower-input"
                  aria-label="Số thứ hai (Quẻ Hạ & Hào động)"
                  type="number"
                  min={1}
                  value={numberLower}
                  onChange={(e) => setNumberLower(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-mono"
                  required
                />
                <span className="text-xs text-stone-600">Hào động = (Số 1 + Số 2) % 6</span>
              </div>
            </div>

            {/* Nạp nhanh các cặp số mẫu & phân định trung thực ca nào khớp Thiệu Ung */}
            <div className="border-t border-stone-200 pt-3 space-y-2">
              <div className="text-xs font-semibold text-stone-700 uppercase tracking-wide flex items-center gap-1">
                <span>Chọn Nhanh Ca Kinh Điển (Mai Hoa Dịch Số - Thiệu Ung):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyGoldenPreset(1)}
                  className="p-2.5 text-xs bg-white border border-stone-300 rounded-lg hover:border-amber-600 text-stone-800 transition text-left"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>1. Quán Mai Chiêm</span>
                    <span className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">2, 3</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Đoài 2, Ly 3 → Cách (49). Động hào 5.</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoldenPreset(2)}
                  className="p-2.5 text-xs bg-white border border-stone-300 rounded-lg hover:border-amber-600 text-stone-800 transition text-left"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>2. Mã Hành Đố Địa</span>
                    <span className="text-xs bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-semibold">4, 6</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Chấn 4, Khảm 6 → Giải (40). Động hào 4.</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoldenPreset(3)}
                  className="p-2.5 text-xs bg-white border border-stone-300 rounded-lg hover:border-amber-600 text-stone-800 transition text-left"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>3. Tây Lâm Tự Ngạch</span>
                    <span className="text-xs bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-semibold">7, 8</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Cấn 7, Khôn 8 → Khiêm (15). Động hào 3.</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoldenPreset(4)}
                  className="p-2.5 text-xs bg-white border border-stone-300 rounded-lg hover:border-amber-600 text-stone-800 transition text-left"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>4. Mẫu Đơn Chiêm</span>
                    <span className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">1, 5</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Càn 1, Tốn 5 → Cấu (44). Động hào 6.</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoldenPreset(5)}
                  className="p-2.5 text-xs bg-white border border-stone-300 rounded-lg hover:border-amber-600 text-stone-800 transition text-left"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>5. Khách Lai Xao Môn</span>
                    <span className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">1, 5</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Càn 1, Tốn 5 → Cấu (44). Động hào 6.</div>
                </button>
              </div>

              {isTechnicalMode && (
                <div className="text-xs text-stone-600 italic bg-amber-50/70 p-2 rounded border border-amber-200">
                  * Ghi chú kỹ thuật: Thuật toán Mai Hoa áp dụng công thức <code>Hào động = (Số 1 + Số 2) % 6</code> (dư 0 tính là hào 6).
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lỗi Form nếu có */}
      {formError && (
        <div aria-live="polite" className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-xs sm:text-sm text-rose-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Nút Submit Gieo Quẻ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
        <span className="text-xs text-stone-600">
          Cấp độ người dùng: <strong className="text-stone-800 font-semibold">{userLevel}</strong>
          {isSensitiveTopic && !safetyConsent && (
            <span className="block text-amber-800 font-medium mt-0.5">
              * Cần xác nhận lưu ý an toàn trước khi bấm gieo quẻ
            </span>
          )}
        </span>

        <button
          type="submit"
          disabled={isLoading || (isSensitiveTopic && !safetyConsent)}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition shadow-sm focus-visible:ring-2 focus-visible:ring-amber-600 ${
            isLoading || (isSensitiveTopic && !safetyConsent)
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white'
          }`}
          title={isSensitiveTopic && !safetyConsent ? 'Vui lòng tích xác nhận lưu ý an toàn' : 'Khởi chiêm lập quẻ'}
        >
          {isLoading ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Đang Lập Quẻ & Suy Luận...</span>
            </>
          ) : (
            <>
              <span>Khởi Chiêm Lập Quẻ</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

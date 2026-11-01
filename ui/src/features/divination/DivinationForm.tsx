import React, { useState, useEffect } from 'react'
import {
  CastingMethod,
  Topic,
  DivinationRequest,
  LunarConvertResponse,
} from '@/types/divination.types'
import { TOPIC_LABELS, TOPIC_DESCRIPTIONS } from '@/i18n/topics'
import { useAuth } from '@/auth/AuthContext'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { getLunarConvert } from '@/api/divination.api'
import { isRealApiMode } from '@/config/env.config'
import {
  Clock,
  Hash,
  Calendar,
  Sparkles,
  Dices,
  Info,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import {
  formatVnClock,
  formatVnWeekdayDate,
  getCanhGio,
} from '@/utils/vietnamese-time.utils'

interface TrigramCardInfo {
  name: string
  symbol: string
  nature: string
  element: string
  badgeStyle: string
}

const MAI_HOA_TRIGRAM_MAP: Record<number, TrigramCardInfo> = {
  1: { name: 'Càn', symbol: '☰', nature: 'Trời', element: 'Kim', badgeStyle: 'bg-amber-100 text-amber-950 border-amber-300' },
  2: { name: 'Đoài', symbol: '☱', nature: 'Đầm', element: 'Kim', badgeStyle: 'bg-rose-100 text-rose-950 border-rose-300' },
  3: { name: 'Ly', symbol: '☲', nature: 'Lửa', element: 'Hỏa', badgeStyle: 'bg-red-100 text-red-950 border-red-300' },
  4: { name: 'Chấn', symbol: '☳', nature: 'Sấm', element: 'Mộc', badgeStyle: 'bg-emerald-100 text-emerald-950 border-emerald-300' },
  5: { name: 'Tốn', symbol: '☴', nature: 'Gió', element: 'Mộc', badgeStyle: 'bg-teal-100 text-teal-950 border-teal-300' },
  6: { name: 'Khảm', symbol: '☵', nature: 'Nước', element: 'Thủy', badgeStyle: 'bg-blue-100 text-blue-950 border-blue-300' },
  7: { name: 'Cấn', symbol: '☶', nature: 'Núi', element: 'Thổ', badgeStyle: 'bg-amber-100 text-amber-950 border-amber-300' },
  8: { name: 'Khôn', symbol: '☷', nature: 'Đất', element: 'Thổ', badgeStyle: 'bg-stone-200 text-stone-900 border-stone-300' },
}

function getTrigramPreview(num: number): TrigramCardInfo {
  const val = Math.max(1, num || 1)
  const rem = ((val - 1) % 8) + 1
  return MAI_HOA_TRIGRAM_MAP[rem] || MAI_HOA_TRIGRAM_MAP[8]
}

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

  // State cho phương pháp Thời gian: đồng hồ thực, múi giờ UTC+7
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const canhGio = getCanhGio(now)

  const [lunarPreview, setLunarPreview] = useState<LunarConvertResponse | null>(null)
  const [isLoadingLunar, setIsLoadingLunar] = useState<boolean>(false)

  // State cho phương pháp Hai/Ba số
  const [numberUpper, setNumberUpper] = useState<number>(1)
  const [numberLower, setNumberLower] = useState<number>(1)
  const [movingNumber, setMovingNumber] = useState<string>('')

  // Validation Error message
  const [formError, setFormError] = useState<string | null>(null)

  const isSensitiveTopic = topic === 'HEALTH' || topic === 'FINANCE'

  const handleTopicChange = (newTopic: Topic) => {
    setTopic(newTopic)
    if (newTopic === 'HEALTH' || newTopic === 'FINANCE') {
      setSafetyConsent(false)
    }
  }

  // Gọi xem trước Âm lịch theo thời điểm thực
  const handlePreviewLunar = async () => {
    setIsLoadingLunar(true)
    setFormError(null)
    try {
      const res = await getLunarConvert(new Date().toISOString(), 'NEXT_DAY')
      setLunarPreview(res)
    } catch {
      setFormError('Không thể tra cứu lịch âm cho thời điểm này. Vui lòng kiểm tra lại kết nối.')
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
    setMovingNumber('')
    setFormError(null)
  }

  const handleRandomizeNumbers = () => {
    const r1 = Math.floor(Math.random() * 64) + 1
    const r2 = Math.floor(Math.random() * 64) + 1
    const hasMoving = Math.random() > 0.4
    const r3 = hasMoving ? String(Math.floor(Math.random() * 6) + 1) : ''
    setNumberUpper(r1)
    setNumberLower(r2)
    setMovingNumber(r3)
    setFormError(null)
  }

  const upperTrigram = getTrigramPreview(numberUpper)
  const lowerTrigram = getTrigramPreview(numberLower)
  const parsedMoving = movingNumber.trim() ? parseInt(movingNumber.trim()) : null
  const isCustomMoving = parsedMoving !== null && !isNaN(parsedMoving) && parsedMoving >= 1
  const calculatedMovingLine = isCustomMoving
    ? ((parsedMoving - 1) % 6) + 1
    : ((numberUpper + numberLower - 1) % 6) + 1

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

      const trimmedMoving = movingNumber.trim()
      const parsedMoving = trimmedMoving ? Number(trimmedMoving) : null
      if (parsedMoving !== null && (!Number.isInteger(parsedMoving) || parsedMoving < 1)) {
        setFormError('Số thứ ba (hào động) phải là số nguyên lớn hơn hoặc bằng 1, hoặc để trống.')
        return
      }

      await onSubmit({
        casting_method: 'MAI_HOA_NUMBER',
        topic,
        number_upper: Number(numberUpper),
        number_lower: Number(numberLower),
        moving_number: parsedMoving ?? undefined,
        user_id: userId,
        user_level: userLevel,
      })
    } else {
      await onSubmit({
        casting_method: 'MAI_HOA_TIME',
        topic,
        solar_datetime: new Date().toISOString(),
        rat_hour_rule: 'NEXT_DAY',
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
            <span>Theo Con Số Tâm Niệm (2–3 số)</span>
          </button>
        </div>

        {/* Cột form phương pháp Thời Gian — tự động lấy thời gian thực */}
        {method === 'MAI_HOA_TIME' && (
          <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div
                    data-testid="live-clock"
                    className="font-mono text-2xl font-bold text-stone-900 tracking-tight"
                  >
                    {formatVnClock(now)}
                  </div>
                  <div className="text-xs text-stone-600">
                    {formatVnWeekdayDate(now)} · Giờ Việt Nam (UTC+7)
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs">
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  Canh giờ hiện tại
                </div>
                <div className="font-semibold text-amber-950">
                  Giờ {canhGio.name}{' '}
                  <span className="font-normal text-stone-600">({canhGio.range})</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Hệ thống tự động lấy thời điểm thực ngay khi bạn bấm gieo quẻ — không cần chọn giờ thủ công.
              Giờ Tý bắt đầu từ <strong>23:00 đến 00:59</strong> và được tính sang ngày Can Chi kế tiếp
              (quy ước Dạ Tý).
            </p>

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
                <div className="font-bold text-amber-950 flex items-center justify-between gap-2">
                  <span>Quy đổi Âm lịch tại thời điểm gieo quẻ:</span>
                  {lunarPreview.is_da_ty && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                      Dạ Tý
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-700">
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Âm lịch:</span>
                    <span className="font-semibold text-stone-900">
                      Ngày {String(lunarPreview.lunar_day).padStart(2, '0')}/
                      {String(lunarPreview.lunar_month).padStart(2, '0')}/{lunarPreview.lunar_year}
                      {lunarPreview.is_leap_month ? ' (Nhuận)' : ''}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Năm Can Chi:</span>
                    <span className="font-semibold text-stone-900">
                      {lunarPreview.can_chi_year} (Chi {lunarPreview.year_branch_name} #
                      {lunarPreview.year_branch_num})
                    </span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-600 block text-xs">Giờ Can Chi:</span>
                    <span className="font-semibold text-stone-900">
                      {lunarPreview.hour_branch_name} (#{lunarPreview.hour_branch_num}) ·{' '}
                      {canhGio.range}
                    </span>
                  </div>
                </div>
                {isTechnicalMode && (
                  <div className="text-[11px] text-stone-600 font-mono">
                    ADR-003 · rat_hour_rule={lunarPreview.rat_hour_rule}
                  </div>
                )}
                {lunarPreview.assumption_note && (
                  <div className="text-xs text-amber-900 italic bg-amber-50/70 p-1.5 rounded border border-amber-200/50">
                    * {lunarPreview.assumption_note}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cột form phương pháp Hai/Ba Số */}
        {method === 'MAI_HOA_NUMBER' && (
          <div className="p-4 sm:p-5 bg-stone-50/90 border border-stone-200 rounded-xl space-y-4 shadow-2xs">
            {/* Header banner với lời dẫn Dịch lý & Nút Khởi số trực giác */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tâm Động Sinh Quẻ · Mai Hoa Thần Số</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Hãy giữ tâm an tịnh và ghi lại 2 hoặc 3 con số bất chợt xuất hiện trong tâm trí. Mỗi con số phản ánh một nhịp năng lượng tương ứng trong Bát Quái.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRandomizeNumbers}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 hover:border-amber-400 shadow-2xs transition cursor-pointer select-none shrink-0"
              >
                <Dices className="w-3.5 h-3.5 text-amber-700" />
                <span>Khởi số trực giác</span>
              </button>
            </div>

            {/* Grid 3 Cards Nhập Số Cân Đối Tuyệt Đối (Cả 3 khung đồng bộ 100% từng pixel) */}
            <div data-testid="number-cards-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Quẻ Thượng */}
              <div className="min-h-[220px] flex flex-col justify-between p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-amber-300 transition shadow-2xs space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">1.</span>
                    <span className="w-[68px] h-[22px] rounded-full bg-amber-100/90 text-amber-950 border border-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      Ngoại Quái
                    </span>
                  </div>
                  <div className="flex flex-col text-xs font-bold uppercase tracking-wider text-stone-800 leading-tight mt-1">
                    <span>QUẺ</span>
                    <span>THƯỢNG</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="number-upper-input" className="sr-only">Số thứ nhất (Quẻ Thượng)</label>
                  <input
                    id="number-upper-input"
                    aria-label="Số thứ nhất (Quẻ Thượng)"
                    type="number"
                    min={1}
                    value={numberUpper}
                    onChange={(e) => setNumberUpper(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-12 text-center text-2xl font-bold font-mono text-stone-900 bg-stone-50/60 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 focus:bg-white focus:outline-none transition shadow-2xs"
                    required
                  />
                </div>

                <div className="w-full h-[68px] flex flex-col items-center justify-center text-center p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 shadow-2xs transition">
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-amber-900 leading-tight">
                    <span className="text-base font-serif">{upperTrigram.symbol}</span>
                    <span>Quái {upperTrigram.name}</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1 leading-tight font-medium">
                    {upperTrigram.nature} · Hành {upperTrigram.element}
                  </div>
                </div>
              </div>

              {/* Card 2: Quẻ Hạ */}
              <div className="min-h-[220px] flex flex-col justify-between p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-amber-300 transition shadow-2xs space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">2.</span>
                    <span className="w-[68px] h-[22px] rounded-full bg-amber-100/90 text-amber-950 border border-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      Nội Quái
                    </span>
                  </div>
                  <div className="flex flex-col text-xs font-bold uppercase tracking-wider text-stone-800 leading-tight mt-1">
                    <span>QUẺ</span>
                    <span>HẠ</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="number-lower-input" className="sr-only">Số thứ hai (Quẻ Hạ)</label>
                  <input
                    id="number-lower-input"
                    aria-label="Số thứ hai (Quẻ Hạ)"
                    type="number"
                    min={1}
                    value={numberLower}
                    onChange={(e) => setNumberLower(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-12 text-center text-2xl font-bold font-mono text-stone-900 bg-stone-50/60 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 focus:bg-white focus:outline-none transition shadow-2xs"
                    required
                  />
                </div>

                <div className="w-full h-[68px] flex flex-col items-center justify-center text-center p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 shadow-2xs transition">
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-amber-900 leading-tight">
                    <span className="text-base font-serif">{lowerTrigram.symbol}</span>
                    <span>Quái {lowerTrigram.name}</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1 leading-tight font-medium">
                    {lowerTrigram.nature} · Hành {lowerTrigram.element}
                  </div>
                </div>
              </div>

              {/* Card 3: Hào Động */}
              <div className="min-h-[220px] flex flex-col justify-between p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-amber-300 transition shadow-2xs space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">3.</span>
                    <span className="w-[68px] h-[22px] rounded-full bg-amber-100/90 text-amber-950 border border-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      Biến Hóa
                    </span>
                  </div>
                  <div className="flex flex-col text-xs font-bold uppercase tracking-wider text-stone-800 leading-tight mt-1">
                    <span>HÀO</span>
                    <span>ĐỘNG</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="moving-number-input" className="sr-only">Số thứ ba tùy chọn xác định hào động</label>
                  <input
                    id="moving-number-input"
                    aria-label="Số thứ ba tùy chọn xác định hào động"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={movingNumber}
                    onChange={(e) => setMovingNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Tự động"
                    className="w-full h-12 text-center text-2xl font-bold font-mono text-stone-900 bg-stone-50/60 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 focus:bg-white focus:outline-none transition placeholder:text-stone-400 placeholder:text-sm placeholder:font-normal shadow-2xs"
                  />
                </div>

                <div className="w-full h-[68px] flex flex-col items-center justify-center text-center p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 shadow-2xs transition">
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-amber-900 leading-tight">
                    <span className="text-amber-600">⚡</span>
                    <span>Động Hào {calculatedMovingLine}</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1 leading-tight font-medium">
                    {isCustomMoving ? '(Tùy chọn)' : '(Tự động tính)'}
                  </div>
                </div>
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
                  * Ghi chú kỹ thuật: Hào động = <code>(Số 1 + Số 2) % 6</code> khi bỏ trống Số thứ ba;
                  nếu có Số thứ ba thì <code>Hào động = (Số 3 - 1) % 6 + 1</code>.
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

      {isLoading && isRealApiMode() && (
        <p className="text-[11px] text-amber-800 animate-pulse mt-1.5 text-center sm:text-right">
          Đang kết nối máy chủ tri thức (có thể mất 15–30s nếu dịch vụ đám mây đang thức giấc)...
        </p>
      )}
    </form>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getHexagramDetail } from '@/api/hexagram.api'
import { useAuth } from '@/auth/AuthContext'
import { TOPIC_I18N } from '@/i18n/labels'
import { UserLevel } from '@/types/divination.types'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Scroll,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

// Phân loại nhãn loại văn bản kinh điển
const TEXT_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  THOAN_TU: { label: 'Thoán Từ (卦辭)', desc: 'Lời quẻ gốc do Văn Vương chú thích định cát hung tổng quát' },
  THOAN_TRUYEN: { label: 'Thoán Truyện (彖傳)', desc: 'Khổng Tử giải thích cấu trúc và nguyên lý vận hành của quẻ' },
  DAI_TUONG: { label: 'Đại Tượng Truyện (大象傳)', desc: 'Tượng quẻ và đạo xử thế của người quân tử' },
  HAO_TU: { label: 'Hào Từ (爻辭)', desc: 'Chu Công chú giải chi tiết từng giai đoạn biến động thời thế' },
  TIEU_TUONG: { label: 'Tiểu Tượng Truyện (小象傳)', desc: 'Lời giải thích hào vị và sự tương ứng âm dương' },
  DUNG_CUU: { label: 'Dụng Cửu (用九)', desc: 'Lời hào đặc biệt của quẻ Thuần Càn: Quần long vô thủ cát' },
  DUNG_LUC: { label: 'Dụng Lục (用六)', desc: 'Lời hào đặc biệt của quẻ Thuần Khôn: Lợi vĩnh trinh' },
}

export const HexagramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const hexId = Math.min(Math.max(parseInt(id || '1', 10), 1), 64)

  const { userLevel, role, canViewExpert } = useAuth()

  const [searchParams] = useSearchParams()
  const queryLevel = searchParams.get('user_level') as UserLevel | null

  // Danh sách cấp độ người dùng được phép xem theo ma trận quyền (permissions.ts)
  const allowedLevels = useMemo((): UserLevel[] => {
    if (role === 'ADMIN' || canViewExpert) {
      return ['NOVICE', 'PRACTITIONER', 'EXPERT']
    }
    if (role === 'PRACTITIONER') {
      return ['NOVICE', 'PRACTITIONER']
    }
    return ['NOVICE']
  }, [role, canViewExpert])

  // Khởi tạo cấp độ: ưu tiên query param nếu hợp lệ với quyền hoặc vai trò hiện tại
  const [activeLevel, setActiveLevel] = useState<UserLevel>(() => {
    if (queryLevel && ['NOVICE', 'PRACTITIONER', 'EXPERT'].includes(queryLevel)) {
      if (allowedLevels.includes(queryLevel) || role === 'ADMIN') {
        return queryLevel
      }
    }
    const init = userLevel || 'NOVICE'
    if (init === 'EXPERT' && !canViewExpert && role !== 'ADMIN') {
      return 'NOVICE'
    }
    return init
  })

  // Đồng bộ activeLevel khi queryLevel hoặc allowedLevels thay đổi
  useEffect(() => {
    if (queryLevel && ['NOVICE', 'PRACTITIONER', 'EXPERT'].includes(queryLevel)) {
      if (allowedLevels.includes(queryLevel) || role === 'ADMIN') {
        setActiveLevel(queryLevel)
        return
      }
    }
    if (!allowedLevels.includes(activeLevel)) {
      setActiveLevel(allowedLevels[allowedLevels.length - 1])
    }
  }, [allowedLevels, activeLevel, queryLevel, role])

  const { data, isLoading, error } = useQuery({
    queryKey: ['hexagram', hexId, activeLevel],
    queryFn: () => getHexagramDetail(hexId, activeLevel),
  })

  useEffect(() => {
    if (data?.name_vn) {
      document.title = `Quẻ #${data.hexagram_id} ${data.name_vn} (${data.name_han}) — Cổng Tri Thức Kinh Dịch`
    }
  }, [data])

  // Điều hướng Quẻ trước / Quẻ sau
  const prevId = hexId > 1 ? hexId - 1 : 64
  const nextId = hexId < 64 ? hexId + 1 : 1

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
        <p className="text-stone-600 text-sm">Đang tải tri thức quẻ #{hexId} từ Cổng Tri Thức...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
        <h3 className="font-bold text-rose-900">Không thể tải thông tin quẻ #{hexId}</h3>
        <p className="text-xs text-rose-700">{(error as Error)?.message || 'Quẻ không tồn tại'}</p>
        <Link
          to="/hexagrams"
          className="inline-flex items-center gap-1.5 text-xs bg-rose-800 text-white px-3 py-1.5 rounded hover:bg-rose-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách 64 quẻ</span>
        </Link>
      </div>
    )
  }

  const bits = data.binary_code.split('')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Thanh điều hướng & Bộ chọn cấp độ người dùng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            to="/hexagrams"
            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tất cả 64 quẻ</span>
          </Link>
          <div className="h-4 w-px bg-stone-200" />
          <Link
            to={`/hexagrams/${prevId}`}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
            title="Quẻ trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-mono font-bold text-stone-700">
            Quẻ #{data.hexagram_id.toString().padStart(2, '0')} / 64
          </span>
          <Link
            to={`/hexagrams/${nextId}`}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
            title="Quẻ tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Chuyển đổi User Level (Cá nhân hóa Wiig 1993 & Tuân thủ RBAC permissions) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 bg-stone-100 p-1.5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-1.5 px-1 text-xs text-stone-600 font-medium">
            <Eye className="w-3 h-3 text-amber-700" />
            <span>Góc nhìn:</span>
            {role === 'ADMIN' && (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">
                Công cụ Demo ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {allowedLevels.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevel(lvl)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                  activeLevel === lvl
                    ? 'bg-white text-amber-900 shadow-sm border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thông tin Banner giải thích cấp độ tri thức */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Cá nhân hóa giao diện ({activeLevel}): </strong>
          {activeLevel === 'NOVICE' && (
            <span>
              Chế độ Người Mới tiếp cận (Novice): Ẩn toàn bộ chữ Hán, tập trung vào bản dịch tiếng Việt cốt lõi
              (Thoán từ, Đại tượng, Hào từ), ẩn các thiên Thoán truyện/Tiểu tượng phức tạp.
            </span>
          )}
          {activeLevel === 'PRACTITIONER' && (
            <span>
              Chế độ Người Thực Hành (Practitioner): Hiển thị cấu trúc quẻ và diễn giải bối cảnh thực tế.
              Đầy đủ bản dịch tiếng Việt, ẩn các trường kiểm toán nguồn chuyên sâu.
            </span>
          )}
          {activeLevel === 'EXPERT' && (
            <span>
              Chế độ Học Thuật & Chuyên Gia (Expert): Hiển thị trọn vẹn văn bản Chữ Hán nguyên tác (font Noto Serif TC),
              kèm đầy đủ chỉ số kiểm toán (mã nguồn, trang tham chiếu `source_ref`, người thẩm định `verified_by`).
            </span>
          )}
        </div>
      </div>

      {/* Header Quẻ: Tên quẻ, chữ Hán, vạch quẻ & Bát quái */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Cột 1 & 2: Thông tin tên và Bát quái */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                QUẺ #{data.hexagram_id}
              </span>
              <span className="text-xs font-mono text-stone-600">
                Binary: {data.binary_code}
              </span>
              {data.name_source && (
                <span className="text-xs text-stone-600 italic">
                  (Tên nguồn: {data.name_source})
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
                {data.name_vn}
              </h1>
              {activeLevel === 'EXPERT' && data.name_han && (
                <span lang="zh-Hant" className="text-2xl font-serif font-bold text-stone-600 font-han">
                  {data.name_han}
                </span>
              )}
            </div>

            {/* Cấu trúc Bát quái Thượng & Hạ */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <div className="text-xs uppercase font-bold text-stone-600">
                  Quái Thượng (Quẻ Trên)
                </div>
                <div className="font-serif font-bold text-base text-stone-900 flex items-center justify-between">
                  <span>{data.upper_trigram.name_vn} ({data.upper_trigram.nature_symbol})</span>
                  {activeLevel === 'EXPERT' && (
                    <span lang="zh-Hant" className="text-sm font-normal text-stone-600 font-han">{data.upper_trigram.name_han}</span>
                  )}
                </div>
                <div className="text-xs text-stone-700 font-mono">
                  Hành: {data.upper_trigram.five_element} · Mã: {data.upper_trigram.binary_code}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <div className="text-xs uppercase font-bold text-stone-600">
                  Quái Hạ (Quẻ Dưới)
                </div>
                <div className="font-serif font-bold text-base text-stone-900 flex items-center justify-between">
                  <span>{data.lower_trigram.name_vn} ({data.lower_trigram.nature_symbol})</span>
                  {activeLevel === 'EXPERT' && (
                    <span lang="zh-Hant" className="text-sm font-normal text-stone-600 font-han">{data.lower_trigram.name_han}</span>
                  )}
                </div>
                <div className="text-xs text-stone-700 font-mono">
                  Hành: {data.lower_trigram.five_element} · Mã: {data.lower_trigram.binary_code}
                </div>
              </div>
            </div>
          </div>

          {/* Cột 3: Trực quan 6 vạch quẻ */}
          <div className="flex flex-col items-center justify-center p-4 bg-stone-50/80 rounded-xl border border-stone-200">
            <div className="text-xs font-semibold text-stone-600 mb-2">Đồ Hình 6 Hào</div>
            <div className="w-40 flex flex-col gap-1.5 p-3 bg-white rounded-lg border border-stone-200 shadow-inner">
              {bits.map((bit, idx) => {
                const linePos = 6 - idx
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-600 w-3 text-right">
                      {linePos}
                    </span>
                    <div className="flex-1 h-2 flex items-center justify-between">
                      {bit === '1' ? (
                        <div className="w-full h-1.5 bg-stone-900 rounded-full" />
                      ) : (
                        <>
                          <div className="w-[44%] h-1.5 bg-stone-600 rounded-full" />
                          <div className="w-[44%] h-1.5 bg-stone-600 rounded-full" />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-xs text-stone-600 mt-2 font-mono">
              Hào 1 (Dưới) → Hào 6 (Trên)
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH KINH VĂN CỔ ĐIỂN (CLASSIC TEXTS) */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-700" />
            <span>Kinh Văn Cổ Điển ({data.classic_texts.length} mục văn bản)</span>
          </h2>
          <span className="text-xs text-stone-600">
            Chế độ: <span className="font-bold text-amber-800">{activeLevel}</span>
          </span>
        </div>

        <div className="space-y-4">
          {data.classic_texts.map((item, idx) => {
            const typeConfig = TEXT_TYPE_LABELS[item.text_type] || {
              label: item.text_type,
              desc: 'Văn bản kinh điển',
            }

            return (
              <div
                key={item.text_id || idx}
                className="p-4 bg-stone-50/70 rounded-xl border border-stone-200 space-y-2.5 transition hover:bg-stone-50"
              >
                {/* Tiêu đề loại kinh văn */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 font-mono">
                      {typeConfig.label}
                    </span>
                    {item.line_position && (
                      <span className="text-xs font-semibold text-rose-700">
                        Hào {item.line_position}
                      </span>
                    )}
                  </div>

                  {/* Nhãn nguồn học thuật (cho EXPERT) */}
                  {activeLevel === 'EXPERT' && item.verified_by && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Thẩm định: {item.verified_by}</span>
                    </div>
                  )}
                </div>

                {/* Văn bản Chữ Hán (CHỈ HIỆN KHI EXPERT VÀ CÓ CHỮ HÁN) */}
                {activeLevel === 'EXPERT' && item.text_han && (
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/70">
                    <div className="text-xs uppercase font-bold text-amber-800 mb-1 tracking-wider">
                      Nguyên Tác Chữ Hán (Source Han):
                    </div>
                    <p lang="zh-Hant" className="font-serif text-base text-stone-900 leading-relaxed font-han select-all">
                      {item.text_han}
                    </p>
                  </div>
                )}

                {/* Bản dịch & Bình chú Tiếng Việt */}
                <div className="space-y-1">
                  <div className="text-xs uppercase font-bold text-stone-600">
                    Bản dịch Tiếng Việt:
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-sans">
                    {item.text_vn}
                  </p>
                </div>

                {/* Metadata kiểm toán cho cấp độ EXPERT */}
                {activeLevel === 'EXPERT' && (
                  <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600 font-mono">
                    <div>
                      <span className="font-semibold text-stone-700">Nguồn:</span> {item.source_title || 'Nguồn gốc'}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700">Tham chiếu:</span> {item.source_ref || 'Chưa ghi trang'}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700">Issues:</span> {item.issues || 'Không có'}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* DIỄN GIẢI CHUYÊN ĐỀ THEO TOPIC (PRACTITIONER & EXPERT) */}
      {activeLevel !== 'NOVICE' && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
            <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Diễn Giải Bối Cảnh Thực Tế Theo Chủ Đề</span>
            </h2>
            <span className="text-xs text-stone-600">Bối Cảnh Thực Tế (Wiig 1993)</span>
          </div>

          {Object.keys(data.interpretations_by_topic || {}).length === 0 ? (
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 text-center">
              Chưa có bài diễn giải chuyên đề nào được phê duyệt cho quẻ này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {Object.entries(data.interpretations_by_topic).map(([topic, list]) => (
                <div key={topic} className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="text-xs font-bold text-amber-900 font-mono">
                      Chủ đề: {TOPIC_I18N[topic]?.label || topic}
                    </span>
                    <span className="text-xs text-stone-600">
                      {list.length} bài diễn giải
                    </span>
                  </div>

                  {list.map(interp => (
                    <div key={interp.interpretation_id} className="text-xs space-y-1">
                      <div className="font-semibold text-stone-800">{interp.summary}</div>
                      <p className="text-stone-700 text-xs leading-relaxed whitespace-pre-line">
                        {interp.guidance}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { HexagramInfo } from '@/types/divination.types'

interface HexagramVisualProps {
  hexagram: HexagramInfo
  movingLine?: number
  roleLabel: string // 'Quẻ Chủ' | 'Quẻ Hỗ' | 'Quẻ Biến'
  elementColor?: string
  theDungSide?: 'UPPER' | 'LOWER' | null
}

export const HexagramVisual: React.FC<HexagramVisualProps> = ({
  hexagram,
  movingLine,
  roleLabel,
  elementColor = 'border-amber-600',
  theDungSide,
}) => {
  // binary_code có độ dài 6, bit 0..5 (bit 0 là hào 1 ở dưới cùng hoặc trên cùng?)
  // Theo Tầng 1 & Tầng 2:
  // Hào 1 (Sơ hào) là bit 0, Hào 6 (Thượng hào) là bit 5 (hoặc ngược lại).
  // Kiểm tra: Thuần Càn = '111111'.
  // Quẻ Thủy Lôi Truân: Thượng Thủy (010), Hạ Lôi (001) -> binary: 010001
  // Line 1: '1', Line 2: '0', Line 3: '0' (Lôi), Line 4: '0', Line 5: '1', Line 6: '0' (Thủy).
  // Khi vẽ Kinh Dịch truyền thống: Hào 6 ở trên đỉnh, Hào 1 ở dưới đáy!
  const bits = hexagram.binary_code.split('') // index 0..5
  // Để vẽ từ Hào 6 (đỉnh) xuống Hào 1 (đáy):
  // Hào 6 = bit 5, Hào 5 = bit 4, Hào 4 = bit 3, Hào 3 = bit 2, Hào 2 = bit 1, Hào 1 = bit 0
  const lines = [6, 5, 4, 3, 2, 1].map((pos) => {
    const bit = bits[pos - 1] || '0'
    const isYang = bit === '1'
    const isMoving = movingLine === pos
    return { pos, isYang, isMoving }
  })

  return (
    <div className={`p-4 bg-white rounded-xl border-2 ${elementColor} shadow-sm text-center flex flex-col items-center justify-between`}>
      <div className="w-full mb-3 flex items-center justify-between border-b border-stone-100 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
          {roleLabel}
        </span>
        <span className="text-xs font-mono text-stone-400">#{hexagram.hexagram_id}</span>
      </div>

      <div className="font-serif font-bold text-lg text-stone-900 mb-0.5">
        {hexagram.name_vn}
      </div>
      <div className="font-serif text-sm text-amber-900/80 mb-3">
        {hexagram.name_han}
      </div>

      {/* 6 Hào trực quan (Hào 6 trên cùng, Hào 1 dưới cùng) */}
      <div className="w-40 space-y-1.5 my-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
        {lines.map(({ pos, isYang, isMoving }) => {
          const isUpper = pos >= 4
          const isDungLine =
            (theDungSide === 'UPPER' && isUpper) || (theDungSide === 'LOWER' && !isUpper)

          return (
            <div key={pos} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-stone-400 w-3 text-right">
                {pos}
              </span>

              <div className="flex-1 flex items-center justify-center h-3">
                {isYang ? (
                  // Hào Dương: một vạch liền
                  <div
                    className={`w-full h-2.5 rounded-sm transition ${
                      isMoving
                        ? 'bg-rose-600 ring-2 ring-rose-400'
                        : 'bg-stone-800'
                    }`}
                  />
                ) : (
                  // Hào Âm: hai vạch đứt
                  <div className="w-full flex justify-between gap-2 h-2.5">
                    <div
                      className={`w-[45%] h-full rounded-sm transition ${
                        isMoving
                          ? 'bg-rose-600 ring-2 ring-rose-400'
                          : 'bg-stone-800'
                      }`}
                    />
                    <div
                      className={`w-[45%] h-full rounded-sm transition ${
                        isMoving
                          ? 'bg-rose-600 ring-2 ring-rose-400'
                          : 'bg-stone-800'
                      }`}
                    />
                  </div>
                )}
              </div>

              {isMoving ? (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded animate-pulse">
                  Động
                </span>
              ) : isDungLine ? (
                <span className="text-[9px] text-stone-400">
                  {theDungSide === 'UPPER' && isUpper ? 'Dụng' : theDungSide === 'LOWER' && !isUpper ? 'Dụng' : ''}
                </span>
              ) : (
                <span className="w-4" />
              )}
            </div>
          )
        })}
      </div>

      {/* Thông tin quái Thượng & Hạ */}
      <div className="w-full mt-3 pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
        <div className="text-left bg-stone-50 p-1.5 rounded">
          <div className="text-stone-400 text-[10px]">Thượng quái</div>
          <div className="font-semibold text-stone-800">
            {hexagram.upper_trigram.name_vn} ({hexagram.upper_trigram.five_element})
          </div>
          <div className="text-stone-500 text-[10px]">{hexagram.upper_trigram.nature_symbol}</div>
        </div>
        <div className="text-left bg-stone-50 p-1.5 rounded">
          <div className="text-stone-400 text-[10px]">Hạ quái</div>
          <div className="font-semibold text-stone-800">
            {hexagram.lower_trigram.name_vn} ({hexagram.lower_trigram.five_element})
          </div>
          <div className="text-stone-500 text-[10px]">{hexagram.lower_trigram.nature_symbol}</div>
        </div>
      </div>
    </div>
  )
}

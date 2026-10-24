import React from 'react'
import { Link } from 'react-router-dom'

export interface HexagramSummary {
  hexagram_id: number
  binary_code: string
  name_vn: string
  name_han: string
  upper_code: string
  lower_code: string
  upper_trigram: {
    id: number
    name_vn: string
    name_han: string
    binary_code: string
    five_element: string
    nature_symbol: string
  }
  lower_trigram: {
    id: number
    name_vn: string
    name_han: string
    binary_code: string
    five_element: string
    nature_symbol: string
  }
}

interface HexagramCardProps {
  hexagram: HexagramSummary
  compact?: boolean
}

// Bảng màu ngũ hành
const ELEMENT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  KIM: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  MOC: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  THUY: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  HOA: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  THO: { bg: 'bg-amber-100/60', text: 'text-yellow-900', border: 'border-yellow-300' },
}

export const HexagramCard: React.FC<HexagramCardProps> = ({ hexagram, compact = false }) => {
  // 6 bit: bit 0 là hào 6 (trên cùng), bit 5 là hào 1 (dưới cùng)
  // binary_code có độ dài 6: bit[0]..bit[2] là quái thượng, bit[3]..bit[5] là quái hạ
  const bits = hexagram.binary_code.split('')

  const upperStyle = ELEMENT_STYLES[hexagram.upper_trigram.five_element] || ELEMENT_STYLES.THO
  const lowerStyle = ELEMENT_STYLES[hexagram.lower_trigram.five_element] || ELEMENT_STYLES.THO

  if (compact) {
    return (
      <Link
        to={`/hexagrams/${hexagram.hexagram_id}`}
        className="group block p-2.5 bg-white border border-stone-200 rounded-lg hover:border-amber-500 hover:shadow-md transition text-left relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono font-bold text-stone-700 bg-stone-100 px-1 rounded">
            #{hexagram.hexagram_id.toString().padStart(2, '0')}
          </span>
          <span lang="zh-Hant" className="text-xs font-serif text-stone-700 font-bold group-hover:text-amber-700 transition">
            {hexagram.name_han}
          </span>
        </div>
        <div className="font-serif font-bold text-xs text-stone-900 group-hover:text-amber-800 truncate">
          {hexagram.name_vn}
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-stone-600 font-medium">
          <span>{hexagram.upper_trigram.name_vn}/{hexagram.lower_trigram.name_vn}</span>
          <span className="font-mono text-stone-600">{hexagram.binary_code}</span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/hexagrams/${hexagram.hexagram_id}`}
      className="group block bg-white border border-stone-200 rounded-xl p-3.5 hover:border-amber-500 hover:shadow-md transition relative flex flex-col justify-between"
    >
      {/* Header card */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">
            #{hexagram.hexagram_id.toString().padStart(2, '0')}
          </span>
          <span className="text-xs font-mono text-stone-600">{hexagram.binary_code}</span>
        </div>
        <span lang="zh-Hant" className="font-serif text-stone-800 font-bold text-xs group-hover:text-amber-800 transition">
          {hexagram.name_han}
        </span>
      </div>

      {/* Tên quẻ & Mini vạch quẻ */}
      <div className="flex items-center justify-between gap-3 my-1.5">
        <div>
          <h4 className="font-serif font-bold text-sm text-stone-900 group-hover:text-amber-700 transition leading-snug">
            {hexagram.name_vn}
          </h4>
          <div className="text-xs text-stone-600 mt-0.5">
            {hexagram.upper_trigram.nature_symbol} trên {hexagram.lower_trigram.nature_symbol}
          </div>
        </div>

        {/* 6 vạch nhị phân trực quan */}
        <div className="flex flex-col gap-0.5 w-7 py-0.5 items-center bg-stone-50 rounded p-1 border border-stone-100">
          {bits.map((bit, idx) => (
            <div key={idx} className="w-full h-1 flex items-center justify-between">
              {bit === '1' ? (
                // Dương: liền
                <div className="w-full h-0.5 bg-stone-800 rounded-full" />
              ) : (
                // Âm: đứt
                <>
                  <div className="w-[42%] h-0.5 bg-stone-500 rounded-full" />
                  <div className="w-[42%] h-0.5 bg-stone-500 rounded-full" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Thượng/Hạ quái và Ngũ hành */}
      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1">
          <span className={`px-1 py-0.5 rounded border text-[9px] font-semibold ${upperStyle.bg} ${upperStyle.text} ${upperStyle.border}`}>
            {hexagram.upper_trigram.name_vn} ({hexagram.upper_trigram.five_element})
          </span>
          <span className="text-stone-300">/</span>
          <span className={`px-1 py-0.5 rounded border text-[9px] font-semibold ${lowerStyle.bg} ${lowerStyle.text} ${lowerStyle.border}`}>
            {hexagram.lower_trigram.name_vn} ({hexagram.lower_trigram.five_element})
          </span>
        </div>
        <span className="text-amber-700 font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
          Chi tiết →
        </span>
      </div>
    </Link>
  )
}

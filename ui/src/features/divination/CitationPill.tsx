import React, { useState, useRef, useEffect } from 'react'
import { BookOpen, ShieldCheck, Zap, Scale, X, Info } from 'lucide-react'

export interface CitationInfo {
  category: string
  friendlyLabel: string
  description: string
  icon: 'element' | 'classic' | 'rule' | 'synthesis' | 'other'
}

/**
 * Phân tích mã căn cứ kỹ thuật nội bộ thành thông tin hiển thị thân thiện và giải thích ngữ nghĩa chuyên gia.
 */
export function parseCitationDetails(raw: string): CitationInfo {
  const trimmed = raw.trim()

  // 1. Ngũ hành Thể Dụng
  if (trimmed.startsWith('Ngũ hành·') || trimmed.startsWith('Ngũ hành.')) {
    const pair = trimmed.replace(/^Ngũ hành[·.]/, '').trim()
    if (pair === 'THE_DUNG_MAIN') {
      return {
        category: 'Ngũ Hành Thể Dụng (Quẻ Chủ)',
        friendlyLabel: 'Căn cứ: Ngũ hành Quẻ Chủ',
        description:
          'Quan hệ sinh khắc trực tiếp giữa Thể quái (chủ thể) và Dụng quái (sự việc) của Quẻ Chủ, quyết định thế cục và xu hướng cát hung ban đầu.',
        icon: 'element',
      }
    }
    if (pair === 'THE_UPPER_NUCLEAR') {
      return {
        category: 'Ngũ Hành Thể Dụng (Thượng Hỗ)',
        friendlyLabel: 'Căn cứ: Thượng Hỗ',
        description:
          'Quan hệ Thể Dụng tại Thượng Hỗ (quẻ hỗ trên, hào 3-4-5), phản ánh diễn tiến và chuyển biến nội bộ ở giai đoạn giữa sự việc.',
        icon: 'element',
      }
    }
    if (pair === 'THE_LOWER_NUCLEAR') {
      return {
        category: 'Ngũ Hành Thể Dụng (Hạ Hỗ)',
        friendlyLabel: 'Căn cứ: Hạ Hỗ',
        description:
          'Quan hệ Thể Dụng tại Hạ Hỗ (quẻ hỗ dưới, hào 2-3-4), đại diện cho trở lực tiềm ẩn hoặc cơ sở hỗ trợ ngầm ở giai đoạn giữa.',
        icon: 'element',
      }
    }
    if (pair === 'THE_TRANSFORMED_DUNG') {
      return {
        category: 'Ngũ Hành Thể Dụng (Quẻ Biến)',
        friendlyLabel: 'Căn cứ: Quẻ Biến',
        description:
          'Quan hệ Thể Dụng tại Quẻ Biến sau khi hào động biến dịch, quyết định kết quả quy tụ và đích đến cuối cùng của mưu sự.',
        icon: 'element',
      }
    }
    return {
      category: 'Ngũ Hành Thể Dụng',
      friendlyLabel: 'Căn cứ: Ngũ hành',
      description: `Quan hệ ngũ hành sinh khắc theo nguyên lý Mai Hoa Dịch Số (${pair}).`,
      icon: 'element',
    }
  }

  // 2. Kinh văn cổ điển (Thoán từ, Thoán truyện, Đại tượng, Hào từ, Tiểu tượng)
  if (trimmed.startsWith('Thoán từ')) {
    const ref = trimmed.replace(/^Thoán từ[,\s]*/, '').trim()
    return {
      category: 'Kinh Văn Chu Dịch',
      friendlyLabel: ref ? `Căn cứ: Thoán từ ${ref}` : 'Căn cứ: Thoán từ',
      description:
        'Lời phán định toàn quẻ của Chu Văn Vương trong Chu Dịch cổ bản, đúc kết bối cảnh đại cục, thiên thời và đạo lý cốt lõi.',
      icon: 'classic',
    }
  }
  if (trimmed.startsWith('Thoán truyện')) {
    const ref = trimmed.replace(/^Thoán truyện[,\s]*/, '').trim()
    return {
      category: 'Thập Dực (Khổng Tử)',
      friendlyLabel: ref ? `Căn cứ: Thoán truyện ${ref}` : 'Căn cứ: Thoán truyện',
      description:
        'Lời giảng giải trong Thoán Truyện của Khổng Tử, giải thích lý lẽ âm dương, cương nhu và nguyên do cát hung của quẻ.',
      icon: 'classic',
    }
  }
  if (trimmed.startsWith('Đại tượng')) {
    const ref = trimmed.replace(/^Đại tượng[,\s]*/, '').trim()
    return {
      category: 'Đại Tượng Truyện',
      friendlyLabel: ref ? `Căn cứ: Đại tượng ${ref}` : 'Căn cứ: Đại tượng',
      description:
        'Lời Tượng Truyện của Khổng Tử, lấy hình tượng Trời Đất để chỉ dạy người quân tử đạo tu thân, hành xử và xu cát tị hung.',
      icon: 'classic',
    }
  }
  if (trimmed.startsWith('Hào từ')) {
    const match = trimmed.match(/^Hào từ\s*(\d+)(?:[,\s]+(.*))?/)
    const lineNum = match ? match[1] : ''
    const ref = match && match[2] ? match[2].trim() : ''
    return {
      category: 'Kinh Văn Hào Động (Chu Công)',
      friendlyLabel: ref ? `Căn cứ: Hào từ ${lineNum} ${ref}` : `Căn cứ: Hào từ ${lineNum}`,
      description: `Lời hào từ của Chu Công dành riêng cho hào động số ${lineNum}, soi rọi thời cơ, cảnh báo rủi ro hoặc chỉ dẫn hành động then chốt.`,
      icon: 'classic',
    }
  }
  if (trimmed.startsWith('Tiểu tượng')) {
    const match = trimmed.match(/^Tiểu tượng\s*(\d+)(?:[,\s]+(.*))?/)
    const lineNum = match ? match[1] : ''
    return {
      category: 'Tiểu Tượng Truyện',
      friendlyLabel: `Căn cứ: Tiểu tượng ${lineNum}`,
      description: `Lời giải nghĩa cụ thể về đạo lý, đức tính và vị thế của riêng hào động số ${lineNum}.`,
      icon: 'classic',
    }
  }

  // 3. Luật chuyên gia (Inference Rules)
  if (trimmed.startsWith('Luật·') || trimmed.startsWith('Luật.')) {
    const ruleCode = trimmed.replace(/^Luật[·.]/, '').trim()
    let friendly = 'Căn cứ: Luật Chuyên Gia'
    if (ruleCode.includes('CAREER')) friendly = 'Căn cứ: Luật Sự Nghiệp'
    else if (ruleCode.includes('FINANCE')) friendly = 'Căn cứ: Luật Tài Chính'
    else if (ruleCode.includes('RELATIONSHIP')) friendly = 'Căn cứ: Luật Quan Hệ'
    else if (ruleCode.includes('HEALTH')) friendly = 'Căn cứ: Luật Sức Khỏe'
    else if (ruleCode.includes('ACADEMIC')) friendly = 'Căn cứ: Luật Học Vấn'
    else if (ruleCode.includes('CORE')) friendly = 'Căn cứ: Luật Mai Hoa'

    return {
      category: 'Quy Tắc Suy Luận Chuyên Gia',
      friendlyLabel: friendly,
      description: `Quy tắc suy luận chuyên gia (${ruleCode}) từ Mai Hoa Dịch Số được hệ thống kích hoạt tự động theo bối cảnh chuyên đề.`,
      icon: 'rule',
    }
  }

  // 4. Tổng hợp điểm số (Synthesis Result)
  if (trimmed.startsWith('Tổng hợp·') || trimmed.startsWith('Tổng hợp.')) {
    const ruleRef = trimmed.replace(/^Tổng hợp[·.]/, '').trim()
    return {
      category: 'Bộ Tổng Hợp Tri Thức Tất Định',
      friendlyLabel: 'Căn cứ: Điểm Tổng Hợp',
      description: `Kết luận phân cực Cát/Hung tính toán tất định theo trọng số 3 trụ cột (Ngũ hành, Luật chuyên gia, Diễn giải đã duyệt) [Mã: ${ruleRef}].`,
      icon: 'synthesis',
    }
  }

  // 5. Bát Quái Loại Tượng (Mai Hoa Dịch Số)
  if (trimmed.startsWith('Tượng·') || trimmed.startsWith('Tượng.')) {
    const triKey = trimmed.replace(/^Tượng[·.]/, '').trim()
    return {
      category: 'Bát Quái Vạn Vật Loại Tượng',
      friendlyLabel: `Căn cứ: Tượng ${triKey}`,
      description: `Bản chất loại tượng kinh điển của quái ${triKey} theo Mai Hoa Dịch Số, phản ánh năng lượng tự nhiên và bối cảnh chuyên đề.`,
      icon: 'classic',
    }
  }

  // Fallback chung
  return {
    category: 'Căn Cứ Tri Thức',
    friendlyLabel: `Căn cứ: ${trimmed}`,
    description: `Nguồn dữ kiện đã được xác thực trong Cơ sở tri thức KinhDich_KB (${trimmed}).`,
    icon: 'other',
  }
}

interface CitationPillProps {
  rawCitation: string
}

export const CitationPill: React.FC<CitationPillProps> = ({ rawCitation }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const info = parseCitationDetails(rawCitation)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const renderIcon = () => {
    switch (info.icon) {
      case 'element':
        return <Zap className="w-3 h-3 text-amber-700" />
      case 'classic':
        return <BookOpen className="w-3 h-3 text-amber-800" />
      case 'rule':
        return <ShieldCheck className="w-3 h-3 text-amber-800" />
      case 'synthesis':
        return <Scale className="w-3 h-3 text-amber-800" />
      default:
        return <Info className="w-3 h-3 text-amber-700" />
    }
  }

  return (
    <span ref={containerRef} className="relative inline-block align-baseline mx-0.5">
      {/* Văn bản ẩn phục vụ kiểm thử tự động và trình đọc màn hình tiếp cận mã gốc */}
      <span className="sr-only">[{rawCitation}]</span>

      {/* Nút bấm hiển thị dạng Footnote / Pill trang nhã */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`${info.friendlyLabel} (${rawCitation})`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-sans font-medium transition cursor-pointer select-none border shadow-2xs ${
          isOpen
            ? 'bg-amber-200 text-amber-950 border-amber-400 ring-1 ring-amber-400'
            : 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border-amber-300/80 hover:border-amber-400'
        }`}
        title={`Bấm để xem giải thích căn cứ: ${rawCitation}`}
      >
        {renderIcon()}
        <span>[{info.friendlyLabel}]</span>
      </button>

      {/* Popover giải thích chi tiết */}
      {isOpen && (
        <span
          role="dialog"
          aria-label={info.friendlyLabel}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3 bg-white border border-amber-300/90 rounded-xl shadow-xl text-xs text-stone-700 block space-y-2 animate-in fade-in zoom-in-95 duration-150 text-left normal-case whitespace-normal"
        >
          {/* Header Popover */}
          <span className="flex items-center justify-between border-b border-stone-100 pb-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {renderIcon()}
              <span>{info.category}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition"
              aria-label="Đóng bảng giải thích"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>

          {/* Tiêu đề & Mã kỹ thuật gốc */}
          <span className="block">
            <span className="font-bold text-stone-900 text-xs block">{info.friendlyLabel}</span>
            <span className="text-[10px] font-mono text-stone-500 mt-0.5 bg-stone-100 px-1.5 py-0.5 rounded inline-block">
              Mã kỹ thuật: [{rawCitation}]
            </span>
          </span>

          {/* Diễn giải ý nghĩa căn cứ */}
          <span className="text-[11px] text-stone-600 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-200 block">
            {info.description}
          </span>
        </span>
      )}
    </span>
  )
}

import React, { useEffect } from 'react'
import { Topic } from '@/types/divination.types'
import { MiniMarkdownRenderer } from './MiniMarkdownRenderer'
import { Sparkles, ShieldCheck, X, BookOpen, Compass } from 'lucide-react'

export interface ExtractedSection3 {
  title: string
  content: string
}

/**
 * Hàm trích xuất riêng Phần 3: Chiến Lược Tu Thân & Xu Cát Tị Hung từ markdown_text.
 * Hỗ trợ cả định dạng từ backend fallback lẫn LLM sinh động.
 */
export function extractSection3(markdownText: string): ExtractedSection3 | null {
  if (!markdownText || typeof markdownText !== 'string') return null

  const lines = markdownText.split('\n')
  let startIndex = -1
  let title = '3. Chiến Lược Tu Thân & Xu Cát Tị Hung (Kế sách Hành động Chiến lược)'

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    // Khớp tiêu đề bắt đầu bằng ## hoặc ### và có số 3 hoặc chứa các cụm từ khóa cốt lõi
    if (
      /^#{1,3}\s*3[\.\s:]/i.test(trimmed) ||
      (/^#{1,3}\s/i.test(trimmed) &&
        /(?:Chiến Lược Tu Thân|Kế Sách Tu Thân|Xu Cát Tị Hung|Kế sách Hành động)/i.test(trimmed))
    ) {
      startIndex = i
      title = trimmed.replace(/^#{1,3}\s*/, '').trim()
      break
    }
  }

  // Nếu không tìm thấy qua duyệt dòng, thử regex toàn văn
  if (startIndex === -1) {
    const match = markdownText.match(
      /(?:^|\n)(#{1,3}\s*(?:3[\.\s:].*|(?:[^\n]*(?:Chiến Lược Tu Thân|Kế Sách Tu Thân|Xu Cát Tị Hung|Kế sách Hành động)[^\n]*)))\n([\s\S]*)$/i
    )
    if (match) {
      return {
        title: match[1].replace(/^#{1,3}\s*/, '').trim(),
        content: match[2].trim(),
      }
    }
    return null
  }

  // Thu thập các dòng từ sau tiêu đề mục 3 tới hết bài hoặc đến khi gặp tiêu đề kế tiếp
  const contentLines: string[] = []
  for (let j = startIndex + 1; j < lines.length; j++) {
    const line = lines[j]
    const trimmed = line.trim()
    if (/^#{1,3}\s+[0-9]/.test(trimmed)) {
      break
    }
    contentLines.push(line)
  }

  const content = contentLines.join('\n').trim()
  if (!content) return null

  return {
    title,
    content,
  }
}

export interface StrategyModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  hexagramName?: string
  topic?: Topic
  onViewFullAnalysis?: () => void
}

export const StrategyModal: React.FC<StrategyModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  hexagramName,
  topic,
  onViewFullAnalysis,
}) => {
  // Lắng nghe phím ESC và khóa scroll body
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="strategy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-amber-300/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Kế Sách Hành Động Chiến Lược · Xu Cát Tị Hung</span>
              </div>
              <h2
                id="strategy-modal-title"
                className="font-serif font-bold text-lg sm:text-xl text-amber-100 tracking-tight leading-snug"
              >
                {title || 'Chiến Lược Tu Thân & Xu Cát Tị Hung'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
                {hexagramName && (
                  <span className="inline-flex items-center gap-1 font-medium text-amber-200">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quẻ {hexagramName}</span>
                  </span>
                )}
                {topic && (
                  <>
                    <span className="text-stone-500">·</span>
                    <span className="text-stone-300">Chủ đề: {topic}</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Banner nguyên lý cốt lõi */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-amber-900">
                Đạo Dịch Dĩ Tu Thân Vi Bản (Lấy Tu Thân Làm Gốc)
              </div>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                Chiến lược hành động được đúc kết từ hào động và tiến trình biến dịch của quẻ. Nhận biết thời thế để chủ động nắm bắt cơ hội, thiết lập lằn ranh an toàn và giữ vững nội lực.
              </p>
            </div>
          </div>

          {/* Nội dung Phần 3 trích xuất */}
          <div className="p-5 bg-stone-50/90 border border-stone-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 border-b border-stone-200 pb-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-800" />
              <span>Nội dung kế sách hành động chi tiết</span>
            </div>
            <MiniMarkdownRenderer text={content} />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onViewFullAnalysis ? (
            <button
              type="button"
              onClick={onViewFullAnalysis}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 hover:underline transition self-center sm:self-auto"
            >
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Xem toàn bộ 3 phần bài luận giải</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 transition shadow-sm active:scale-[0.98]"
          >
            Đã Hiểu & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  )
}

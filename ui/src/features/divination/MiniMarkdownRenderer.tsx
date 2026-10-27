import React from 'react'

export function parseInline(text: string): React.ReactNode[] {
  // Phân rã theo mẫu chữ đậm (**...**) hoặc thẻ trích dẫn ([...])
  const tokens = text.split(/(\*\*.*?\*\*|\[.*?\])/g)
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      const inner = token.slice(2, -2)
      return (
        <strong key={i} className="font-bold text-stone-900">
          {parseInline(inner)}
        </strong>
      )
    }
    if (token.startsWith('[') && token.endsWith(']') && token.length >= 2) {
      const content = token.slice(1, -1)
      return (
        <span
          key={i}
          className="inline-block px-1.5 py-0.2 mx-0.5 text-[10px] font-mono font-medium rounded bg-amber-100/70 text-amber-900 border border-amber-300"
        >
          [{content}]
        </span>
      )
    }
    return token
  })
}

interface MiniMarkdownRendererProps {
  text: string
}

export const MiniMarkdownRenderer: React.FC<MiniMarkdownRendererProps> = ({ text }) => {
  if (!text) return null

  const lines = text.split('\n')

  return (
    <div className="space-y-1 text-xs text-stone-700 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        // 1. Tiêu đề H2 (## )
        if (line.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-sm font-serif font-bold text-amber-950 mt-4 mb-2 border-b border-amber-200/60 pb-1"
            >
              {parseInline(line.slice(3))}
            </h3>
          )
        }

        // 2. Tiêu đề H3 (### )
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-stone-900 mt-2.5 mb-1">
              {parseInline(line.slice(4))}
            </h4>
          )
        }

        // 3. Danh sách gạch đầu dòng (- hoặc + hoặc *)
        if (/^[-+*]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[-+*]\s+/, '')
          return (
            <li key={idx} className="ml-4 list-disc text-stone-700 leading-relaxed">
              {parseInline(content)}
            </li>
          )
        }

        // 4. Danh sách số thứ tự (1. , 2. ...)
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (orderedMatch) {
          return (
            <li key={idx} className="ml-4 list-decimal text-stone-700 leading-relaxed">
              {parseInline(orderedMatch[2])}
            </li>
          )
        }

        // 5. Dòng trống
        if (trimmed === '') {
          return <div key={idx} className="h-2" />
        }

        // 6. Đoạn văn thường
        return (
          <p key={idx} className="text-stone-700 leading-relaxed">
            {parseInline(line)}
          </p>
        )
      })}
    </div>
  )
}

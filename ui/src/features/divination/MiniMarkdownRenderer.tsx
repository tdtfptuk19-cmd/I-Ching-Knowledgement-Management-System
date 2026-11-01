import React from 'react'
import { CitationPill } from './CitationPill'

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
      return <CitationPill key={i} rawCitation={content} />
    }
    return token
  })
}

interface MiniMarkdownRendererProps {
  text: string
}

const UNORDERED_ITEM = /^[-+*]\s+/
const ORDERED_ITEM = /^(\d+)\.\s+(.*)$/

export const MiniMarkdownRenderer: React.FC<MiniMarkdownRendererProps> = ({ text }) => {
  if (!text) return null

  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let idx = 0

  while (idx < lines.length) {
    const line = lines[idx]
    const trimmed = line.trim()

    // 1. Tiêu đề H2 (## )
    if (line.startsWith('## ')) {
      blocks.push(
        <h3
          key={idx}
          className="text-sm font-serif font-bold text-amber-950 mt-4 mb-2 border-b border-amber-200/60 pb-1"
        >
          {parseInline(line.slice(3))}
        </h3>
      )
      idx += 1
      continue
    }

    // 2. Tiêu đề H3 (### )
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={idx} className="text-xs font-bold text-stone-900 mt-2.5 mb-1">
          {parseInline(line.slice(4))}
        </h4>
      )
      idx += 1
      continue
    }

    // 3. Danh sách gạch đầu dòng (- hoặc + hoặc *): gộp các mục liên tiếp vào một <ul>
    //    để <li> luôn có phần tử cha hợp lệ (WCAG / axe: listitem).
    if (UNORDERED_ITEM.test(trimmed)) {
      const items: Array<{ key: number; content: string }> = []
      while (idx < lines.length) {
        const current = lines[idx].trim()
        if (UNORDERED_ITEM.test(current)) {
          items.push({ key: idx, content: current.replace(UNORDERED_ITEM, '') })
          idx += 1
        } else if (current === '' && idx + 1 < lines.length && UNORDERED_ITEM.test(lines[idx + 1].trim())) {
          idx += 1
        } else {
          break
        }
      }
      blocks.push(
        <ul key={`ul-${items[0].key}`} className="ml-4 list-disc space-y-1 text-stone-700 leading-relaxed">
          {items.map((item) => (
            <li key={item.key}>{parseInline(item.content)}</li>
          ))}
        </ul>
      )
      continue
    }

    // 4. Danh sách số thứ tự (1. , 2. ...): gộp các mục liên tiếp vào một <ol>
    const orderedMatch = trimmed.match(ORDERED_ITEM)
    if (orderedMatch) {
      const items: Array<{ key: number; content: string }> = []
      while (idx < lines.length) {
        const currentMatch = lines[idx].trim().match(ORDERED_ITEM)
        if (currentMatch) {
          items.push({ key: idx, content: currentMatch[2] })
          idx += 1
        } else if (
          lines[idx].trim() === '' &&
          idx + 1 < lines.length &&
          ORDERED_ITEM.test(lines[idx + 1].trim())
        ) {
          idx += 1
        } else {
          break
        }
      }
      blocks.push(
        <ol key={`ol-${items[0].key}`} className="ml-4 list-decimal space-y-1 text-stone-700 leading-relaxed">
          {items.map((item) => (
            <li key={item.key}>{parseInline(item.content)}</li>
          ))}
        </ol>
      )
      continue
    }

    // 5. Dòng trống
    if (trimmed === '') {
      blocks.push(<div key={idx} className="h-2" />)
      idx += 1
      continue
    }

    // 6. Đoạn văn thường
    blocks.push(
      <p key={idx} className="text-stone-700 leading-relaxed">
        {parseInline(line)}
      </p>
    )
    idx += 1
  }

  return <div className="space-y-1 text-xs text-stone-700 leading-relaxed font-sans">{blocks}</div>
}

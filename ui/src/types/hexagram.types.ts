import { TrigramInfo, ClassicTextItem, UserLevel } from './divination.types'

export interface HexagramDetailResponse {
  hexagram_id: number
  name_vn: string
  name_han?: string | null
  name_source?: string | null
  binary_code: string
  upper_trigram: TrigramInfo
  lower_trigram: TrigramInfo
  user_level: UserLevel
  classic_texts: ClassicTextItem[]
  interpretations_by_topic: Record<string, Array<{
    interpretation_id: number
    topic: string
    summary: string
    guidance: string
    polarity: number
    author_type: string
    source_title?: string
  }>>
}

export interface SearchResultItem {
  item_type: 'CLASSIC_TEXT' | 'INTERPRETATION'
  hexagram_id: number
  hexagram_name: string
  title: string
  content: string
  content_han?: string | null
  topic?: string | null
  text_type?: string | null
  line_position?: number | null
  polarity?: number | null
  source_id: number
  provenance?: {
    confidence?: string | null
    source_ref?: string | null
    issues?: string | null
    [key: string]: unknown
  } | null
}

export interface SearchResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  query?: string | null
  topic?: string | null
  items: SearchResultItem[]
}

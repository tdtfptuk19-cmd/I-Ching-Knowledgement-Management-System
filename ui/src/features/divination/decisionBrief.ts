import { DivinationResponse, InterpretationItem, Topic } from '@/types/divination.types'

/**
 * decisionBrief.ts
 * Chuyển kết quả suy luận tất định (quẻ, Thể–Dụng, ngũ hành, nhãn tổng hợp)
 * thành một "Bản định hướng hành động" thân thiện với người dùng phổ thông:
 * - Cục diện tổng quan 1–2 câu
 * - Việc NÊN LÀM (Actionable Do's)
 * - Việc NÊN TRÁNH (Actionable Don'ts)
 * - Người đồng hành & hướng ưu tiên
 * - Thời hiệu dự báo 3–12 tháng
 *
 * Toàn bộ nội dung được suy ra từ dữ kiện engine trả về, không gọi LLM
 * và không thay đổi điểm số/nhãn phân cực.
 */

export interface DecisionBrief {
  polarityLabel: string
  generalTrend: string
  dos: string[]
  donts: string[]
  keyPeople: string
  favorableDirection: string
  timeHorizon: string
  philosophyNote: string
}

interface GuidanceSet {
  dos: string[]
  donts: string[]
}

const TREND_BY_LABEL: Record<string, string> = {
  'ĐẠI CÁT': 'Thời vận đang rộng mở, có nhiều điều kiện thuận lợi cho việc khởi sự và mở rộng.',
  'TIỂU CÁT': 'Xu hướng nghiêng về thuận lợi, nhưng thành quả đến tốt nhất khi giữ nhịp độ vừa phải.',
  'BÌNH HÒA': 'Cục diện đang cân bằng, phù hợp để củng cố nội lực và chờ thời cơ rõ nét hơn.',
  'TIỂU HUNG': 'Có những thử thách cần lưu tâm; nên thận trọng và ưu tiên phòng ngừa hơn là mở rộng.',
  'ĐẠI HUNG': 'Giai đoạn nhiều áp lực; nên bảo toàn những gì đang có, hạn chế mạo hiểm và tu sửa nội tại.',
}

const RELATION_GUIDANCE: Record<string, GuidanceSet> = {
  SINH_NHAP: {
    dos: [
      'Chủ động khởi sự khi cơ hội đã tương đối rõ ràng.',
      'Tận dụng đà thuận lợi để mở rộng phạm vi ảnh hưởng.',
    ],
    donts: [
      'Tránh do dự quá lâu làm lỡ thời cơ.',
      'Tránh tự mãn hoặc chủ quan với kết quả ban đầu.',
    ],
  },
  SINH_XUAT: {
    dos: [
      'Ưu tiên củng cố nội lực và nguồn lực cốt lõi.',
      'Chia nhỏ mục tiêu, đầu tư có chọn lọc thay vì dàn trải.',
    ],
    donts: [
      'Tránh ôm đồm quá nhiều việc cùng lúc.',
      'Tránh đánh đổi lợi ích dài hạn vì nhu cầu trước mắt.',
    ],
  },
  KHAC_XUAT: {
    dos: [
      'Giữ nhịp độ đều và xử lý dứt điểm từng việc.',
      'Dùng quy trình, bằng chứng và sự chuẩn bị để thuyết phục.',
    ],
    donts: [
      'Tránh nóng vội hoặc dùng sức quá mức.',
      'Tránh tranh thắng thua trực diện khi chưa cần thiết.',
    ],
  },
  KHAC_NHAP: {
    dos: [
      'Chuyển sang thế phòng thủ và bảo toàn những gì đang có.',
      'Rà soát rủi ro, chuẩn bị sẵn phương án dự phòng.',
    ],
    donts: [
      'Tránh mở rộng mạo hiểm trong giai đoạn này.',
      'Tránh đối đầu trực diện với bên có lợi thế hơn.',
    ],
  },
  TY_HOA: {
    dos: [
      'Duy trì sự cân bằng và nhịp độ hiện tại.',
      'Tăng cường trao đổi, hợp tác với người đồng hành.',
    ],
    donts: [
      'Tránh đẩy mọi việc đến giới hạn cực đoan.',
      'Tránh xem nhẹ những chi tiết nhỏ trong cam kết.',
    ],
  },
}

const TOPIC_GUIDANCE: Record<Topic, GuidanceSet> = {
  CAREER: {
    dos: [
      'Chuẩn bị kỹ năng và hồ sơ trước khi đề xuất công việc mới.',
      'Chủ động báo cáo tiến độ với người phụ trách.',
    ],
    donts: [
      'Tránh hứa vượt quá năng lực thực tế.',
      'Tránh quyết định thay đổi nghề nghiệp lớn khi cảm xúc chưa ổn định.',
    ],
  },
  FINANCE: {
    dos: [
      'Tham vấn chuyên gia tài chính trước quyết định lớn.',
      'Quản trị dòng tiền và giữ quỹ dự phòng tối thiểu.',
      'Chỉ đầu tư vào lĩnh vực bản thân hiểu rõ.',
    ],
    donts: [
      'Tránh đầu tư mạo hiểm, vay nóng hoặc dùng đòn bẩy cao.',
      'Tránh tin vào những cam kết lợi nhuận quá hấp dẫn.',
    ],
  },
  RELATIONSHIP: {
    dos: [
      'Lắng nghe và nói rõ nhu cầu của mình một cách bình tĩnh.',
      'Dành thời gian cho những cuộc trò chuyện thẳng thắn.',
    ],
    donts: [
      'Tránh áp đặt hoặc đòi hỏi thay đổi ngay lập tức.',
      'Tránh đưa ra quyết định gắn kết hay chia tay khi đang nóng giận.',
    ],
  },
  HEALTH: {
    dos: [
      'Duy trì nhịp sinh hoạt và khám sức khỏe định kỳ.',
      'Tham vấn bác sĩ trước khi thay đổi phác đồ hoặc dùng thuốc.',
      'Chủ động tham vấn chuyên gia y tế trước quyết định quan trọng.',
    ],
    donts: [
      'Tránh tự chẩn đoán hoặc tự ý dùng thuốc.',
      'Tránh bỏ qua các dấu hiệu bất thường kéo dài.',
    ],
  },
  ACADEMIC: {
    dos: [
      'Lập kế hoạch ôn tập theo tuần và bám sát mốc thời gian.',
      'Học theo nhóm để bù đắp điểm yếu.',
    ],
    donts: [
      'Tránh học dồn vào phút cuối.',
      'Tránh đổi phương pháp học liên tục khi chưa kiểm chứng.',
    ],
  },
  GENERAL: {
    dos: [
      'Giữ sự cân bằng giữa công việc, sức khỏe và các mối quan hệ.',
      'Dành thời gian nhìn lại mục tiêu trước khi cam kết việc mới.',
    ],
    donts: [
      'Tránh thay đổi nhiều thứ cùng lúc.',
      'Tránh quyết định vội vàng chỉ vì áp lực bên ngoài.',
    ],
  },
}

const POLARITY_GUIDANCE: Record<string, GuidanceSet> = {
  'ĐẠI CÁT': {
    dos: ['Giữ sự khiêm tốn, chia sẻ thành quả để tránh tự mãn.'],
    donts: ['Tránh chủ quan vì kết quả tốt đến sớm.'],
  },
  'TIỂU CÁT': {
    dos: ['Tiến từng bước và xác nhận lại thông tin trước khi quyết.'],
    donts: ['Tránh nóng vội đòi kết quả ngay.'],
  },
  'BÌNH HÒA': {
    dos: ['Duy trì nhịp độ hiện tại và chuẩn bị cho bước tiếp theo.'],
    donts: ['Tránh đảo ngược kế hoạch liên tục.'],
  },
  'TIỂU HUNG': {
    dos: ['Rà soát rủi ro và chuẩn bị phương án dự phòng.'],
    donts: ['Tránh mở rộng cam kết mới khi thông tin chưa đầy đủ.'],
  },
  'ĐẠI HUNG': {
    dos: ['Ưu tiên bảo toàn sức khỏe, tài chính và các mối quan hệ nền tảng.'],
    donts: ['Tránh đầu tư lớn, tranh chấp hoặc thay đổi lớn trong giai đoạn này.'],
  },
}

const TRIGRAM_DIRECTION: Record<string, string> = {
  Càn: 'Tây Bắc',
  Đoài: 'Tây',
  Ly: 'Nam',
  Chấn: 'Đông',
  Tốn: 'Đông Nam',
  Khảm: 'Bắc',
  Cấn: 'Đông Bắc',
  Khôn: 'Tây Nam',
}

const TRIGRAM_PEOPLE: Record<string, string> = {
  Càn: 'người đứng đầu, bậc trưởng thượng hoặc đối tác lớn tuổi',
  Đoài: 'người bạn trẻ, đồng nghiệp giao tiếp khéo léo',
  Ly: 'người có sức lan tỏa, đối tác truyền thông hoặc trung nữ',
  Chấn: 'người tiên phong, đồng nghiệp năng động hoặc trưởng nam',
  Tốn: 'người trưởng nữ, đối tác mềm mỏng nhưng kiên định',
  Khảm: 'người trầm tĩnh, cẩn trọng hoặc cố vấn chuyên môn',
  Cấn: 'người lớn tuổi, chín chắn hoặc người nắm giữ nguồn lực',
  Khôn: 'người mẹ, đồng nghiệp nữ hoặc người hỗ trợ hậu cần',
}

const RELATION_SUMMARY: Record<string, string> = {
  SINH_NHAP: 'Ngoại cảnh và thời thế đang bồi đắp nhiều điều kiện thuận lợi cho bạn.',
  SINH_XUAT: 'Bạn đang dồn nhiều tâm lực cho sự việc, cần chú ý phân bổ năng lượng hợp lý.',
  KHAC_XUAT: 'Bạn đang nắm thế chủ động điều phối, chỉ cần kiên nhẫn và tránh nóng vội.',
  KHAC_NHAP: 'Ngoại cảnh đang tạo một số áp lực thử thách, nên ưu tiên bình tĩnh và phòng ngừa.',
  TY_HOA: 'Chủ thể và hoàn cảnh xung quanh đang đồng hành rất hài hòa, nhịp nhàng.',
}

const PHILOSOPHY_NOTE =
  'Kinh Dịch không ấn định số mệnh trọn đời. Quẻ chỉ phản ánh xu thế hiện tại; khi bạn thấu hiểu thời thế và chủ động điều chỉnh hành vi, cục diện sẽ chuyển hóa theo hướng tích cực hơn.'

const MAX_ITEMS = 4
const MAX_ITEM_LENGTH = 120

const PREVENTION_KEYWORDS = [
  'không nên',
  'không được',
  'tránh',
  'hạn chế',
  'đừng',
  'chớ',
  'kiêng',
  'đề phòng',
  'cảnh giác',
  'không',
]

interface SafetyGuardrail {
  item: string
  requiredPatterns: RegExp[]
}

/**
 * Cổng an toàn nội dung: các chủ đề HEALTH/FINANCE luôn phải còn đủ các
 * khuyến nghị chuyên môn cốt lõi trong cột Nên Làm, kể cả khi lời khuyên
 * chuyên đề chiếm trọn số lượng mục cho phép.
 */
const SAFETY_GUARDRAILS: Partial<Record<Topic, SafetyGuardrail>> = {
  HEALTH: {
    item: 'Duy trì khám sức khỏe định kỳ và tham vấn bác sĩ trước khi thay đổi phác đồ hoặc dùng thuốc.',
    requiredPatterns: [/khám sức khỏe|khám bệnh/i, /bác sĩ|chuyên gia y tế|cơ sở y tế/i],
  },
  FINANCE: {
    item: 'Tham vấn chuyên gia tài chính trước quyết định lớn và giữ quỹ dự phòng tối thiểu.',
    requiredPatterns: [/chuyên gia tài chính|tư vấn tài chính/i, /quỹ dự phòng|dự phòng tài chính/i],
  },
}

function mergeUnique(primary: string[], ...rest: string[][]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const item of [...primary, ...rest.flat()]) {
    const key = item.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(item)
    if (merged.length >= MAX_ITEMS) break
  }
  return merged
}

export interface ExpertGuidance {
  expertDos: string[]
  expertDonts: string[]
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function stripLeadingConnectors(value: string): string {
  let result = value
  let previous = ''
  while (result !== previous) {
    previous = result
    result = result.replace(
      /^(?:nhưng|song|tuy nhiên|và|đồng thời|do đó|vì vậy|bởi vậy|cho nên|hơn nữa|ngoài ra|để)\s+/i,
      '',
    )
  }
  return result
}

function stripTrailingConnectors(value: string): string {
  let result = value
  let previous = ''
  while (result !== previous) {
    previous = result
    result = result.replace(/\s+(?:nhưng|và|đồng thời|để|nên|cần)$/i, '')
  }
  return result
}

function clipGuidanceItem(value: string, maxLength = MAX_ITEM_LENGTH): string {
  if (value.length <= maxLength) return value
  const slice = value.slice(0, maxLength - 1)
  const boundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('; '),
    slice.lastIndexOf(', '),
    slice.lastIndexOf(' '),
  )
  const cut = boundary >= 40 ? slice.slice(0, boundary) : slice
  return `${cut.trimEnd().replace(/[,;:.\s]+$/, '')}…`
}

function finalizeGuidanceItem(raw: string): string {
  let text = normalizeWhitespace(raw.replace(/\*\*|__/g, ''))
  text = stripLeadingConnectors(text)
  text = stripTrailingConnectors(text)
  text = text.replace(/^[,;:.!?\-–—\s]+/, '').replace(/[,;:.!?\-–—\s]+$/, '')
  if (!text) return ''

  text = capitalizeFirst(text)
  const hasEndingPunctuation = /[.!?…]$/.test(text)
  const maxContentLength = hasEndingPunctuation ? MAX_ITEM_LENGTH : MAX_ITEM_LENGTH - 1
  if (text.length > maxContentLength) {
    text = clipGuidanceItem(text, maxContentLength)
  }
  return /[.!?…]$/.test(text) ? text : `${text}.`
}

function pushGuidanceItem(target: string[], seen: Set<string>, raw: string): void {
  const item = finalizeGuidanceItem(raw)
  if (!item) return
  const key = item.toLowerCase().replace(/[.!?…]+$/, '').trim()
  if (!key || seen.has(key)) return
  seen.add(key)
  target.push(item)
}

function splitGuidanceClauses(guidance: string): string[] {
  return guidance
    .replace(/\r\n?/g, '\n')
    .replace(/([.!?])\s+/g, '$1\n')
    .split(/[\n;]+|,\s+/)
    .map((clause) => clause.replace(/^\s*(?:[-–—•*+]|\d+[.)])\s*/, '').trim())
    .filter((clause) => clause.length > 2)
}

function findPreventionIndex(value: string): { index: number; keyword: string } | null {
  const lower = value.toLowerCase()
  let best: { index: number; keyword: string } | null = null
  for (const keyword of PREVENTION_KEYWORDS) {
    const index = lower.indexOf(keyword)
    if (index < 0) continue
    // "không" đứng giữa câu thường là điều kiện ("nếu không có..."), không phải
    // mệnh đề phòng ngừa; chỉ nhận khi nó mở đầu mệnh đề.
    if (keyword === 'không' && index !== 0) continue
    if (!best || index < best.index || (index === best.index && keyword.length > best.keyword.length)) {
      best = { index, keyword }
    }
  }
  return best
}

/**
 * Tách trường guidance của chuyên gia thành hai vế Nên Làm / Nên Tránh.
 * Quy tắc tất định: mệnh đề chứa từ khóa phòng ngừa được đưa vào Nên Tránh;
 * phần khẳng định phía trước (nếu đủ dài) được giữ lại cho Nên Làm.
 */
function parseGuidance(guidance: string): GuidanceSet {
  const dos: string[] = []
  const donts: string[] = []
  const seenDos = new Set<string>()
  const seenDonts = new Set<string>()

  for (const clause of splitGuidanceClauses(guidance)) {
    const prevention = findPreventionIndex(clause)
    if (!prevention) {
      pushGuidanceItem(dos, seenDos, clause)
      continue
    }

    const positivePart = clause.slice(0, prevention.index)
    const preventionPart = clause.slice(prevention.index)
    if (normalizeWhitespace(positivePart).length >= 8) {
      pushGuidanceItem(dos, seenDos, positivePart)
    }
    pushGuidanceItem(donts, seenDonts, preventionPart)
  }

  return { dos, donts }
}

function isApprovedInterpretation(item: InterpretationItem): boolean {
  return (
    item.review_status === 'APPROVED' &&
    typeof item.guidance === 'string' &&
    item.guidance.trim().length > 0
  )
}

function normalizeTopic(value: string | null | undefined): string {
  return String(value || '').trim().toUpperCase()
}

function targetTypeOf(item: InterpretationItem): string {
  return item.target_type ?? 'HEXAGRAM'
}

/**
 * Chọn diễn giải đã duyệt phù hợp nhất theo thứ tự ưu tiên:
 * 1. Hào động đúng chủ đề
 * 2. Toàn quẻ đúng chủ đề
 * 3. Hào động chủ đề GENERAL
 * 4. Toàn quẻ chủ đề GENERAL
 */
export function getBestInterpretation(
  interpretations: InterpretationItem[] | undefined,
  topic: Topic,
  movingLine: number,
): InterpretationItem | null {
  const candidates = (interpretations ?? []).filter(isApprovedInterpretation)
  if (candidates.length === 0) return null

  const currentTopic = normalizeTopic(topic)
  const predicates: Array<(item: InterpretationItem) => boolean> = [
    (item) =>
      targetTypeOf(item) === 'LINE' &&
      item.line_position === movingLine &&
      normalizeTopic(item.topic) === currentTopic,
    (item) => targetTypeOf(item) === 'HEXAGRAM' && normalizeTopic(item.topic) === currentTopic,
    (item) =>
      targetTypeOf(item) === 'LINE' &&
      item.line_position === movingLine &&
      normalizeTopic(item.topic) === 'GENERAL',
    (item) => targetTypeOf(item) === 'HEXAGRAM' && normalizeTopic(item.topic) === 'GENERAL',
  ]

  for (const predicate of predicates) {
    const found = candidates.find(predicate)
    if (found) return found
  }
  return null
}

/**
 * Trích xuất lời khuyên hành động thực tiễn từ diễn giải chuyên đề đã duyệt.
 * Văn bản được giữ thuần chất lượng cao (không gắn tiền tố quẻ vào từng mục)
 * để tránh làm nặng giao diện và vượt giới hạn độ dài hiển thị.
 */
export function extractExpertGuidance(
  interpretations: InterpretationItem[] | undefined,
  topic: Topic,
  movingLine: number,
): ExpertGuidance {
  const best = getBestInterpretation(interpretations, topic, movingLine)
  if (!best) return { expertDos: [], expertDonts: [] }

  const parsed = parseGuidance(best.guidance)
  return {
    expertDos: parsed.dos.slice(0, MAX_ITEMS),
    expertDonts: parsed.donts.slice(0, MAX_ITEMS),
  }
}

function withSafetyGuardrail(items: string[], topic: Topic): string[] {
  const guardrail = SAFETY_GUARDRAILS[topic]
  if (!guardrail) return items
  const hasAllSafetyAdvice = guardrail.requiredPatterns.every((pattern) =>
    items.some((item) => pattern.test(item)),
  )
  if (hasAllSafetyAdvice) return items
  if (items.length < MAX_ITEMS) return [...items, guardrail.item]
  return [...items.slice(0, MAX_ITEMS - 1), guardrail.item]
}

/**
 * Sinh Bản định hướng hành động từ kết quả gieo quẻ đã có.
 * Dựa trên quẻ bói đã bói ra và chủ đề cụ thể để đưa ra lời khuyên tự nhiên, dễ nghe,
 * không cứng nhắc như in sách vở hay từ điển có sẵn.
 */
export function buildDecisionBrief(data: DivinationResponse, topic: Topic): DecisionBrief {
  const polarityLabel = String(data.synthesis.polarity_label || 'BÌNH HÒA')
  const mainRelation = data.five_element_analysis.find((item) => item.pair === 'THE_DUNG_MAIN')
  const relationType = mainRelation?.relation_type || 'TY_HOA'
  const relationGuidance = RELATION_GUIDANCE[relationType] || RELATION_GUIDANCE.TY_HOA
  const topicGuidance = TOPIC_GUIDANCE[topic] || TOPIC_GUIDANCE.GENERAL
  const polarityGuidance = POLARITY_GUIDANCE[polarityLabel] || POLARITY_GUIDANCE['BÌNH HÒA']

  const initialName = data.initial_hexagram?.name_vn || 'Quẻ Chủ'
  const transformedName = data.transformed_hexagram?.name_vn || 'Quẻ Biến'
  const trend = TREND_BY_LABEL[polarityLabel] || TREND_BY_LABEL['BÌNH HÒA']
  const relationSummary = RELATION_SUMMARY[relationType] || ''

  const generalTrend = [
    `Cục diện thời thế: ${polarityLabel}. ${trend}`,
    `Quẻ ${initialName} đang chuyển biến sang ${transformedName} qua bước ngoặt ở hào động ${data.moving_line}. ${relationSummary}`.trim(),
  ].join(' ')

  const theTrigram =
    data.dung_side === 'UPPER' ? data.initial_hexagram.lower_trigram : data.initial_hexagram.upper_trigram
  const dungTrigram =
    data.dung_side === 'UPPER' ? data.initial_hexagram.upper_trigram : data.initial_hexagram.lower_trigram

  const timeHorizon = data.synthesis.score >= 0.4 ? '3 – 6 tháng' : '6 – 12 tháng'
  const expertGuidance = extractExpertGuidance(data.interpretations, topic, data.moving_line)

  const dos = mergeUnique(
    expertGuidance.expertDos,
    relationGuidance.dos,
    topicGuidance.dos,
    polarityGuidance.dos,
  )
  const donts = mergeUnique(
    expertGuidance.expertDonts,
    relationGuidance.donts,
    topicGuidance.donts,
    polarityGuidance.donts,
  )

  return {
    polarityLabel,
    generalTrend,
    dos: withSafetyGuardrail(dos, topic),
    donts,
    keyPeople: TRIGRAM_PEOPLE[dungTrigram?.name_vn] || 'người đồng hành đáng tin cậy, có kinh nghiệm thực tế',
    favorableDirection: TRIGRAM_DIRECTION[theTrigram?.name_vn] || 'hướng thuận theo không gian quen thuộc',
    timeHorizon: `Ứng nghiệm cho diễn biến trong vòng ${timeHorizon} tới.`,
    philosophyNote: PHILOSOPHY_NOTE,
  }
}

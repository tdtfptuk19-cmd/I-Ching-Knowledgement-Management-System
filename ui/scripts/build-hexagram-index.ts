import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface TrigramEntry {
  id: number
  name_vn: string
  name_han: string
  binary_code: string
  five_element: string
  nature_symbol: string
  family_member: string
  early_heaven_num: number
  later_heaven_num: number
}

interface HexagramIndexEntry {
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

function parseKinhDichSql(): HexagramIndexEntry[] {
  const sqlPath = path.resolve(__dirname, '../../db/kinhdich_64_que.sql')
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`File không tồn tại: ${sqlPath}`)
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

  // 1. Parse Trigrams
  // (1, N'Càn', N'乾', '111', 'KIM', N'Trời', N'Cha', 1, 6, N'Tây Bắc')
  const trigramsByCode: Record<string, TrigramEntry> = {}
  const trigramRegex = /\((\d+),\s*N'([^']+)',\s*N'([^']+)',\s*'([01]{3})',\s*'([^']+)',\s*N'([^']+)',\s*N'([^']+)',\s*(\d+),\s*(\d+)/g
  let tMatch: RegExpExecArray | null

  while ((tMatch = trigramRegex.exec(sqlContent)) !== null) {
    const entry: TrigramEntry = {
      id: parseInt(tMatch[1], 10),
      name_vn: tMatch[2],
      name_han: tMatch[3],
      binary_code: tMatch[4],
      five_element: tMatch[5],
      nature_symbol: tMatch[6],
      family_member: tMatch[7],
      early_heaven_num: parseInt(tMatch[8], 10),
      later_heaven_num: parseInt(tMatch[9], 10),
    }
    trigramsByCode[entry.binary_code] = entry
  }

  if (Object.keys(trigramsByCode).length !== 8) {
    throw new Error(`Kỳ vọng 8 bát quái, tìm thấy: ${Object.keys(trigramsByCode).length}`)
  }

  // 2. Parse 64 Hexagrams
  // (1, '111111', N'Thuần Càn', N'乾為天'),
  const hexagrams: HexagramIndexEntry[] = []
  const hexagramRegex = /\((\d+),\s*'([01]{6})',\s*N'([^']+)',\s*N'([^']+)'\)/g
  let hMatch: RegExpExecArray | null

  while ((hMatch = hexagramRegex.exec(sqlContent)) !== null) {
    const id = parseInt(hMatch[1], 10)
    const binary = hMatch[2]
    const nameVn = hMatch[3]
    const nameHan = hMatch[4]

    const upperCode = binary.slice(0, 3)
    const lowerCode = binary.slice(3, 6)

    const upperTri = trigramsByCode[upperCode]
    const lowerTri = trigramsByCode[lowerCode]

    if (!upperTri || !lowerTri) {
      throw new Error(`Quẻ ${id} (${binary}) không tìm thấy quái tương ứng (${upperCode}, ${lowerCode})`)
    }

    hexagrams.push({
      hexagram_id: id,
      binary_code: binary,
      name_vn: nameVn,
      name_han: nameHan,
      upper_code: upperCode,
      lower_code: lowerCode,
      upper_trigram: {
        id: upperTri.id,
        name_vn: upperTri.name_vn,
        name_han: upperTri.name_han,
        binary_code: upperTri.binary_code,
        five_element: upperTri.five_element,
        nature_symbol: upperTri.nature_symbol,
      },
      lower_trigram: {
        id: lowerTri.id,
        name_vn: lowerTri.name_vn,
        name_han: lowerTri.name_han,
        binary_code: lowerTri.binary_code,
        five_element: lowerTri.five_element,
        nature_symbol: lowerTri.nature_symbol,
      },
    })
  }

  // Sắp xếp theo hexagram_id
  hexagrams.sort((a, b) => a.hexagram_id - b.hexagram_id)

  // Kiểm tra tính toàn vẹn
  if (hexagrams.length !== 64) {
    throw new Error(`Kỳ vọng đủ 64 quẻ, nhưng chỉ parse được: ${hexagrams.length}`)
  }

  const idSet = new Set<number>()
  const binarySet = new Set<string>()

  for (let i = 0; i < 64; i++) {
    const h = hexagrams[i]
    if (h.hexagram_id !== i + 1) {
      throw new Error(`ID không liên tục tại vị trí ${i}: tìm thấy ${h.hexagram_id}, kỳ vọng ${i + 1}`)
    }
    idSet.add(h.hexagram_id)
    binarySet.add(h.binary_code)
  }

  if (idSet.size !== 64) {
    throw new Error(`Có trùng lặp ID: ${idSet.size}/64`)
  }
  if (binarySet.size !== 64) {
    throw new Error(`Có trùng lặp binary_code: ${binarySet.size}/64`)
  }

  return hexagrams
}

function main() {
  console.log('[build-hexagram-index] Đang đọc và phân tích db/kinhdich_64_que.sql...')
  const hexagrams = parseKinhDichSql()
  console.log(`[build-hexagram-index] Đã xác thực thành công ${hexagrams.length} quẻ kép.`)

  const outDir = path.resolve(__dirname, '../src/data')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const outPath = path.join(outDir, 'hexagram-index.json')
  fs.writeFileSync(outPath, JSON.stringify(hexagrams, null, 2), 'utf-8')
  console.log(`[build-hexagram-index] Đã xuất thành công: ${outPath}`)
}

main()

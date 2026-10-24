import React, { useState, useMemo } from 'react'
import hexagramIndex from '@/data/hexagram-index.json'
import { HexagramCard, HexagramSummary } from './HexagramCard'
import { LayoutGrid, Grid3X3, Search, Filter } from 'lucide-react'

// Thứ tự Bát quái Tiên thiên chuẩn xác: 1 Càn, 2 Đoài, 3 Ly, 4 Chấn, 5 Tốn, 6 Khảm, 7 Cấn, 8 Khôn
const ORDERED_TRIGRAMS = [
  { id: 1, name_vn: 'Càn', name_han: '乾', binary_code: '111', element: 'KIM', nature: 'Trời' },
  { id: 2, name_vn: 'Đoài', name_han: '兌', binary_code: '011', element: 'KIM', nature: 'Đầm' },
  { id: 3, name_vn: 'Ly', name_han: '離', binary_code: '101', element: 'HOA', nature: 'Lửa' },
  { id: 4, name_vn: 'Chấn', name_han: '震', binary_code: '001', element: 'MOC', nature: 'Sấm' },
  { id: 5, name_vn: 'Tốn', name_han: '巽', binary_code: '110', element: 'MOC', nature: 'Gió' },
  { id: 6, name_vn: 'Khảm', name_han: '坎', binary_code: '010', element: 'THUY', nature: 'Nước' },
  { id: 7, name_vn: 'Cấn', name_han: '艮', binary_code: '100', element: 'THO', nature: 'Núi' },
  { id: 8, name_vn: 'Khôn', name_han: '坤', binary_code: '000', element: 'THO', nature: 'Đất' },
]

export const HexagramGrid: React.FC = () => {
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedElement, setSelectedElement] = useState<string>('ALL')

  const hexagrams = hexagramIndex as HexagramSummary[]

  // Tạo map tra cứu nhanh theo (upper_code, lower_code)
  const matrixMap = useMemo(() => {
    const map = new Map<string, HexagramSummary>()
    hexagrams.forEach(h => {
      map.set(`${h.upper_code}-${h.lower_code}`, h)
    })
    return map
  }, [hexagrams])

  // Lọc danh sách theo từ khóa và ngũ hành
  const filteredHexagrams = useMemo(() => {
    return hexagrams.filter(h => {
      const matchSearch =
        searchTerm === '' ||
        h.name_vn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.name_han.includes(searchTerm) ||
        h.hexagram_id.toString() === searchTerm.trim() ||
        h.binary_code.includes(searchTerm.trim())

      const matchElement =
        selectedElement === 'ALL' ||
        h.upper_trigram.five_element === selectedElement ||
        h.lower_trigram.five_element === selectedElement

      return matchSearch && matchElement
    })
  }, [hexagrams, searchTerm, selectedElement])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Thanh công cụ */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-amber-700" />
              <span>Lưới Tra Cứu 64 Quẻ Kinh Dịch (Bát Quái Toàn Thư)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Phân loại theo Bát quái Tiên thiên và Cấu trúc Nhị phân 6 hào. Chuyển đổi giữa ma trận tọa độ 8×8 và danh sách trực quan.
            </p>
          </div>

          {/* Nút chuyển đổi View Mode */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'matrix'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Ma Trận 8×8</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'cards'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Danh Sách 64 Quẻ</span>
            </button>
          </div>
        </div>

        {/* Bộ lọc & Tìm kiếm nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              id="hexagram-search-input"
              aria-label="Lọc nhanh theo tên quẻ, chữ Hán, số ID hoặc mã nhị phân"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Lọc nhanh theo tên quẻ, chữ Hán, số ID (1..64) hoặc mã nhị phân..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <select
              id="hexagram-element-filter"
              aria-label="Lọc theo Ngũ Hành"
              value={selectedElement}
              onChange={e => setSelectedElement(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">Tất cả Ngũ Hành</option>
              <option value="KIM">Hành KIM</option>
              <option value="MOC">Hành MỘC</option>
              <option value="THUY">Hành THỦY</option>
              <option value="HOA">Hành HỎA</option>
              <option value="THO">Hành THỔ</option>
            </select>
          </div>
        </div>
      </div>

      {/* CHẾ ĐỘ 1: MA TRẬN 8x8 */}
      {viewMode === 'matrix' && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 border-b border-stone-100 pb-2">
            <span className="font-semibold">
              Tọa độ: <span className="text-amber-800 font-bold">Trục Dọc (Hàng) = Quái Thượng</span> ×{' '}
              <span className="text-amber-800 font-bold">Trục Ngang (Cột) = Quái Hạ</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-300 font-medium xl:hidden">
                ↔ Cuộn ngang để xem đủ 8 cột Bát Quái
              </span>
              <span className="text-xs text-stone-700 font-mono font-medium">Tổng: 64 Quẻ Kép</span>
            </div>
          </div>

          <div className="overflow-x-auto relative rounded-lg border border-stone-200 scrollbar-thin">
            <table className="w-full min-w-[920px] table-fixed border-collapse text-left" aria-label="Ma trận 64 quẻ theo Bát quái Tiên thiên">
              <thead className="sticky top-0 z-20 bg-stone-100 shadow-sm">
                <tr>
                  {/* Góc giao trục: cố định cả ngang và dọc */}
                  <th scope="col" className="p-2 border-b-2 border-r-2 border-stone-300 bg-stone-100 text-center text-xs font-bold text-stone-800 w-20 sm:w-24 sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.06)]">
                    Thượng \ Hạ
                  </th>
                  {ORDERED_TRIGRAMS.map(tri => (
                    <th
                      key={tri.id}
                      scope="col"
                      className="p-2 border-b-2 border-stone-300 border-r border-stone-200 bg-stone-100 text-center text-xs font-serif font-bold text-stone-800 w-[11.8%]"
                    >
                      <div>{tri.name_vn}</div>
                      <div className="text-xs font-mono text-stone-700 font-normal">
                        <span lang="zh-Hant" className="font-serif font-bold">{tri.name_han}</span> · {tri.element}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {ORDERED_TRIGRAMS.map(upperTri => (
                  <tr key={upperTri.id}>
                    {/* Tiêu đề hàng: Quái Thượng (sticky cố định mép trái khi cuộn ngang) */}
                    <th scope="row" className="p-2 border-r-2 border-stone-300 bg-stone-50 text-center font-serif text-xs font-bold text-stone-800 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.06)]">
                      <div>{upperTri.name_vn}</div>
                      <div className="text-xs font-mono text-stone-700 font-normal">
                        <span lang="zh-Hant" className="font-serif font-bold">{upperTri.name_han}</span> · {upperTri.element}
                      </div>
                    </th>

                    {/* 8 Quái Hạ */}
                    {ORDERED_TRIGRAMS.map(lowerTri => {
                      const hex = matrixMap.get(`${upperTri.binary_code}-${lowerTri.binary_code}`)
                      if (!hex) {
                        return (
                          <td key={lowerTri.id} className="p-2 border-r border-stone-200 bg-stone-50/50 text-center text-xs text-stone-400">
                            -
                          </td>
                        )
                      }

                      // Kiểm tra xem quẻ có khớp bộ lọc hiện tại không
                      const isHighlighted =
                        searchTerm === '' && selectedElement === 'ALL'
                          ? true
                          : filteredHexagrams.some(h => h.hexagram_id === hex.hexagram_id)

                      return (
                        <td
                          key={lowerTri.id}
                          className={`p-1.5 border-r border-stone-200 transition ${
                            isHighlighted ? 'bg-white hover:bg-amber-50/50' : 'bg-stone-50/40 opacity-40'
                          }`}
                        >
                          <HexagramCard hexagram={hex} compact />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: DANH SÁCH 64 QUẺ DẠNG CARD */}
      {viewMode === 'cards' && (
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-3 px-1">
            <span>Hiển thị {filteredHexagrams.length} / 64 quẻ</span>
            {searchTerm && <span>Từ khóa: "{searchTerm}"</span>}
          </div>

          {filteredHexagrams.length === 0 ? (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-2">
              <p className="text-stone-600 font-medium">Không tìm thấy quẻ nào phù hợp với bộ lọc hiện tại.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedElement('ALL')
                }}
                className="text-xs text-amber-700 font-bold hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredHexagrams.map(hex => (
                <HexagramCard key={hex.hexagram_id} hexagram={hex} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

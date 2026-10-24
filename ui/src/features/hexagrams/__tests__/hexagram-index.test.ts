import { describe, it, expect } from 'vitest'
import hexagramIndex from '@/data/hexagram-index.json'

describe('Kiểm tra Tính Toàn Vẹn & Đối Soát hexagram-index.json', () => {
  it('Xác nhận đủ 64 mục quẻ kép', () => {
    expect(hexagramIndex).toHaveLength(64)
  })

  it('Xác nhận id từ 1..64 liên tục, không trùng lặp và không có khoảng trống', () => {
    const ids = hexagramIndex.map(h => h.hexagram_id)
    const idSet = new Set(ids)

    expect(idSet.size).toBe(64)
    for (let i = 1; i <= 64; i++) {
      expect(idSet.has(i)).toBe(true)
    }
  })

  it('Xác nhận 64 binary_code duy nhất, đúng định dạng nhị phân 6 ký tự 0/1', () => {
    const codes = hexagramIndex.map(h => h.binary_code)
    const codeSet = new Set(codes)

    expect(codeSet.size).toBe(64)
    codes.forEach(code => {
      expect(code).toMatch(/^[01]{6}$/)
    })
  })

  it('Xác nhận cấu trúc phân rã Quái Thượng (3 bit đầu) và Quái Hạ (3 bit cuối)', () => {
    hexagramIndex.forEach(h => {
      expect(h.upper_code).toBe(h.binary_code.slice(0, 3))
      expect(h.lower_code).toBe(h.binary_code.slice(3, 6))
      expect(h.upper_trigram.binary_code).toBe(h.upper_code)
      expect(h.lower_trigram.binary_code).toBe(h.lower_code)

      expect(h.upper_trigram.id).toBeGreaterThanOrEqual(1)
      expect(h.upper_trigram.id).toBeLessThanOrEqual(8)
      expect(h.lower_trigram.id).toBeGreaterThanOrEqual(1)
      expect(h.lower_trigram.id).toBeLessThanOrEqual(8)

      expect(['KIM', 'MOC', 'THUY', 'HOA', 'THO']).toContain(h.upper_trigram.five_element)
      expect(['KIM', 'MOC', 'THUY', 'HOA', 'THO']).toContain(h.lower_trigram.five_element)
    })
  })

  it('Đối chiếu 5 quẻ mẫu kiểm chuẩn với dữ liệu CSDL', () => {
    // Quẻ 1: Thuần Càn
    const h1 = hexagramIndex.find(h => h.hexagram_id === 1)!
    expect(h1.name_vn).toBe('Thuần Càn')
    expect(h1.name_han).toBe('乾為天')
    expect(h1.binary_code).toBe('111111')
    expect(h1.upper_trigram.name_vn).toBe('Càn')
    expect(h1.lower_trigram.name_vn).toBe('Càn')

    // Quẻ 14: Hỏa Thiên Đại Hữu
    const h14 = hexagramIndex.find(h => h.hexagram_id === 14)!
    expect(h14.name_vn).toBe('Hỏa Thiên Đại Hữu')
    expect(h14.name_han).toBe('火天大有')
    expect(h14.binary_code).toBe('101111')
    expect(h14.upper_trigram.name_vn).toBe('Ly')
    expect(h14.lower_trigram.name_vn).toBe('Càn')

    // Quẻ 23: Sơn Địa Bác
    const h23 = hexagramIndex.find(h => h.hexagram_id === 23)!
    expect(h23.name_vn).toBe('Sơn Địa Bác')
    expect(h23.name_han).toBe('山地剝')
    expect(h23.binary_code).toBe('100000')
    expect(h23.upper_trigram.name_vn).toBe('Cấn')
    expect(h23.lower_trigram.name_vn).toBe('Khôn')

    // Quẻ 40: Lôi Thủy Giải
    const h40 = hexagramIndex.find(h => h.hexagram_id === 40)!
    expect(h40.name_vn).toBe('Lôi Thủy Giải')
    expect(h40.name_han).toBe('雷水解')
    expect(h40.binary_code).toBe('001010')
    expect(h40.upper_trigram.name_vn).toBe('Chấn')
    expect(h40.lower_trigram.name_vn).toBe('Khảm')

    // Quẻ 64: Hỏa Thủy Vị Tế
    const h64 = hexagramIndex.find(h => h.hexagram_id === 64)!
    expect(h64.name_vn).toBe('Hỏa Thủy Vị Tế')
    expect(h64.name_han).toBe('火水未濟')
    expect(h64.binary_code).toBe('101010')
    expect(h64.upper_trigram.name_vn).toBe('Ly')
    expect(h64.lower_trigram.name_vn).toBe('Khảm')
  })
})

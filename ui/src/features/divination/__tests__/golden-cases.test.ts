import { describe, it, expect } from 'vitest'
import { postDivination } from '@/api/divination.api'

describe('Test hồi quy render trên dữ liệu thật đã lưu (Fixtures đối soát từ KinhDich_KB_dev)', () => {
  it('Ca 2: Mã Hành Đố Địa (4, 6) — Khớp kỳ vọng test Tầng 2 (chưa đối chiếu sách gốc)', async () => {
    // Lý do: (4 + 6) % 6 = 4, khớp kỳ vọng test Tầng 2 qua phương thức MAI_HOA_NUMBER
    const res = await postDivination({
      casting_method: 'MAI_HOA_NUMBER',
      topic: 'GENERAL',
      number_upper: 4,
      number_lower: 6,
      user_level: 'EXPERT',
    })

    expect(res.initial_hexagram.hexagram_id).toBe(40)
    expect(res.initial_hexagram.name_vn).toBe('Lôi Thủy Giải')
    expect(res.transformed_hexagram.hexagram_id).toBe(7)
    expect(res.transformed_hexagram.name_vn).toBe('Địa Thủy Sư')
    expect(res.moving_line).toBe(4) // Khớp kỳ vọng test Tầng 2
    expect(res.dung_side).toBe('UPPER')
    expect(res.the_element).toBe('THUY')
    expect(res.dung_element).toBe('MOC')
    // Điểm số thật từ KinhDich_KB_dev:
    expect(res.synthesis.score).toBe(-1.0)
    expect(res.synthesis.polarity_label).toBe('TIỂU HUNG')
  })

  it('Ca 3: Tây Lâm Tự Ngạch (7, 8) — Khớp kỳ vọng test Tầng 2 (chưa đối chiếu sách gốc)', async () => {
    // Lý do: (7 + 8) % 6 = 15 % 6 = 3, khớp kỳ vọng test Tầng 2 qua phương thức MAI_HOA_NUMBER
    const res = await postDivination({
      casting_method: 'MAI_HOA_NUMBER',
      topic: 'GENERAL',
      number_upper: 7,
      number_lower: 8,
      user_level: 'EXPERT',
    })

    expect(res.initial_hexagram.hexagram_id).toBe(23)
    expect(res.initial_hexagram.name_vn).toBe('Sơn Địa Bác')
    expect(res.transformed_hexagram.hexagram_id).toBe(52)
    expect(res.transformed_hexagram.name_vn).toBe('Thuần Cấn')
    expect(res.moving_line).toBe(3) // Khớp kỳ vọng test Tầng 2
    expect(res.dung_side).toBe('LOWER')
    expect(res.the_element).toBe('THO')
    expect(res.dung_element).toBe('THO')
    // Điểm số thật từ KinhDich_KB_dev:
    expect(res.synthesis.score).toBe(1.0)
    expect(res.synthesis.polarity_label).toBe('TIỂU CÁT')
  })

  it('Thử số (2, 3): Kiểm tra hành vi thật của API (hào động tự sinh từ tổng hai số)', async () => {
    // Giải thích: Với (2, 3), API tính (2 + 3) % 6 = 5, biến Lôi Hỏa Phong (55).
    // Không thể tái hiện hào 1 của ca Quán Mai vì API không nhận tham số moving_line chỉ định.
    const res = await postDivination({
      casting_method: 'MAI_HOA_NUMBER',
      topic: 'GENERAL',
      number_upper: 2,
      number_lower: 3,
      user_level: 'EXPERT',
    })

    expect(res.initial_hexagram.hexagram_id).toBe(49)
    expect(res.initial_hexagram.name_vn).toBe('Trạch Hỏa Cách')
    expect(res.transformed_hexagram.hexagram_id).toBe(55)
    expect(res.transformed_hexagram.name_vn).toBe('Lôi Hỏa Phong')
    expect(res.moving_line).toBe(5) // (2 + 3) % 6 = 5
    expect(res.the_element).toBe('HOA')
    expect(res.dung_element).toBe('KIM')
    // Điểm số thật từ KinhDich_KB_dev:
    expect(res.synthesis.score).toBe(0.8)
    expect(res.synthesis.polarity_label).toBe('TIỂU CÁT')
  })

  it('Thử số (1, 5): Kiểm tra hành vi thật của API (hào động tự sinh = 6)', async () => {
    // Giải thích: Với (1, 5), API tính (1 + 5) % 6 = 0 -> hào 6, biến Trạch Phong Đại Quá (28).
    // Không thể tái hiện hào 5 Mẫu Đơn hay hào 1 Khách Lai vì API tính theo tổng hai số.
    const res = await postDivination({
      casting_method: 'MAI_HOA_NUMBER',
      topic: 'GENERAL',
      number_upper: 1,
      number_lower: 5,
      user_level: 'EXPERT',
    })

    expect(res.initial_hexagram.hexagram_id).toBe(44)
    expect(res.initial_hexagram.name_vn).toBe('Thiên Phong Cấu')
    expect(res.transformed_hexagram.hexagram_id).toBe(28)
    expect(res.transformed_hexagram.name_vn).toBe('Trạch Phong Đại Quá')
    expect(res.moving_line).toBe(6) // (1 + 5) % 6 = 6
    expect(res.the_element).toBe('MOC')
    expect(res.dung_element).toBe('KIM')
    // Điểm số thật từ KinhDich_KB_dev:
    expect(res.synthesis.score).toBe(-2.0)
    expect(res.synthesis.polarity_label).toBe('ĐẠI HUNG')
  })
})

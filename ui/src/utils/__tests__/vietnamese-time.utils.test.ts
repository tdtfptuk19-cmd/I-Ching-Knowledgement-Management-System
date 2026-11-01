import { describe, expect, it } from 'vitest'
import {
  formatVnClock,
  formatVnDate,
  formatVnWeekdayDate,
  getCanhGio,
  getVietnamTimeParts,
} from '../vietnamese-time.utils'

describe('vietnamese-time.utils', () => {
  it('quy đổi đúng giờ Việt Nam bất kể múi giờ thiết bị', () => {
    // 16:30 UTC = 23:30 giờ Việt Nam
    const parts = getVietnamTimeParts(new Date('2026-11-01T16:30:00Z'))
    expect(parts).toMatchObject({
      year: 2026,
      month: 11,
      day: 1,
      hours: 23,
      minutes: 30,
      seconds: 0,
    })
    expect(formatVnClock(new Date('2026-11-01T16:30:00Z'))).toBe('23:30:00')
    expect(formatVnDate(new Date('2026-11-01T16:30:00Z'))).toBe('01/11/2026')
  })

  it('23:00 – 00:59 thuộc giờ Tý', () => {
    const ty = getCanhGio(new Date('2026-11-01T16:30:00Z')) // 23:30 VN
    expect(ty.index).toBe(1)
    expect(ty.name).toBe('Tý')
    expect(ty.range).toBe('23:00 – 00:59')

    const tySauNuaDem = getCanhGio(new Date('2026-11-01T17:30:00Z')) // 00:30 VN ngày 2
    expect(tySauNuaDem.index).toBe(1)
    expect(tySauNuaDem.name).toBe('Tý')
  })

  it('01:00 bắt đầu giờ Sửu và 12:00 là giờ Ngọ', () => {
    const suu = getCanhGio(new Date('2026-11-01T18:00:00Z')) // 01:00 VN
    expect(suu.index).toBe(2)
    expect(suu.name).toBe('Sửu')
    expect(suu.range).toBe('01:00 – 02:59')

    const ngo = getCanhGio(new Date('2026-11-01T05:00:00Z')) // 12:00 VN
    expect(ngo.index).toBe(7)
    expect(ngo.name).toBe('Ngọ')
    expect(ngo.range).toBe('11:00 – 12:59')
  })

  it('21:00 – 22:59 là giờ Hợi (kết thúc chu kỳ)', () => {
    const hoi = getCanhGio(new Date('2026-11-01T15:00:00Z')) // 22:00 VN
    expect(hoi.index).toBe(12)
    expect(hoi.name).toBe('Hợi')
    expect(hoi.range).toBe('21:00 – 22:59')
  })

  it('định dạng thứ trong tuần bằng tiếng Việt', () => {
    expect(formatVnWeekdayDate(new Date('2026-11-01T04:00:00Z'))).toBe('Chủ Nhật, 01/11/2026')
  })
})

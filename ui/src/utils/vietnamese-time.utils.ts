/**
 * vietnamese-time.utils.ts
 * Tiện ích tính giờ Việt Nam (UTC+7) và Canh giờ Địa Chi cho giao diện lập quẻ.
 * Việt Nam áp dụng múi giờ cố định UTC+7 (không có DST) nên có thể tính
 * trực tiếp từ epoch bằng offset, không phụ thuộc múi giờ thiết bị.
 */

export const EARTH_BRANCHES = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tị',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const

export const VN_OFFSET_MINUTES = 7 * 60

export interface VietnamTimeParts {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
}

export interface CanhGio {
  /** Chỉ số Địa Chi 1..12 (Tý = 1) */
  index: number
  name: string
  /** Khoảng giờ, ví dụ "23:00 – 00:59" */
  range: string
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** Tách các thành phần thời gian theo giờ Việt Nam (UTC+7). */
export function getVietnamTimeParts(date: Date = new Date()): VietnamTimeParts {
  const shifted = new Date(date.getTime() + VN_OFFSET_MINUTES * 60 * 1000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    seconds: shifted.getUTCSeconds(),
  }
}

/**
 * Quy đổi thời điểm sang Canh giờ Địa Chi.
 * 23:00 – 00:59 là giờ Tý (đầu ngày Can Chi kế tiếp theo quy ước NEXT_DAY).
 */
export function getCanhGio(date: Date = new Date()): CanhGio {
  const { hours, minutes } = getVietnamTimeParts(date)
  const totalMinutes = hours * 60 + minutes
  const shifted = (totalMinutes + 60) % 1440
  const index = Math.floor(shifted / 120) + 1

  const startMinutes = (index - 1) * 120 - 60
  const normalizedStart = (startMinutes + 1440) % 1440
  const normalizedEnd = (normalizedStart + 119) % 1440
  const format = (value: number) => `${pad2(Math.floor(value / 60))}:${pad2(value % 60)}`

  return {
    index,
    name: EARTH_BRANCHES[index - 1],
    range: `${format(normalizedStart)} – ${format(normalizedEnd)}`,
  }
}

/** Định dạng HH:mm:ss theo giờ Việt Nam. */
export function formatVnClock(date: Date = new Date()): string {
  const { hours, minutes, seconds } = getVietnamTimeParts(date)
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
}

/** Định dạng DD/MM/YYYY theo giờ Việt Nam. */
export function formatVnDate(date: Date = new Date()): string {
  const { day, month, year } = getVietnamTimeParts(date)
  return `${pad2(day)}/${pad2(month)}/${year}`
}

/** Định dạng "Thứ ...", DD/MM/YYYY theo giờ Việt Nam. */
export function formatVnWeekdayDate(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date)
  const normalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${normalized}, ${formatVnDate(date)}`
}

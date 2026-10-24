/**
 * Định dạng ngày giờ chuẩn mực thống nhất: DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoOrDateString: string | Date): string {
  const d = new Date(isoOrDateString)
  if (isNaN(d.getTime())) return String(isoOrDateString)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Định dạng ngày chuẩn mực: DD/MM/YYYY
 */
export function formatDate(isoOrDateString: string | Date): string {
  const d = new Date(isoOrDateString)
  if (isNaN(d.getTime())) return String(isoOrDateString)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

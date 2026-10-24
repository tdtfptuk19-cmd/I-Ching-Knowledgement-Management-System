/**
 * Cấu hình môi trường và chế độ hoạt động (Environment & API Mode Configuration)
 * 
 * Hỗ trợ 2 chế độ:
 * - 'mock': Khởi động MSW (Mock Service Worker), dữ liệu mô phỏng chạy hoàn toàn trên client (phù hợp demo/đồ án Vercel).
 * - 'real': Kết nối trực tiếp vào FastAPI backend (/api/v1).
 */

export type ApiMode = 'mock' | 'real'

/**
 * Xác định chế độ API của hệ thống:
 * 1. Ưu tiên VITE_API_MODE ('mock' | 'real') nếu được đặt rõ ràng.
 * 2. Tương thích ngược với VITE_MOCK:
 *    - VITE_MOCK === 'false' -> 'real'
 *    - VITE_MOCK === 'true'  -> 'mock'
 * 3. Mặc định là 'mock' để bảo đảm an toàn khi demo.
 */
export function getApiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE?.toLowerCase()
  if (mode === 'real') return 'real'
  if (mode === 'mock') return 'mock'
  if (import.meta.env.VITE_MOCK === 'false') return 'real'
  return 'mock'
}

export function isMockMode(): boolean {
  return getApiMode() === 'mock'
}

export function isRealApiMode(): boolean {
  return getApiMode() === 'real'
}

/**
 * Base URL cho API client:
 * - Nếu VITE_API_BASE_URL được cung cấp, sử dụng giá trị đó.
 * - Nếu ở chế độ 'real' trên local dev: http://127.0.0.1:8000/api/v1
 * - Nếu ở production hoặc chế độ mock: /api/v1 (tránh lộ localhost ra môi trường deploy)
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  (isRealApiMode() && import.meta.env.DEV
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1')

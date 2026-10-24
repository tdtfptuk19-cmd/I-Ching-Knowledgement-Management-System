import { normalizeApiError } from './error-normalizer'
import { validateContract } from './contracts'
import { z } from 'zod'

const DEV_DEFAULT_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '127.0.0.1'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? `http://${DEV_DEFAULT_HOST}:8000/api/v1` : '/api/v1')

export interface RequestOptions<T = unknown> extends RequestInit {
  timeout?: number
  contract?: z.ZodType<T>
}

export async function apiClient<T>(endpoint: string, options: RequestOptions<T> = {}): Promise<T> {
  const { timeout = 10000, headers = {}, contract, ...rest } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Nếu res.status = 204 No Content
    if (res.status === 204) {
      return {} as T
    }

    let data: unknown
    try {
      data = await res.json()
    } catch {
      data = { message: res.statusText || 'Không thể đọc phản hồi từ server' }
    }

    if (!res.ok) {
      const normalized = normalizeApiError(data)
      throw normalized
    }

    if (contract) {
      return validateContract(contract, data, endpoint)
    }

    return data as T
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
      throw err
    }
    if ((err as Error)?.name === 'AbortError') {
      throw normalizeApiError({
        code: 'TIMEOUT',
        message: 'Yêu cầu tới máy chủ vượt quá thời gian chờ (10s). Vui lòng thử lại.',
      })
    }
    throw normalizeApiError(err)
  }
}

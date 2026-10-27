import { normalizeApiError } from './error-normalizer'
import { validateContract } from './contracts'
import { API_BASE_URL } from '@/config/env.config'
import { z } from 'zod'

const BASE_URL = API_BASE_URL

export interface RequestOptions<T = unknown> extends RequestInit {
  timeout?: number
  contract?: z.ZodType<T>
}

export async function apiClient<T>(endpoint: string, options: RequestOptions<T> = {}): Promise<T> {
  const { timeout = 90000, headers = {}, contract, ...rest } = options

  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
  const controller = !isTest && typeof AbortController !== 'undefined' ? new AbortController() : null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  if (controller && timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeout)
  }

  const onCallerAbort = () => {
    controller?.abort()
  }

  if (options.signal) {
    if (options.signal.aborted) {
      controller?.abort()
    } else {
      options.signal.addEventListener('abort', onCallerAbort, { once: true })
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  try {
    const fetchOptions: RequestInit = {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
    }
    if (controller?.signal) {
      fetchOptions.signal = controller.signal
    } else if (options.signal) {
      fetchOptions.signal = options.signal
    }
    const res = await fetch(url, fetchOptions)

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
      const normalized = normalizeApiError(data, res.status)
      throw normalized
    }

    if (contract) {
      return validateContract(contract, data, endpoint)
    }

    return data as T
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw err
      }
      throw normalizeApiError({
        code: 'TIMEOUT',
        message: `Yêu cầu tới máy chủ vượt quá thời gian chờ (${Math.round(timeout / 1000)}s). Đang khởi động Cloud, vui lòng thử lại.`,
      })
    }
    if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
      throw err
    }
    throw normalizeApiError(err)
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (options.signal) {
      options.signal.removeEventListener('abort', onCallerAbort)
    }
  }
}

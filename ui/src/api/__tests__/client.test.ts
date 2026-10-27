import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../client'

describe('apiClient — Request client and AbortController handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('thực hiện request thành công và trả về dữ liệu json', async () => {
    const mockData = { message: 'ok', success: true }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const result = await apiClient<{ message: string; success: boolean }>('/test-endpoint')
    expect(result).toEqual(mockData)
  })

  it('tôn trọng signal của caller khi caller chủ động abort', async () => {
    const controller = new AbortController()
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    globalThis.fetch = vi.fn().mockImplementation(() => {
      controller.abort()
      return Promise.reject(abortError)
    })

    await expect(
      apiClient('/test-abort', { signal: controller.signal })
    ).rejects.toThrow('The operation was aborted')
  })

  it('dọn dẹp event listener trên caller signal sau khi hoàn tất', async () => {
    const controller = new AbortController()
    const removeListenerSpy = vi.spyOn(controller.signal, 'removeEventListener')

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success' }),
    })

    await apiClient('/test-cleanup', { signal: controller.signal })
    expect(removeListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function))
  })

  it('chuyển đổi AbortError nội bộ do timeout thành lỗi TIMEOUT chuẩn hóa', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    // Fetch bị abort nhưng signal của caller KHÔNG bị abort -> lỗi timeout nội bộ
    globalThis.fetch = vi.fn().mockRejectedValue(abortError)

    await expect(
      apiClient('/test-timeout', { timeout: 30000 })
    ).rejects.toMatchObject({
      code: 'TIMEOUT',
      message: expect.stringContaining('(30s)'),
    })
  })

  it('bắt lỗi HTTP và truyền status code vào normalizeApiError', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ detail: { code: 'NOT_FOUND', message: 'Không tìm thấy ca gieo quẻ.' } }),
    })

    await expect(apiClient('/test-404')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'Không tìm thấy ca gieo quẻ.',
    })
  })
})

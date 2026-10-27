import { NormalizedError } from '@/types/common.types'

/**
 * Chuẩn hóa 4 định dạng lỗi từ Tầng 2 Process Layer:
 * 1. AppError top-level: { code, message, details }
 * 2. HTTPException detail object: { detail: { code, message } }
 * 3. Pydantic validation 422 array: { detail: [ { loc, msg, type } ] }
 * 4. Generic 500: { code: 'INTERNAL_SERVER_ERROR', message, details: { error_detail, error_type } }
 * 5. Lỗi kết nối / Network error
 *
 * Nguyên tắc an toàn: Không bao giờ hiển thị stack trace / error_detail thô cho người dùng.
 */
export function normalizeApiError(error: unknown, statusCode?: number): NormalizedError {
  if (!error) {
    return {
      code: statusCode === 404 ? 'NOT_FOUND' : 'UNKNOWN_ERROR',
      message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      statusCode,
    }
  }

  // Nếu là response từ fetch/axios đã bóc JSON
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>

    // Dạng 3: Pydantic 422 array
    if (Array.isArray(errObj.detail)) {
      const fieldErrors: Record<string, string> = {}
      const messages: string[] = []

      for (const item of errObj.detail) {
        if (typeof item === 'object' && item !== null) {
          const loc = Array.isArray(item.loc) ? item.loc.slice(1).join('.') : 'field'
          const msg = typeof item.msg === 'string' ? item.msg : 'Dữ liệu không hợp lệ'
          fieldErrors[loc] = msg
          messages.push(`${loc}: ${msg}`)
        }
      }

      return {
        code: 'VALIDATION_ERROR',
        message: messages.length > 0
          ? `Lỗi dữ liệu đầu vào: ${messages.join('; ')}`
          : 'Dữ liệu yêu cầu không đúng định dạng.',
        statusCode: statusCode ?? 422,
        fieldErrors,
        rawDetails: errObj.detail,
      }
    }

    // Dạng 2: HTTPException { detail: { code, message } }
    if (typeof errObj.detail === 'object' && errObj.detail !== null) {
      const detailObj = errObj.detail as Record<string, unknown>
      const code = typeof detailObj.code === 'string' ? detailObj.code : (statusCode === 404 ? 'NOT_FOUND' : 'HTTP_ERROR')
      const message = typeof detailObj.message === 'string'
        ? detailObj.message
        : 'Yêu cầu không thể thực hiện được.'

      return {
        code,
        message,
        statusCode,
        rawDetails: detailObj,
      }
    }

    // Dạng 2b: HTTPException { detail: "string" }
    if (typeof errObj.detail === 'string') {
      return {
        code: statusCode === 404 ? 'NOT_FOUND' : 'HTTP_ERROR',
        message: errObj.detail,
        statusCode,
      }
    }

    // Dạng 1 & 4: AppError { code, message, details }
    if (typeof errObj.code === 'string') {
      const code = errObj.code
      let message = typeof errObj.message === 'string' ? errObj.message : 'Lỗi xử lý nghiệp vụ.'

      // An toàn: Nếu là INTERNAL_SERVER_ERROR thì dùng thông điệp an toàn, không lộ error_detail
      if (code === 'INTERNAL_SERVER_ERROR') {
        message = 'Hệ thống gặp sự cố xử lý nội bộ. Vui lòng thử lại hoặc liên hệ quản trị viên.'
      }

      return {
        code,
        message,
        statusCode,
        rawDetails: errObj.details,
      }
    }

    // Lỗi có message dạng Error object chuẩn
    if (typeof errObj.message === 'string') {
      let msg = errObj.message
      if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        msg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại.'
      }
      return {
        code: statusCode === 404 ? 'NOT_FOUND' : 'CLIENT_ERROR',
        message: msg,
        statusCode,
      }
    }
  }

  // Dạng string thô
  if (typeof error === 'string') {
    return {
      code: statusCode === 404 ? 'NOT_FOUND' : 'ERROR',
      message: error,
      statusCode,
    }
  }

  return {
    code: statusCode === 404 ? 'NOT_FOUND' : 'UNKNOWN_ERROR',
    message: 'Không thể kết nối hoặc hệ thống phản hồi lỗi bất thường.',
    statusCode,
  }
}

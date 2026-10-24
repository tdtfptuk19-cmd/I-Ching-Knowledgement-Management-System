import { describe, it, expect } from 'vitest'
import { normalizeApiError } from '../error-normalizer'

describe('error-normalizer: Chuẩn hóa 4 định dạng lỗi từ Tầng 2', () => {
  it('xử lý Dạng 1: AppError { code, message, details }', () => {
    const raw = {
      code: 'VALIDATION_ERROR',
      message: 'target_type=LINE bắt buộc line_position không được NULL.',
      details: { field: 'line_position' },
    }
    const normalized = normalizeApiError(raw)
    expect(normalized.code).toBe('VALIDATION_ERROR')
    expect(normalized.message).toBe('target_type=LINE bắt buộc line_position không được NULL.')
    expect(normalized.rawDetails).toEqual({ field: 'line_position' })
  })

  it('xử lý Dạng 2: HTTPException { detail: { code, message } }', () => {
    const raw = {
      detail: {
        code: 'NOT_FOUND',
        message: 'Không tìm thấy quẻ với mã 99.',
      },
    }
    const normalized = normalizeApiError(raw)
    expect(normalized.code).toBe('NOT_FOUND')
    expect(normalized.message).toBe('Không tìm thấy quẻ với mã 99.')
  })

  it('xử lý Dạng 3: Pydantic 422 { detail: [ { loc, msg, type } ] }', () => {
    const raw = {
      detail: [
        { loc: ['body', 'number_upper'], msg: 'Input should be greater than or equal to 1', type: 'greater_than_equal' },
        { loc: ['body', 'number_lower'], msg: 'Field required', type: 'missing' },
      ],
    }
    const normalized = normalizeApiError(raw)
    expect(normalized.code).toBe('VALIDATION_ERROR')
    expect(normalized.message).toContain('number_upper')
    expect(normalized.fieldErrors?.['number_upper']).toContain('greater than or equal to 1')
    expect(normalized.fieldErrors?.['number_lower']).toBe('Field required')
  })

  it('xử lý Dạng 4: Generic 500 ẩn stack trace và error_detail thô', () => {
    const raw = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi nội bộ trong hệ thống Process Layer.',
      details: {
        error_type: 'OperationalError',
        error_detail: 'pyodbc.OperationalError: Connection to database failed on 1433 with password ***',
      },
    }
    const normalized = normalizeApiError(raw)
    expect(normalized.code).toBe('INTERNAL_SERVER_ERROR')
    // Thông điệp trả về cho người dùng phải an toàn, không chứa chuỗi password hay ODBC
    expect(normalized.message).toBe('Hệ thống gặp sự cố xử lý nội bộ. Vui lòng thử lại hoặc liên hệ quản trị viên.')
    expect(normalized.message).not.toContain('password')
    expect(normalized.message).not.toContain('pyodbc')
  })

  it('xử lý ngoại lệ không xác định hoặc null', () => {
    const normalized = normalizeApiError(null)
    expect(normalized.code).toBe('UNKNOWN_ERROR')
    expect(normalized.message).toBeDefined()
  })
})

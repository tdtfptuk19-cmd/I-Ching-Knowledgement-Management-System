import { describe, it, expect } from 'vitest'
import {
  canViewExpertDetails,
  canReviewSubmissions,
  canSubmitKnowledge,
  canAccessDashboard,
  validateReviewPermission,
} from '../permissions'

describe('permissions: Ma trận quyền khớp 100% core/security.py', () => {
  it('NOVICE: Chỉ có quyền cơ bản, không xem chi tiết Hán Nôm, không đóng góp, không duyệt, không dashboard', () => {
    expect(canViewExpertDetails('NOVICE')).toBe(false)
    expect(canReviewSubmissions('NOVICE')).toBe(false)
    expect(canSubmitKnowledge('NOVICE')).toBe(false)
    expect(canAccessDashboard('NOVICE')).toBe(false)
  })

  it('PRACTITIONER: Được gửi đóng góp tri thức PENDING, chưa xem Hán Nôm, không duyệt', () => {
    expect(canViewExpertDetails('PRACTITIONER')).toBe(false)
    expect(canReviewSubmissions('PRACTITIONER')).toBe(false)
    expect(canSubmitKnowledge('PRACTITIONER')).toBe(true)
    expect(canAccessDashboard('PRACTITIONER')).toBe(false)
  })

  it('EXPERT: Xem chi tiết Hán Nôm, trích dẫn, audit trail, vết luật, đóng góp, xem dashboard', () => {
    expect(canViewExpertDetails('EXPERT')).toBe(true)
    expect(canReviewSubmissions('EXPERT')).toBe(false)
    expect(canSubmitKnowledge('EXPERT')).toBe(true)
    expect(canAccessDashboard('EXPERT')).toBe(true)
  })

  it('REVIEWER: Đầy đủ quyền Expert + Quyền Cổng Kiểm Duyệt Validation Gate', () => {
    expect(canViewExpertDetails('REVIEWER')).toBe(true)
    expect(canReviewSubmissions('REVIEWER')).toBe(true)
    expect(canSubmitKnowledge('REVIEWER')).toBe(true)
    expect(canAccessDashboard('REVIEWER')).toBe(true)
  })

  it('ADMIN: Toàn quyền mọi chức năng', () => {
    expect(canViewExpertDetails('ADMIN')).toBe(true)
    expect(canReviewSubmissions('ADMIN')).toBe(true)
    expect(canSubmitKnowledge('ADMIN')).toBe(true)
    expect(canAccessDashboard('ADMIN')).toBe(true)
  })

  it('Nguyên tắc McElroy (1999) & ADR-005: Chặn reviewer tự duyệt bài của chính mình', () => {
    // Reviewer duyệt bài của người khác -> HỢP LỆ
    expect(validateReviewPermission('Reviewer_A', 'Author_B', 'REVIEWER')).toBe(true)

    // Reviewer tự duyệt bài của chính mình (reviewer == author) -> TỪ CHỐI
    expect(validateReviewPermission('Reviewer_A', 'Reviewer_A', 'REVIEWER')).toBe(false)
    expect(validateReviewPermission('  reviewer_a ', 'REVIEWER_A', 'REVIEWER')).toBe(false)

    // Người không có quyền reviewer cố duyệt -> TỪ CHỐI
    expect(validateReviewPermission('Novice_User', 'Author_B', 'NOVICE')).toBe(false)
    expect(validateReviewPermission('Practitioner_User', 'Author_B', 'PRACTITIONER')).toBe(false)
    expect(validateReviewPermission('Expert_User', 'Author_B', 'EXPERT')).toBe(false)
  })
})

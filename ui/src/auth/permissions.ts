import { AppRole } from '@/i18n/roles'

/**
 * Ma trận kiểm tra quyền ứng dụng - Khớp 100% với process_layer/app/core/security.py
 */

export function canViewExpertDetails(role: AppRole): boolean {
  return role === 'EXPERT' || role === 'REVIEWER' || role === 'ADMIN'
}

export function canReviewSubmissions(role: AppRole): boolean {
  return role === 'REVIEWER' || role === 'ADMIN'
}

export function canSubmitKnowledge(role: AppRole): boolean {
  return role === 'PRACTITIONER' || role === 'EXPERT' || role === 'REVIEWER' || role === 'ADMIN'
}

export function canAccessDashboard(role: AppRole): boolean {
  return role === 'EXPERT' || role === 'REVIEWER' || role === 'ADMIN'
}

export function validateReviewPermission(reviewerId: string, authorId: string, role: AppRole): boolean {
  if (!canReviewSubmissions(role)) {
    return false
  }
  if (reviewerId && authorId && reviewerId.trim().toLowerCase() === authorId.trim().toLowerCase()) {
    return false
  }
  return true
}

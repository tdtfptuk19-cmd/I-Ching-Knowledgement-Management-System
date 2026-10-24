import React, { createContext, useContext, useState } from 'react'
import { AppRole, ROLE_CONFIGS, RoleMeta } from '@/i18n/roles'
import { UserLevel } from '@/types/divination.types'
import {
  canViewExpertDetails,
  canReviewSubmissions,
  canSubmitKnowledge,
  canAccessDashboard,
  validateReviewPermission,
} from './permissions'

interface AuthContextType {
  role: AppRole
  setRole: (role: AppRole) => void
  roleMeta: RoleMeta
  userId: string
  setUserId: (id: string) => void
  reviewerName: string
  setReviewerName: (name: string) => void
  userLevel: UserLevel // Phù hợp cho API query/body
  mySubmittedIds: number[]
  recordSubmission: (id: number) => void
  isMySubmission: (id: number) => boolean
  canViewExpert: boolean
  canReview: boolean
  canSubmit: boolean
  canDashboard: boolean
  canReviewTarget: (authorId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ROLE_STORAGE_KEY = 'kinhdich_simulated_role'
const USER_ID_STORAGE_KEY = 'kinhdich_user_id'
const REVIEWER_NAME_KEY = 'kinhdich_reviewer_name'
const MY_SUBMISSIONS_KEY = 'kinhdich_my_submissions'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<AppRole>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const queryRole = urlParams.get('role')
      if (queryRole && ['NOVICE', 'PRACTITIONER', 'EXPERT', 'REVIEWER', 'ADMIN'].includes(queryRole)) {
        return queryRole as AppRole
      }
    }
    const saved = localStorage.getItem(ROLE_STORAGE_KEY)
    if (saved && ['NOVICE', 'PRACTITIONER', 'EXPERT', 'REVIEWER', 'ADMIN'].includes(saved)) {
      return saved as AppRole
    }
    return 'PRACTITIONER'
  })

  const [userId, setUserIdState] = useState<string>(() => {
    return localStorage.getItem(USER_ID_STORAGE_KEY) || 'user_is1906_demo'
  })

  const [reviewerName, setReviewerNameState] = useState<string>(() => {
    return localStorage.getItem(REVIEWER_NAME_KEY) || 'ChuyenGia_IS1906'
  })

  const [mySubmittedIds, setMySubmittedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(MY_SUBMISSIONS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const setRole = (newRole: AppRole) => {
    setRoleState(newRole)
    localStorage.setItem(ROLE_STORAGE_KEY, newRole)
  }

  const setUserId = (id: string) => {
    setUserIdState(id)
    localStorage.setItem(USER_ID_STORAGE_KEY, id)
  }

  const setReviewerName = (name: string) => {
    setReviewerNameState(name)
    localStorage.setItem(REVIEWER_NAME_KEY, name)
  }

  const recordSubmission = (id: number) => {
    const updated = Array.from(new Set([...mySubmittedIds, id]))
    setMySubmittedIds(updated)
    localStorage.setItem(MY_SUBMISSIONS_KEY, JSON.stringify(updated))
  }

  const isMySubmission = (id: number): boolean => {
    return mySubmittedIds.includes(id)
  }

  // Chuyển đổi sang UserLevel của API
  const userLevel: UserLevel =
    role === 'NOVICE' ? 'NOVICE' : role === 'PRACTITIONER' ? 'PRACTITIONER' : 'EXPERT'

  const canViewExpert = canViewExpertDetails(role)
  const canReview = canReviewSubmissions(role)
  const canSubmit = canSubmitKnowledge(role)
  const canDashboard = canAccessDashboard(role)

  const canReviewTarget = (authorId: string): boolean => {
    return validateReviewPermission(reviewerName, authorId, role)
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        roleMeta: ROLE_CONFIGS[role],
        userId,
        setUserId,
        reviewerName,
        setReviewerName,
        userLevel,
        mySubmittedIds,
        recordSubmission,
        isMySubmission,
        canViewExpert,
        canReview,
        canSubmit,
        canDashboard,
        canReviewTarget,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

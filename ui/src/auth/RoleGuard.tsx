import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ShieldX, ArrowLeft, UserCog } from 'lucide-react'

interface RoleGuardProps {
  children: React.ReactNode
  requiredPermission: 'expert' | 'review' | 'submit' | 'dashboard'
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, requiredPermission }) => {
  const { role, canViewExpert, canReview, canSubmit, canDashboard, setRole } = useAuth()

  let hasAccess = false
  let requiredRoleHint = ''

  switch (requiredPermission) {
    case 'expert':
      hasAccess = canViewExpert
      requiredRoleHint = 'EXPERT, REVIEWER hoặc ADMIN'
      break
    case 'review':
      hasAccess = canReview
      requiredRoleHint = 'REVIEWER hoặc ADMIN'
      break
    case 'submit':
      hasAccess = canSubmit
      requiredRoleHint = 'PRACTITIONER trở lên'
      break
    case 'dashboard':
      hasAccess = canDashboard
      requiredRoleHint = 'EXPERT, REVIEWER hoặc ADMIN'
      break
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-xl shadow-sm text-center">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
        <ShieldX className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
        403 — Từ Chối Truy Cập (Quyền Hạn Chưa Đủ)
      </h2>
      <p className="text-stone-600 mb-4 text-sm leading-relaxed">
        Khu vực này yêu cầu cấp bậc vai trò tối thiểu là <strong className="text-rose-700 font-semibold">{requiredRoleHint}</strong> theo chuẩn phân quyền RBAC và phân cấp tri thức Wiig (1993) / McElroy (1999).
      </p>
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 mb-6 inline-block">
        Vai trò hiện tại của bạn: <strong className="font-semibold text-stone-800">{role}</strong>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/divination"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay về Gieo Quẻ
        </Link>
        <button
          onClick={() => setRole('REVIEWER')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium rounded-lg transition"
        >
          <UserCog className="w-4 h-4" /> Chuyển sang REVIEWER (Demo)
        </button>
      </div>
    </div>
  )
}

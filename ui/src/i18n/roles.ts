export type AppRole = 'NOVICE' | 'PRACTITIONER' | 'EXPERT' | 'REVIEWER' | 'ADMIN'

export interface RoleMeta {
  role: AppRole
  nameVi: string
  description: string
  badgeColor: string
  wiigLevel: string
}

export const ROLE_CONFIGS: Record<AppRole, RoleMeta> = {
  NOVICE: {
    role: 'NOVICE',
    nameVi: 'Người Mới (Novice)',
    description: 'Ẩn chữ Hán, tập trung vào hành động thực tiễn & lời khuyên đời thường',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    wiigLevel: 'Wiig 1993: Mức 1 - Tiếp nhận định hướng ứng dụng',
  },
  PRACTITIONER: {
    role: 'PRACTITIONER',
    nameVi: 'Người Thực Hành (Practitioner)',
    description: 'Xem quẻ biến, quẻ hỗ, dịch thơ và được quyền gửi đóng góp tri thức PENDING',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    wiigLevel: 'Wiig 1993: Mức 2 - Hiểu cấu trúc dịch học & đóng góp tri thức',
  },
  EXPERT: {
    role: 'EXPERT',
    nameVi: 'Chuyên Gia (Expert)',
    description: 'Xem toàn văn Hán Nôm, nguồn trích dẫn, audit trail và vết luật suy luận',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    wiigLevel: 'Wiig 1993: Mức 3 - Thẩm định học thuật & kiểm toán tri thức',
  },
  REVIEWER: {
    role: 'REVIEWER',
    nameVi: 'Người Kiểm Duyệt (Reviewer)',
    description: 'Hội đồng kiểm duyệt tri thức (Validation Gate) phê duyệt / từ chối diễn giải',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    wiigLevel: 'McElroy 1999: Cổng thẩm định tổ chức (Validation Gate)',
  },
  ADMIN: {
    role: 'ADMIN',
    nameVi: 'Quản Trị Viên (Admin)',
    description: 'Toàn quyền giám sát hệ thống, theo dõi chỉ số sức khỏe CSDL & KPI KMS',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    wiigLevel: 'Hệ thống: Quản trị vận hành & giám sát an toàn',
  },
}

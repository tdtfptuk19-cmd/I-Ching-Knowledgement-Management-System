import { Topic } from '@/types/divination.types'

export const TOPIC_LABELS: Record<Topic, string> = {
  GENERAL: 'Tổng Quan & Thời Vận',
  CAREER: 'Sự Nghiệp & Công Danh',
  FINANCE: 'Tài Chính & Đầu Tư',
  RELATIONSHIP: 'Tình Cảm & Nhân Duyên',
  HEALTH: 'Sức Khỏe & Thể Trạng',
  ACADEMIC: 'Học Tập & Thi Cử',
}

export const TOPIC_DESCRIPTIONS: Record<Topic, string> = {
  GENERAL: 'Chiêm nghiệm xu thế thời vận, đại cục và định hướng tổng thể',
  CAREER: 'Công việc, thăng tiến, chuyển việc, hợp tác làm ăn',
  FINANCE: 'Đầu tư, tài lộc, kinh doanh, dòng tiền, giao dịch',
  RELATIONSHIP: 'Gia đạo, hôn nhân, tình cảm đôi lứa, quan hệ xã hội',
  HEALTH: 'Thể trạng, cân bằng âm dương ngũ hành (mang tính tham khảo)',
  ACADEMIC: 'Khoa cử, thi tuyển, nghiên cứu học thuật, phát triển năng lực',
}

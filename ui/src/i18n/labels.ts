/**
 * Từ điển Nhãn & Thuật ngữ tiếng Việt chuẩn mực cho Cổng Tri Thức Kinh Dịch
 */

export interface LabelInfo {
  vi: string
  en: string
  code: string
  description: string
  label?: string
}

// 1. Nhãn Chủ đề (Topics)
export const TOPIC_I18N: Record<string, LabelInfo> = {
  GENERAL: {
    vi: 'Tổng Quan & Thời Vận',
    label: 'Tổng Quan',
    en: 'General Outlook',
    code: 'GENERAL',
    description: 'Chiêm nghiệm xu thế thời vận, đại cục và định hướng tổng thể',
  },
  CAREER: {
    vi: 'Sự Nghiệp & Công Danh',
    label: 'Sự Nghiệp',
    en: 'Career & Ambition',
    code: 'CAREER',
    description: 'Công việc, thăng tiến, chuyển việc, hợp tác làm ăn',
  },
  FINANCE: {
    vi: 'Tài Chính & Đầu Tư',
    label: 'Tài Chính',
    en: 'Finance & Investments',
    code: 'FINANCE',
    description: 'Đầu tư, tài lộc, kinh doanh, dòng tiền và giao dịch',
  },
  RELATIONSHIP: {
    vi: 'Tình Cảm & Nhân Duyên',
    label: 'Tình Cảm',
    en: 'Relationships & Family',
    code: 'RELATIONSHIP',
    description: 'Gia đạo, hôn nhân, tình cảm đôi lứa, quan hệ xã hội',
  },
  HEALTH: {
    vi: 'Sức Khỏe & Thể Trạng',
    label: 'Sức Khỏe',
    en: 'Health & Balance',
    code: 'HEALTH',
    description: 'Thể trạng, cân bằng âm dương ngũ hành (tham khảo triết học)',
  },
  ACADEMIC: {
    vi: 'Học Tập & Thi Cử',
    label: 'Học Tập',
    en: 'Academics & Exams',
    code: 'ACADEMIC',
    description: 'Khoa cử, thi tuyển, nghiên cứu học thuật, phát triển năng lực',
  },
}

// 2. Nhãn Loại Văn Bản Kinh Điển (Text Types)
export const TEXT_TYPE_I18N: Record<string, LabelInfo> = {
  THOAN_TU: {
    vi: 'Thoán Từ',
    label: 'Thoán Từ',
    en: 'Hexagram Statement',
    code: 'THOAN_TU',
    description: 'Lời quẻ gốc của Văn Vương chỉ rõ đại thế cát hung toàn thể',
  },
  THOAN_TRUYEN: {
    vi: 'Thoán Truyện',
    label: 'Thoán Truyện',
    en: 'Commentary on the Decision',
    code: 'THOAN_TRUYEN',
    description: 'Khổng Tử giải thích cấu trúc và nguyên lý vận hành của quẻ',
  },
  DAI_TUONG: {
    vi: 'Đại Tượng Truyện',
    label: 'Đại Tượng Truyện',
    en: 'Great Image',
    code: 'DAI_TUONG',
    description: 'Tượng quẻ và bài học xử thế của người quân tử',
  },
  HAO_TU: {
    vi: 'Hào Từ',
    label: 'Hào Từ',
    en: 'Line Text',
    code: 'HAO_TU',
    description: 'Chu Công chú giải chi tiết từng giai đoạn biến thiên thời thế',
  },
  TIEU_TUONG: {
    vi: 'Tiểu Tượng Truyện',
    label: 'Tiểu Tượng Truyện',
    en: 'Lesser Image',
    code: 'TIEU_TUONG',
    description: 'Lời luận giải về vị thế âm dương tương ứng của từng hào',
  },
  DUNG_CUU: {
    vi: 'Dụng Cửu',
    label: 'Dụng Cửu',
    en: 'Usage of Nines',
    code: 'DUNG_CUU',
    description: 'Lời hào đặc biệt của quẻ Càn: Quần long vô thủ cát',
  },
  DUNG_LUC: {
    vi: 'Dụng Lục',
    label: 'Dụng Lục',
    en: 'Usage of Sixes',
    code: 'DUNG_LUC',
    description: 'Lời hào đặc biệt của quẻ Khôn: Lợi vĩnh trinh',
  },
}

// 3. Nhãn Loại Tác Giả & Nguồn Đóng Góp (Author Types)
export const AUTHOR_TYPE_I18N: Record<string, LabelInfo> = {
  AI_DRAFT: {
    vi: 'Bản Thảo AI',
    label: 'Bản Thảo AI',
    en: 'AI Draft',
    code: 'AI_DRAFT',
    description: 'Bản thảo được sinh tự động bởi mô hình ngôn ngữ lớn, cần chuyên gia thẩm định',
  },
  EXPERT: {
    vi: 'Chuyên Gia Dịch Học',
    label: 'Chuyên Gia',
    en: 'Domain Expert',
    code: 'EXPERT',
    description: 'Đóng góp bởi học giả hoặc nhà nghiên cứu Dịch học có xác thực',
  },
  HUMAN_EXPERT: {
    vi: 'Chuyên Gia Thẩm Định',
    label: 'Chuyên Gia Thẩm Định',
    en: 'Verified Expert',
    code: 'HUMAN_EXPERT',
    description: 'Nội dung đã được đối soát học thuật qua Validation Gate',
  },
  PRACTITIONER_COMMUNITY: {
    vi: 'Cộng Đồng Thực Hành',
    label: 'Cộng Đồng Thực Hành',
    en: 'Practitioner Community',
    code: 'PRACTITIONER_COMMUNITY',
    description: 'Bài viết đóng góp từ người ứng dụng Kinh Dịch thực tiễn',
  },
  CLASSIC: {
    vi: 'Kinh Văn Cổ Điển',
    label: 'Kinh Văn Cổ Điển',
    en: 'Canonical Classic',
    code: 'CLASSIC',
    description: 'Tri thức chuẩn mực từ kinh văn cổ Chu Dịch & Thập Dực',
  },
}

// 4. Mã Chuẩn Kỹ Thuật & Kiến Trúc KMS (Technical Code Glossaries)
export const KMS_TECHNICAL_CODES: Record<string, { labelVi: string; tooltip: string }> = {
  'RBAC': {
    labelVi: 'Kiểm Soát Quyền Theo Vai Trò',
    tooltip: 'Role-Based Access Control: Mô hình phân quyền 5 cấp độ (NOVICE → ADMIN)',
  },
  'BCR-001': {
    labelVi: 'Mô phỏng quyền Client',
    tooltip: 'Business Constraint Rule 001: Phiên bản UI mô phỏng RBAC tại máy khách',
  },
  'BCR-004': {
    labelVi: 'Quy tắc Chống Tự Duyệt',
    tooltip: 'Business Constraint Rule 004: Tác giả bài đóng góp không được tự phê duyệt bài của mình (McElroy 1999)',
  },
  'BCR-005': {
    labelVi: 'Phân loại nguồn PERSON',
    tooltip: 'Business Constraint Rule 005: Chưa tích hợp nguồn PERSON trực tiếp, dự trữ cho Tầng 3',
  },
  'ADR-002': {
    labelVi: 'Chuẩn Ngũ Hành Mai Hoa',
    tooltip: 'Architectural Decision Record 002: Ma trận cực tính Ngũ hành Thể-Dụng và trọng số điểm',
  },
  'ADR-003': {
    labelVi: 'Chuẩn Lịch Âm & Giờ Tý',
    tooltip: 'Architectural Decision Record 003: Thuật toán Hồ Ngọc Đức và ranh giới đổi ngày 23:00',
  },
  'ADR-005': {
    labelVi: 'Kiểm Toán & Vết Tri Thức',
    tooltip: 'Architectural Decision Record 005: Audit trail, băm HMAC-SHA256 danh tính và Validation Gate',
  },
}

// 5. Trọng Số Suy Luận
export const WEIGHT_LABELS: Record<string, { vi: string; code: string; weight: number }> = {
  CORE: { vi: 'Kinh Văn & Thể Dụng', code: 'W=0.40', weight: 0.40 },
  MOVING_LINE: { vi: 'Hào Từ & Hào Động', code: 'W=0.35', weight: 0.35 },
  TIMING: { vi: 'Thời Vận & Ngũ Hành Tháng', code: 'W=0.25', weight: 0.25 },
}

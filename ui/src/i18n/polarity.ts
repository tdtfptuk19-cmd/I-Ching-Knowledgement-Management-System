import { PolarityLabel } from '@/types/divination.types'

export interface PolarityMeta {
  label: PolarityLabel
  nameVi: string
  scoreRange: string
  textColor: string
  bgColor: string
  borderColor: string
  meaning: string
}

export const POLARITY_CONFIGS: Record<PolarityLabel, PolarityMeta> = {
  'ĐẠI CÁT': {
    label: 'ĐẠI CÁT',
    nameVi: 'Đại Cát (Rất Tốt Lành)',
    scoreRange: 'S ≥ +1.20',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500',
    meaning: 'Thời cơ chín muồi, Thể Dụng tương sinh đắc lực, vạn sự hanh thông thuận lợi.',
  },
  'TIỂU CÁT': {
    label: 'TIỂU CÁT',
    nameVi: 'Tiểu Cát (Khá Tốt)',
    scoreRange: '+0.40 ≤ S < +1.20',
    textColor: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-500',
    meaning: 'Khí sắc thuận chiều, có trợ lực hỗ trợ, tiến triển vững chắc.',
  },
  'BÌNH HÒA': {
    label: 'BÌNH HÒA',
    nameVi: 'Bình Hòa (Trung Tính / Cân Bằng)',
    scoreRange: '-0.40 ≤ S < +0.40',
    textColor: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-500',
    meaning: 'Âm dương quân bình, tiến thoái giữ chừng mực, việc thành có phần chậm hoặc cần kiên nhẫn.',
  },
  'TIỂU HUNG': {
    label: 'TIỂU HUNG',
    nameVi: 'Tiểu Hung (Cần Thận Trọng)',
    scoreRange: '-1.20 ≤ S < -0.40',
    textColor: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-500',
    meaning: 'Chủ thể sinh xuất tiết khí hoặc gặp trắc trở, hao tốn công sức, cần phòng ngừa rủi ro.',
  },
  'ĐẠI HUNG': {
    label: 'ĐẠI HUNG',
    nameVi: 'Đại Hung (Bất Lợi Cao)',
    scoreRange: 'S < -1.20',
    textColor: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-500',
    meaning: 'Ngoại cảnh xung khắc mãnh liệt, nghịch thời thất thế, nên án binh bất động bảo toàn lực lượng.',
  },
}

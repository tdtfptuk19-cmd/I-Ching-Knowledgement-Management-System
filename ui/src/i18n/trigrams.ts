export interface TrigramMeta {
  id: number
  nameVn: string
  nameHan: string
  binary: string
  fiveElement: string
  natureSymbol: string
  familyMember: string
  direction: string
}

export const TRIGRAMS_MAP: Record<number, TrigramMeta> = {
  1: { id: 1, nameVn: 'Càn', nameHan: '乾', binary: '111', fiveElement: 'KIM', natureSymbol: 'Trời', familyMember: 'Cha', direction: 'Tây Bắc' },
  2: { id: 2, nameVn: 'Đoài', nameHan: '兌', binary: '011', fiveElement: 'KIM', natureSymbol: 'Đầm', familyMember: 'Thiếu nữ', direction: 'Tây' },
  3: { id: 3, nameVn: 'Ly', nameHan: '離', binary: '101', fiveElement: 'HOA', natureSymbol: 'Lửa', familyMember: 'Trung nữ', direction: 'Nam' },
  4: { id: 4, nameVn: 'Chấn', nameHan: '震', binary: '001', fiveElement: 'MOC', natureSymbol: 'Sấm', familyMember: 'Trưởng nam', direction: 'Đông' },
  5: { id: 5, nameVn: 'Tốn', nameHan: '巽', binary: '110', fiveElement: 'MOC', natureSymbol: 'Gió', familyMember: 'Trưởng nữ', direction: 'Đông Nam' },
  6: { id: 6, nameVn: 'Khảm', nameHan: '坎', binary: '010', fiveElement: 'THUY', natureSymbol: 'Nước', familyMember: 'Trung nam', direction: 'Bắc' },
  7: { id: 7, nameVn: 'Cấn', nameHan: '艮', binary: '100', fiveElement: 'THO', natureSymbol: 'Núi', familyMember: 'Thiếu nam', direction: 'Đông Bắc' },
  8: { id: 8, nameVn: 'Khôn', nameHan: '坤', binary: '000', fiveElement: 'THO', natureSymbol: 'Đất', familyMember: 'Mẹ', direction: 'Tây Nam' },
}

export const FIVE_ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  KIM: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-400' },
  MOC: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
  THUY: { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-400' },
  HOA: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-400' },
  THO: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-500' },
}

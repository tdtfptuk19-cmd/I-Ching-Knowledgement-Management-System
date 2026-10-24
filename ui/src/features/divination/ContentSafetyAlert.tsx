import React from 'react'
import { Topic, AdviceBlock } from '@/types/divination.types'
import { HeartPulse, DollarSign, Info } from 'lucide-react'

interface ContentSafetyAlertProps {
  topic: Topic
  disclaimer: string
  adviceBlocks?: AdviceBlock[]
}

export const ContentSafetyAlert: React.FC<ContentSafetyAlertProps> = ({
  topic,
  disclaimer,
  adviceBlocks = [],
}) => {
  // Tìm khối cảnh báo an toàn từ advice_blocks
  const healthWarning = adviceBlocks.find(
    (b) => b.provenance?.note === 'CONTENT_SAFETY_HEALTH',
  )
  const financeWarning = adviceBlocks.find(
    (b) => b.provenance?.note === 'CONTENT_SAFETY_FINANCE',
  )

  const isHealth = topic === 'HEALTH' || Boolean(healthWarning)
  const isFinance = topic === 'FINANCE' || Boolean(financeWarning)

  return (
    <div className="space-y-3">
      {/* 1. KHỐI CẢNH BÁO BẮT BUỘC CHO CHỦ ĐỀ HEALTH (KHÔNG ĐƯỢC ẨN) */}
      {isHealth && (
        <div
          role="alert"
          aria-label="Cảnh báo an toàn y tế và sức khỏe"
          className="p-4 bg-rose-50 border-2 border-rose-500 rounded-xl shadow-sm text-rose-950 space-y-2"
        >
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <HeartPulse className="w-5 h-5 flex-shrink-0 animate-pulse text-rose-600" />
            <span>CẢNH BÁO NGUYÊN TẮC AN TOÀN Y TẾ & SỨC KHỎE (BẮT BUỘC)</span>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed font-medium">
            {healthWarning?.content ||
              'Ý nghĩa biểu tượng quẻ và ngũ hành chỉ thể hiện trạng thái quân bình triết học cổ truyền, mang tính chất chiêm nghiệm văn hóa. Mọi vấn đề về thể chất, triệu chứng bệnh lý và phác đồ điều trị BẮT BUỘC phải tham vấn trực tiếp với bác sĩ chuyên khoa hoặc cơ sở y tế có thẩm quyền.'}
          </p>
          <div className="text-xs text-rose-800 font-medium italic">
            * Hệ thống KinhDich_KB tuyệt đối không đưa ra chẩn đoán hay lời khuyên thay thế y khoa chuyên nghiệp.
          </div>
        </div>
      )}

      {/* 2. KHỐI CẢNH BÁO BẮT BUỘC CHO CHỦ ĐỀ FINANCE (KHÔNG ĐƯỢC ẨN) */}
      {isFinance && (
        <div
          role="alert"
          aria-label="Cảnh báo an toàn tài chính và đầu tư"
          className="p-4 bg-amber-50 border-2 border-amber-500 rounded-xl shadow-sm text-amber-950 space-y-2"
        >
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <DollarSign className="w-5 h-5 flex-shrink-0 text-amber-700" />
            <span>CẢNH BÁO NGUYÊN TẮC AN TOÀN TÀI CHÍNH & ĐẦU TƯ (BẮT BUỘC)</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            {financeWarning?.content ||
              'Dữ liệu chiêm đoán tài lộc chỉ mang tính định hướng tư duy chiến lược và quản trị rủi ro theo góc nhìn Dịch học. Tuyệt đối không sử dụng làm căn cứ duy nhất cho các quyết định đầu tư vốn, giao dịch tài chính lớn hoặc đầu cơ mạo hiểm.'}
          </p>
          <div className="text-xs text-amber-900 font-medium italic">
            * Mọi quyết định tài chính cần được thẩm định bởi chuyên gia tài chính hoặc kiểm toán viên chuyên nghiệp.
          </div>
        </div>
      )}

      {/* 3. TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM TOÀN DIỆN (DISCLAIMER) */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm text-stone-700 flex items-start gap-2.5 leading-relaxed">
        <Info className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-stone-900">Tuyên bố miễn trừ trách nhiệm: </span>
          <span>
            {disclaimer ||
              'Kết quả suy luận mang tính chất tham khảo văn hóa, triết học và định hướng tư duy dựa trên hệ thống biểu tượng Kinh Dịch và Mai Hoa Dịch Số cổ truyền. Hệ thống không đưa ra khẳng định chắc chắn về tương lai.'}
          </span>
        </div>
      </div>
    </div>
  )
}

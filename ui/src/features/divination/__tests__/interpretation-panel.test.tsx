import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthContext'
import { TechnicalModeProvider } from '@/context/TechnicalModeContext'
import { InterpretationPanel } from '../InterpretationPanel'
import { DivinationResult } from '../DivinationResult'
import { KnowledgeCoverageBar } from '../KnowledgeCoverageBar'
import { DivinationResponse, InterpretationItem } from '@/types/divination.types'

function renderWithProviders(ui: React.ReactElement, initialRole: string = 'EXPERT') {
  localStorage.setItem('kinhdich_simulated_role', initialRole)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TechnicalModeProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </TechnicalModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

const mockInterpretationCareer: InterpretationItem = {
  interpretation_id: 101,
  hexagram_id: 1,
  line_position: null,
  topic: 'CAREER',
  summary: 'Thời cơ thăng tiến vượt bậc, cần chủ động nắm giữ cương vị lãnh đạo.',
  guidance: 'Tập trung xây dựng uy tín cá nhân và dẫn dắt đội ngũ bằng tầm nhìn chính trực.',
  polarity: 1.0,
  source_id: 12,
  source_title: 'Dịch Học Thực Chiến',
  author_type: 'HUMAN_EXPERT',
  version: 2,
  review_status: 'APPROVED',
}

const mockInterpretationFinance: InterpretationItem = {
  interpretation_id: 102,
  hexagram_id: 1,
  line_position: null,
  topic: 'FINANCE',
  summary: 'Dòng tiền dồi dào, lợi nhuận tăng trưởng bền vững.',
  guidance: 'Thích hợp mở rộng đầu tư vào các kênh tài sản giá trị cốt lõi.',
  polarity: 0.8,
  source_id: 15,
  source_title: 'Mai Hoa Dịch Số Toàn Thư',
  author_type: 'CLASSIC',
  version: 1,
  review_status: 'APPROVED',
}

const mockDivinationData: DivinationResponse = {
  case_id: 'case_test_p0_12345678',
  disclaimer: 'Kết quả mang tính tham khảo triết học ứng dụng.',
  casting_meta: {
    casting_method: 'MAI_HOA_NUMBER',
    user_level: 'EXPERT',
    pseudonymized_user_hash: 'hash_abc',
    raw_numbers: { number_upper: 1, number_lower: 1 },
  },
  initial_hexagram: {
    hexagram_id: 1,
    name_vn: 'Thuần Càn',
    name_han: '乾為天',
    binary_code: '111111',
    upper_trigram: { id: 1, name_vn: 'Càn', name_han: '乾', binary_code: '111', five_element: 'KIM', nature_symbol: 'Thiên' },
    lower_trigram: { id: 1, name_vn: 'Càn', name_han: '乾', binary_code: '111', five_element: 'KIM', nature_symbol: 'Thiên' },
  },
  transformed_hexagram: {
    hexagram_id: 44,
    name_vn: 'Thiên Phong Cấu',
    name_han: '天風姤',
    binary_code: '111110',
    upper_trigram: { id: 1, name_vn: 'Càn', name_han: '乾', binary_code: '111', five_element: 'KIM', nature_symbol: 'Thiên' },
    lower_trigram: { id: 5, name_vn: 'Tốn', name_han: '巽', binary_code: '110', five_element: 'MOC', nature_symbol: 'Phong' },
  },
  nuclear_hexagram: {
    hexagram_id: 1,
    name_vn: 'Thuần Càn',
    name_han: '乾為天',
    binary_code: '111111',
    upper_trigram: { id: 1, name_vn: 'Càn', name_han: '乾', binary_code: '111', five_element: 'KIM', nature_symbol: 'Thiên' },
    lower_trigram: { id: 1, name_vn: 'Càn', name_han: '乾', binary_code: '111', five_element: 'KIM', nature_symbol: 'Thiên' },
  },
  moving_line: 1,
  dung_side: 'LOWER',
  the_element: 'KIM',
  dung_element: 'MOC',
  five_element_analysis: [
    {
      pair: 'CHỦ',
      primary_element: 'KIM',
      target_element: 'MOC',
      relation_type: 'THE_KHAC_DUNG',
      polarity_weight: 1,
      interpretation: 'Thể khắc Dụng: Chủ thể thắng khách thể, vạn sự hanh thông.',
      source_id: 15,
    },
  ],
  rules_fired: [
    {
      rule_id: 201,
      rule_code: 'RULE_THE_KHAC_DUNG',
      priority: 90,
      conclusion: 'Thể khắc Dụng chủ về sự việc thành tựu có công sức nỗ lực.',
      condition_description: 'Thể ngũ hành khắc Dụng ngũ hành trong quẻ Chủ',
      trace: { the: 'KIM', dung: 'MOC' },
    },
  ],
  classic_texts: [
    {
      text_id: 1001,
      hexagram_id: 1,
      line_position: null,
      text_type: 'THOAN_TU',
      text_han: '元亨利貞',
      text_vn: 'Nguyên hanh lợi trinh.',
      source_id: 7,
      source_title: 'Chu Dịch Bản Nghĩa',
      verified_by: 'Hội đồng Dịch học',
    },
  ],
  interpretations: [mockInterpretationCareer],
  synthesis: {
    score: 1.2,
    normalized_score: 0.8,
    polarity_label: 'TIỂU CÁT',
    primary_conclusion: 'Công danh thuận lợi, thời vận hanh thông.',
    advice_blocks: [],
    decomposition: {
      element_score: 1.0,
      rule_score: 1.0,
      interpretation_score: 1.0,
    },
  },
  coverage: {
    is_complete: true,
    classic_texts_count: 1,
    has_custom_topic_interpretation: true,
    fallback_applied: false,
    message: 'Tri thức đầy đủ 3 trụ cột.',
  },
}

describe('Phase 0: InterpretationPanel & Cổng Tri Thức Chuyên Gia (Wiig 1993, McElroy 1999)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('1. InterpretationPanel Component', () => {
    it('0 interpretations -> hiển thị Empty State, gate CTA đúng theo RBAC (PRACTITIONER nộp, REVIEWER duyệt, NOVICE ẩn)', () => {
      // 1. Thử vai trò REVIEWER: thấy cả Đóng góp và Mở hàng đợi duyệt
      const { unmount } = renderWithProviders(
        <InterpretationPanel
          interpretations={[]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'REVIEWER'
      )

      expect(screen.getByTestId('interpretation-empty-state')).toBeInTheDocument()
      expect(
        screen.getByText(/Chưa có diễn giải chuyên đề nào được duyệt cho quẻ này/i)
      ).toBeInTheDocument()

      const contributeBtn = screen.getByRole('link', { name: /Đóng góp diễn giải/i })
      expect(contributeBtn).toBeInTheDocument()
      expect(contributeBtn).toHaveAttribute('href', '/contribute?hexagram_id=1&topic=CAREER')

      const reviewBtn = screen.getByRole('link', { name: /Mở hàng đợi duyệt/i })
      expect(reviewBtn).toBeInTheDocument()
      expect(reviewBtn).toHaveAttribute('href', '/review?hexagram_id=1&topic=CAREER')

      unmount()

      // 2. Thử vai trò EXPERT: thấy Đóng góp nhưng KHÔNG thấy Mở hàng đợi duyệt (canReviewSubmissions = false)
      const { unmount: unmountExpert } = renderWithProviders(
        <InterpretationPanel
          interpretations={[]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )
      expect(screen.getByRole('link', { name: /Đóng góp diễn giải/i })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Mở hàng đợi duyệt/i })).not.toBeInTheDocument()

      unmountExpert()

      // 3. Thử vai trò NOVICE: ẩn cả hai CTA (không thể tự đóng góp hay duyệt)
      renderWithProviders(
        <InterpretationPanel
          interpretations={[]}
          topic="CAREER"
          hexagramId={1}
          userLevel="NOVICE"
        />,
        'NOVICE'
      )
      expect(screen.queryByRole('link', { name: /Đóng góp diễn giải/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Mở hàng đợi duyệt/i })).not.toBeInTheDocument()
    })

    it('gộp nhiều version trùng nội dung của cùng quẻ/topic, hiển thị bản mới nhất và lịch sử các bản cũ', () => {
      const mockV2: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 101,
        version: 2,
        summary: 'Bản thảo cũ v2',
      }
      const mockV3: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 103,
        version: 3,
        summary: 'Bản thảo mới nhất v3',
        review_status: 'APPROVED',
      }

      renderWithProviders(
        <InterpretationPanel
          interpretations={[mockV2, mockV3]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      // Thẻ chính hiển thị bản mới nhất (v3)
      expect(screen.getByText('Bản thảo mới nhất v3')).toBeInTheDocument()
      expect(screen.getByText('Bản #3')).toBeInTheDocument()

      // Hiển thị lịch sử 1 phiên bản trước
      expect(screen.getByText(/Lịch sử chỉnh sửa \(1 phiên bản trước\)/i)).toBeInTheDocument()
    })

    it('hiển thị badge trạng thái động theo review_status (APPROVED, PENDING, REJECTED)', () => {
      const mockPending: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 104,
        review_status: 'PENDING',
      }

      const { unmount } = renderWithProviders(
        <InterpretationPanel
          interpretations={[mockPending]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      expect(screen.getByText('Chờ duyệt')).toBeInTheDocument()
      unmount()

      const mockRejected: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 105,
        review_status: 'REJECTED',
      }

      renderWithProviders(
        <InterpretationPanel
          interpretations={[mockRejected]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      expect(screen.getByText('Từ chối')).toBeInTheDocument()
      unmount()

      // 3. Thiếu trường review_status -> hiển thị "Chưa xác định", không tự gán "Đã duyệt"
      const mockUnknown: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 106,
        review_status: undefined,
      }

      renderWithProviders(
        <InterpretationPanel
          interpretations={[mockUnknown]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      expect(screen.getByText('Chưa xác định')).toBeInTheDocument()
    })

    it('phân biệt các đơn vị tri thức khác target_type/line/moving/to_hexagram và không gộp nhầm thành version history', () => {
      const unitHex: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 201,
        target_type: 'HEXAGRAM',
        summary: 'Diễn giải quẻ toàn diện',
      }
      const unitLine: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 202,
        target_type: 'LINE',
        line_position: 1,
        summary: 'Diễn giải Hào Sơ',
      }
      const unitTrans: InterpretationItem = {
        ...mockInterpretationCareer,
        interpretation_id: 203,
        target_type: 'TRANSFORMATION',
        moving_line_position: 1,
        to_hexagram_id: 44,
        summary: 'Diễn giải Quẻ Biến sang Thiên Phong Cấu',
      }

      renderWithProviders(
        <InterpretationPanel
          interpretations={[unitHex, unitLine, unitTrans]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      // Cả 3 đơn vị đều phải xuất hiện độc lập, không bị gộp vào version history
      expect(screen.getByText('Diễn giải quẻ toàn diện')).toBeInTheDocument()
      expect(screen.getByText('Diễn giải Hào Sơ')).toBeInTheDocument()
      expect(screen.getByText('Diễn giải Quẻ Biến sang Thiên Phong Cấu')).toBeInTheDocument()
      expect(screen.queryByText(/Lịch sử chỉnh sửa/i)).not.toBeInTheDocument()
    })

    it('1 interpretation CAREER -> hiển thị summary, guidance, badge Chuyên Gia Thẩm Định, source, version', () => {
      renderWithProviders(
        <InterpretationPanel
          interpretations={[mockInterpretationCareer]}
          topic="CAREER"
          hexagramId={1}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      expect(
        screen.getByText('Thời cơ thăng tiến vượt bậc, cần chủ động nắm giữ cương vị lãnh đạo.')
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'Tập trung xây dựng uy tín cá nhân và dẫn dắt đội ngũ bằng tầm nhìn chính trực.'
        )
      ).toBeInTheDocument()

      // Tác giả: Chuyên Gia Thẩm Định
      expect(screen.getByText('Chuyên Gia Thẩm Định')).toBeInTheDocument()

      // Nguồn trích xuất
      expect(screen.getByText('Dịch Học Thực Chiến')).toBeInTheDocument()

      // Phiên bản & trạng thái duyệt
      expect(screen.getByText('Bản #2')).toBeInTheDocument()
      expect(screen.getByText('Đã duyệt')).toBeInTheDocument()
    })

    it('2 interpretations khác topic -> nhóm đúng theo từng chủ đề', () => {
      renderWithProviders(
        <InterpretationPanel
          interpretations={[mockInterpretationCareer, mockInterpretationFinance]}
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      expect(screen.getByTestId('topic-group-CAREER')).toBeInTheDocument()
      expect(screen.getByTestId('topic-group-FINANCE')).toBeInTheDocument()

      expect(screen.getByText(/Sự Nghiệp & Công Danh \(1\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Tài Chính & Đầu Tư \(1\)/i)).toBeInTheDocument()
    })

    it('Phân quyền Wiig 1993: NOVICE ẩn siêu dữ liệu kiểm toán; EXPERT hiển thị trọn vẹn', () => {
      const { unmount } = renderWithProviders(
        <InterpretationPanel
          interpretations={[mockInterpretationCareer]}
          topic="CAREER"
          userLevel="NOVICE"
        />,
        'NOVICE'
      )

      // NOVICE thấy summary + guidance
      expect(
        screen.getByText('Thời cơ thăng tiến vượt bậc, cần chủ động nắm giữ cương vị lãnh đạo.')
      ).toBeInTheDocument()

      // NOVICE KHÔNG thấy badge tác giả, nguồn, version, trạng thái duyệt
      expect(screen.queryByTestId('author-badge')).not.toBeInTheDocument()
      expect(screen.queryByTestId('version-badge')).not.toBeInTheDocument()
      expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument()
      expect(screen.queryByTestId('source-label')).not.toBeInTheDocument()

      unmount()

      // EXPERT thấy trọn vẹn
      renderWithProviders(
        <InterpretationPanel
          interpretations={[mockInterpretationCareer]}
          topic="CAREER"
          userLevel="EXPERT"
        />,
        'EXPERT'
      )

      expect(screen.getByTestId('author-badge')).toBeInTheDocument()
      expect(screen.getByTestId('version-badge')).toBeInTheDocument()
      expect(screen.getByTestId('status-badge')).toBeInTheDocument()
      expect(screen.getByTestId('source-label')).toBeInTheDocument()
    })
  })

  describe('2. KnowledgeCoverageBar Component', () => {
    it('hiển thị đầy đủ 3 trụ cột khi có cả Ngũ hành, Luật và Diễn giải', () => {
      renderWithProviders(
        <KnowledgeCoverageBar
          rulesCount={2}
          interpretationsCount={1}
          fallbackApplied={false}
        />
      )

      expect(screen.getByText('Ngũ hành (bắt buộc)')).toBeInTheDocument()
      expect(screen.getByText('Luật suy luận — 2 luật kích hoạt')).toBeInTheDocument()
      expect(screen.getByText('Diễn giải chuyên đề — 1 bài đã duyệt')).toBeInTheDocument()

      // Không hiện badge tái chuẩn hóa tỷ trọng
      expect(screen.queryByTestId('normalization-badge')).not.toBeInTheDocument()
    })

    it('hiển thị badge cảnh báo tái chuẩn hóa tỷ trọng khi thiếu trụ cột', () => {
      renderWithProviders(
        <KnowledgeCoverageBar
          rulesCount={0}
          interpretationsCount={0}
          fallbackApplied={true}
          coverageMessage="Đang dùng ngũ hành mặc định"
        />
      )

      const badge = screen.getByTestId('normalization-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Đang tái chuẩn hóa tỷ trọng — kết quả chỉ dựa trên 1/3 trụ cột')

      // Mở giải thích
      const infoBtn = screen.getByRole('button', { name: /Xem giải thích tái chuẩn hóa/i })
      fireEvent.click(infoBtn)

      expect(screen.getByText(/Hệ thống áp dụng cơ chế suy diễn an toàn/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Vì sao thiếu\? Xem Dashboard Quản Trị/i })).toHaveAttribute(
        'href',
        '/dashboard'
      )
    })
  })

  describe('3. DivinationResult: Tích hợp 3 Tab & CoverageBar', () => {
    it('hiển thị 3 tab với số đếm chính xác; mở mặc định tab interp khi topic khác GENERAL và có diễn giải', () => {
      renderWithProviders(
        <DivinationResult
          data={mockDivinationData}
          topic="CAREER"
        />,
        'EXPERT'
      )

      // Tab buttons
      const tabClassics = screen.getByRole('button', { name: /Kinh Văn Cổ Điển \(1\)/i })
      const tabInterp = screen.getByRole('button', { name: /Diễn Giải Chuyên Đề \(1\)/i })
      const tabRules = screen.getByRole('button', { name: /Vết Luật Suy Luận \(1\) — Expert/i })

      expect(tabClassics).toBeInTheDocument()
      expect(tabInterp).toBeInTheDocument()
      expect(tabRules).toBeInTheDocument()

      // Mặc định là tab Diễn Giải Chuyên Đề vì topic=CAREER và interpretations.length > 0
      expect(screen.getByTestId('interpretation-panel')).toBeInTheDocument()
      expect(
        screen.getByText('Thời cơ thăng tiến vượt bậc, cần chủ động nắm giữ cương vị lãnh đạo.')
      ).toBeInTheDocument()

      // Chuyển sang tab Kinh văn cổ điển
      fireEvent.click(tabClassics)
      expect(screen.getByText('Nguyên hanh lợi trinh.')).toBeInTheDocument()

      // Chuyển sang tab Vết luật suy luận
      fireEvent.click(tabRules)
      expect(screen.getByText('RULE_THE_KHAC_DUNG (Ưu tiên: 90)')).toBeInTheDocument()
      expect(screen.getByText(/Điều kiện kích hoạt:/i)).toBeInTheDocument()
    })

    it('mở mặc định tab classics khi topic = GENERAL', () => {
      renderWithProviders(
        <DivinationResult
          data={mockDivinationData}
          topic="GENERAL"
        />,
        'EXPERT'
      )

      // Mặc định là Kinh văn cổ điển
      expect(screen.getByText('Nguyên hanh lợi trinh.')).toBeInTheDocument()
      expect(screen.queryByTestId('interpretation-panel')).not.toBeInTheDocument()
    })

    it('tự động reset tab về interp khi gieo ca mới có diễn giải chuyên đề', () => {
      const dataCase1: DivinationResponse = {
        ...mockDivinationData,
        case_id: 'case_1',
        interpretations: [],
      }
      const dataCase2: DivinationResponse = {
        ...mockDivinationData,
        case_id: 'case_2',
        interpretations: [mockInterpretationCareer],
      }

      const { rerender } = renderWithProviders(
        <DivinationResult
          key={dataCase1.case_id}
          data={dataCase1}
          topic="CAREER"
        />,
        'EXPERT'
      )

      // Ca 1 không có diễn giải -> activeTab là classics
      expect(screen.getByText('Nguyên hanh lợi trinh.')).toBeInTheDocument()

      // Gieo ca thứ 2 có diễn giải và key mới -> DivinationResult remount và reset sang interp
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider>
            <TechnicalModeProvider>
              <MemoryRouter>
                <DivinationResult
                  key={dataCase2.case_id}
                  data={dataCase2}
                  topic="CAREER"
                />
              </MemoryRouter>
            </TechnicalModeProvider>
          </AuthProvider>
        </QueryClientProvider>
      )

      expect(screen.getByTestId('interpretation-panel')).toBeInTheDocument()
      expect(
        screen.getByText('Thời cơ thăng tiến vượt bậc, cần chủ động nắm giữ cương vị lãnh đạo.')
      ).toBeInTheDocument()
    })
  })
})
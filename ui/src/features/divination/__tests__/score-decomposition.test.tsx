import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScoreDecomposition } from '../ScoreDecomposition'
import { SynthesisResult } from '@/types/divination.types'

describe('ScoreDecomposition: Minh bạch 3 trụ cột & badge Assumption', () => {
  const mockSynthesis: SynthesisResult = {
    score: 0.85,
    normalized_score: 0.71,
    polarity_label: 'TIỂU CÁT',
    primary_conclusion: 'Thuận lợi vừa phải',
    advice_blocks: [],
    decomposition: {
      element_score: 1.0,
      rule_score: 0.8,
      interpretation_score: 0.6,
    },
  }

  it('hiển thị nhãn Cát/Hung và phân rã 3 trụ cột', () => {
    render(<ScoreDecomposition synthesis={mockSynthesis} />)

    expect(screen.getByText('Tiểu Cát (Khá Tốt)')).toBeInTheDocument()
    expect(screen.getByText('+0.85')).toBeInTheDocument()

    // 3 Trụ cột
    expect(screen.getByText('Trụ Cột 1 (40%)')).toBeInTheDocument()
    expect(screen.getByText('Trụ Cột 2 (35%)')).toBeInTheDocument()
    expect(screen.getByText('Trụ Cột 3 (25%)')).toBeInTheDocument()

    expect(screen.getByText('+1.00')).toBeInTheDocument()
    expect(screen.getByText('+0.80')).toBeInTheDocument()
    expect(screen.getByText('+0.60')).toBeInTheDocument()
  })

  it('hiển thị badge ASSUMPTION và mở ra giải thích khi click', () => {
    render(<ScoreDecomposition synthesis={mockSynthesis} />)

    const badge = screen.getByRole('button', { name: /ASSUMPTION/i })
    expect(badge).toBeInTheDocument()

    // Chưa click -> chưa hiện chi tiết
    expect(screen.queryByText(/Quy ước Giả định Kỹ thuật/i)).not.toBeInTheDocument()

    // Click -> hiện chi tiết
    fireEvent.click(badge)
    expect(screen.getByText(/Quy ước Giả định Kỹ thuật/i)).toBeInTheDocument()
    expect(screen.getByText(/0.40 · S_elem/i)).toBeInTheDocument()
  })

  it('nhận diện chính xác Trụ Cột 2 đang hiện diện khi rulesFiredCount > 0 dù rule_score = 0.0 (Bình Hòa)', () => {
    const neutralSynthesis: SynthesisResult = {
      score: 0.0,
      normalized_score: 0.5,
      polarity_label: 'BÌNH HÒA',
      primary_conclusion: 'Bình hòa thế cuộc',
      advice_blocks: [],
      decomposition: {
        element_score: 0.0,
        rule_score: 0.0,
        interpretation_score: 0.0,
      },
    }

    render(
      <ScoreDecomposition
        synthesis={neutralSynthesis}
        fallbackApplied={true}
        rulesFiredCount={1}
        interpretationsCount={0}
      />
    )

    // Trụ cột 2 không được báo vắng mà phải báo đang hiện diện với điểm Bình Hòa
    expect(screen.getByText(/Đang hiện diện \(1 luật kích hoạt, Điểm Bình Hòa: 0\.00\)/i)).toBeInTheDocument()
    // Trụ cột 3 báo vắng
    expect(screen.getByText(/Trụ Cột 3 \(Diễn giải chuyên gia\):/i)).toBeInTheDocument()
    // Tỷ trọng tái phân bổ giữa Trụ cột 1 và Trụ cột 2
    expect(screen.getByText(/Tỷ trọng tái phân bổ: Trụ Cột 1 Ngũ Hành .* Trụ Cột 2 Quy Tắc/i)).toBeInTheDocument()
  })

  it('báo vắng Trụ Cột 2 khi rulesFiredCount = 0', () => {
    const neutralSynthesis: SynthesisResult = {
      score: 0.0,
      normalized_score: 0.5,
      polarity_label: 'BÌNH HÒA',
      primary_conclusion: 'Bình hòa thế cuộc',
      advice_blocks: [],
      decomposition: {
        element_score: 0.0,
        rule_score: 0.0,
        interpretation_score: 0.0,
      },
    }

    render(
      <ScoreDecomposition
        synthesis={neutralSynthesis}
        fallbackApplied={true}
        rulesFiredCount={0}
        interpretationsCount={0}
      />
    )

    expect(screen.getByText(/Trụ Cột 2 \(Quy tắc suy luận\):/i)).toBeInTheDocument()
    expect(screen.getByText(/chưa có quy tắc nào khớp với tiền đề của quẻ này/i)).toBeInTheDocument()
  })
})

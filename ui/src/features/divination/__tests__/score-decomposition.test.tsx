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
})

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES_FOR_A11Y = [
  { path: '/divination', name: 'Gieo Quẻ' },
  { path: '/hexagrams', name: '64 Quẻ Ma Trận' },
  { path: '/hexagrams/1', name: 'Chi Tiết Quẻ' },
  { path: '/search', name: 'Tìm Kiếm' },
  { path: '/contribute', name: 'Đóng Góp' },
  { path: '/review', name: 'Kiểm Duyệt' },
  { path: '/dashboard', name: 'Dashboard' },
]

const A11Y_VIEWPORTS = [
  { name: 'Mobile (390px)', width: 390, height: 844 },
  { name: 'Desktop (1440px)', width: 1440, height: 900 },
]

test.describe('Axe A11y Audits: Quét tiêu chuẩn WCAG 2.0 / 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'REVIEWER')
    })
  })

  for (const vp of A11Y_VIEWPORTS) {
    for (const r of ROUTES_FOR_A11Y) {
      test(`Quét Axe trên ${r.name} (${r.path}) tại ${vp.name}: Không có lỗi Critical/Serious`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.goto(r.path)
        await page.waitForLoadState('networkidle')

        // Quét bằng AxeBuilder với các tag wcag2a, wcag2aa, wcag21a, wcag21aa
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        // Lọc các lỗi nghiêm trọng (critical và serious)
        const severeViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        )

        if (accessibilityScanResults.violations.length > 0) {
          console.log(
            `[AXE AUDIT] ${r.name} @ ${vp.width}px: ${accessibilityScanResults.violations.length} vi phạm tổng cộng (${severeViolations.length} critical/serious)`
          )
          for (const v of accessibilityScanResults.violations) {
            console.log(`   - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
            for (const n of v.nodes.slice(0, 3)) {
              console.log(`       target: ${n.target.join(' ')} | html: ${n.html.slice(0, 100)}`)
            }
          }
        }

        // Khẳng định không có lỗi critical hoặc serious
        expect(severeViolations).toEqual([])
      })
    }
  }

  test('Quét Axe trên Kết Quả Gieo Quẻ (KnowledgeCoverageBar, InterpretationPanel, 3 Tabs) không có lỗi Critical/Serious', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/divination')
    await page.waitForLoadState('networkidle')

    // Chọn CAREER và bấm gieo quẻ
    await page.getByRole('button', { name: /Sự Nghiệp & Công Danh/i }).click()
    const castBtn = page.getByRole('button', { name: /Khởi Chiêm Lập Quẻ/i })
    await castBtn.click()

    // Chờ kết quả hiển thị
    await expect(page.getByTestId('knowledge-coverage-bar')).toBeVisible()

    // Mở tab Diễn Giải Chuyên Đề
    const interpTabBtn = page.getByRole('button', { name: /Diễn Giải Chuyên Đề/i })
    if (await interpTabBtn.isVisible()) {
      await interpTabBtn.click()
    }

    // Quét Axe toàn diện trên trang kết quả đã populate
    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const severeViolations = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(severeViolations).toEqual([])
  })
})

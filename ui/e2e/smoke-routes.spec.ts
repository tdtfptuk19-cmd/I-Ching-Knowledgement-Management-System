import { test, expect } from '@playwright/test'

const ROUTES_TO_TEST = [
  { path: '/divination', expectedTitle: /Gieo Quẻ Mai Hoa/i },
  { path: '/hexagrams', expectedTitle: /64 Quẻ Kinh Dịch/i },
  { path: '/hexagrams/1', expectedTitle: /Quẻ #1/i },
  { path: '/search', expectedTitle: /Tìm Kiếm Tri Thức/i },
  { path: '/contribute', expectedTitle: /Đóng Góp Diễn Giải/i },
  { path: '/review', expectedTitle: /Hàng Đợi Kiểm Duyệt/i },
  { path: '/dashboard', expectedTitle: /Dashboard Quản Trị KMS/i },
]

test.describe('1. Smoke Test 7 Routes: Tải trang, Title & Không tràn ngang', () => {
  test.beforeEach(async ({ page }) => {
    // Đặt vai trò REVIEWER để có quyền truy cập tất cả 7 routes
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'REVIEWER')
    })
  })

  for (const { path, expectedTitle } of ROUTES_TO_TEST) {
    test(`Route ${path}: Tải thành công, title chuẩn và không có scroll ngang`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // 1. Kiểm tra title
      await expect(page).toHaveTitle(expectedTitle)

      // 2. Kiểm tra phần tử <main id="main-content"> hiển thị
      const main = page.locator('#main-content')
      await expect(main).toBeVisible()

      // 3. Đo đạc thực tế: scrollWidth <= innerWidth (không có thanh cuộn ngang trang)
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))

      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth)
    })
  }
})

test.describe('2. Mobile Header & Drawer Navigation (Viewport 390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'REVIEWER')
    })
  })

  test('Trên mobile: Header thu gọn, có nút hamburger, mở được drawer chứa nav & role switcher', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/divination')
    await page.waitForLoadState('networkidle')

    // Desktop nav phải ẩn trên mobile
    const desktopNav = page.locator('header nav')
    await expect(desktopNav).toBeHidden()

    // Nút hamburger phải hiển thị với aria-label
    const menuBtn = page.getByRole('button', { name: /Menu điều hướng/i })
    await expect(menuBtn).toBeVisible()

    // Click mở menu drawer
    await menuBtn.click()

    // Drawer hiển thị các liên kết điều hướng
    await expect(page.getByRole('link', { name: /Gieo Quẻ/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /64 Quẻ/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Tìm Kiếm/i })).toBeVisible()

    // Drawer chứa bộ chuyển đổi vai trò (Role Switcher)
    await expect(page.getByText(/Vai Trò Mô Phỏng \(RBAC\)/i)).toBeVisible()

    // Đổi vai trò sang PRACTITIONER ngay trên mobile drawer bằng nút
    const practitionerBtn = page.getByRole('button', { name: /Thực Hành.*PRACTITIONER/i })
    await expect(practitionerBtn).toBeVisible()
    await practitionerBtn.click()

    const storedRole = await page.evaluate(() => localStorage.getItem('kinhdich_simulated_role'))
    expect(storedRole).toBe('PRACTITIONER')
  })
})

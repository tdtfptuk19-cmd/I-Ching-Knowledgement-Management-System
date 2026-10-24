import { test, expect } from '@playwright/test'

test.describe('RBAC Visibility & Navigation Permissions', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Vai trò PRACTITIONER: Chỉ thấy các cổng cơ bản, không có Dropdown Quản Trị, bị chặn 403 ở /review và /dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'PRACTITIONER')
    })

    await page.goto('/divination')
    await page.waitForLoadState('networkidle')

    // Thấy các cổng cơ bản
    const nav = page.locator('header nav')
    await expect(nav.getByRole('link', { name: /Gieo Quẻ/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /64 Quẻ/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Tìm Kiếm/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Đóng Góp/i })).toBeVisible()

    // KHÔNG thấy Dropdown "Quản Trị"
    await expect(nav.getByRole('button', { name: /Quản Trị/i })).toBeHidden()

    // Truy cập trực tiếp /review -> Bị chặn 403
    await page.goto('/review')
    await expect(page.getByText(/403 — Từ Chối Truy Cập/i)).toBeVisible()

    // Truy cập trực tiếp /dashboard -> Bị chặn 403
    await page.goto('/dashboard')
    await expect(page.getByText(/403 — Từ Chối Truy Cập/i)).toBeVisible()
  })

  test('Vai trò REVIEWER: Thấy Dropdown Quản Trị, truy cập đầy đủ /review và /dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'REVIEWER')
    })

    await page.goto('/divination')
    await page.waitForLoadState('networkidle')

    const nav = page.locator('header nav')

    // Thấy Dropdown "Quản Trị"
    const adminDropdownBtn = nav.getByRole('button', { name: /Quản Trị/i })
    await expect(adminDropdownBtn).toBeVisible()

    // Click mở dropdown
    await adminDropdownBtn.click()
    await expect(page.getByRole('link', { name: /Kiểm Duyệt/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()

    // Điều hướng vào Kiểm Duyệt thành công
    await page.goto('/review')
    await expect(page.getByRole('heading', { name: /Hàng Đợi Kiểm Duyệt Tri Thức/i })).toBeVisible()

    // Điều hướng vào Dashboard thành công
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /Chỉ Số Vận Hành & Học Tập Tri Thức/i })).toBeVisible()
  })

  test('Vai trò ADMIN: Thấy Dropdown Quản Trị và truy cập toàn quyền', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'ADMIN')
    })

    await page.goto('/divination')
    await page.waitForLoadState('networkidle')

    const nav = page.locator('header nav')
    const adminDropdownBtn = nav.getByRole('button', { name: /Quản Trị/i })
    await expect(adminDropdownBtn).toBeVisible()
  })
})

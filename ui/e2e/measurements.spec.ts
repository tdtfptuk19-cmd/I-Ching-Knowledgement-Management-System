import { test, expect } from '@playwright/test'

test.describe('Đo Lường Thực Tế Trình Duyệt: Scroll Ngang, Nav 1 Dòng & Ma Trận 8x8', () => {
  // 1. Kiểm tra Scroll Ngang trên 3 Viewport Mobile phổ biến: 360px, 390px, 414px
  const MOBILE_VIEWPORTS = [
    { name: '360px (Android tiêu chuẩn)', width: 360, height: 740 },
    { name: '390px (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '414px (iPhone Plus/Max)', width: 414, height: 896 },
  ]

  for (const vp of MOBILE_VIEWPORTS) {
    test(`Đo scroll ngang tại ${vp.name}: scrollWidth <= innerWidth trên mọi route`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.addInitScript(() => {
        localStorage.setItem('kinhdich_simulated_role', 'REVIEWER')
      })

      const routes = ['/divination', '/hexagrams', '/hexagrams/1', '/search', '/contribute', '/review', '/dashboard']

      for (const r of routes) {
        await page.goto(r)
        await page.waitForLoadState('networkidle')

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        }))

        // Log số liệu đo thật
        console.log(`[MEASURE] Route ${r} @ ${vp.width}px: scrollWidth=${metrics.scrollWidth}px, innerWidth=${metrics.innerWidth}px`)
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth)
      }
    })
  }

  // 2. Đo Nav Desktop 1 dòng tại 1280px và 1440px với cả 3 vai trò
  const DESKTOP_VIEWPORTS = [
    { name: '1280px', width: 1280, height: 800 },
    { name: '1440px', width: 1440, height: 900 },
  ]
  const ROLES = ['PRACTITIONER', 'REVIEWER', 'ADMIN']

  for (const vp of DESKTOP_VIEWPORTS) {
    for (const role of ROLES) {
      test(`Đo Desktop Nav tại ${vp.name} với vai trò ${role}: Duy trì 1 dòng duy nhất, không xuống dòng`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.addInitScript((r) => {
          localStorage.setItem('kinhdich_simulated_role', r)
        }, role)

        await page.goto('/divination')
        await page.waitForLoadState('networkidle')

        const nav = page.locator('header nav')
        await expect(nav).toBeVisible()

        // Đo tọa độ top của tất cả các liên kết/nút trong nav
        const items = nav.locator('> a, > div > button')
        const count = await items.count()
        expect(count).toBeGreaterThan(0)

        const boundingBoxes = []
        for (let i = 0; i < count; i++) {
          const box = await items.nth(i).boundingBox()
          if (box) boundingBoxes.push(box)
        }

        // Tất cả item phải nằm cùng trên 1 hàng (độ lệch trục Y không quá 5px)
        const firstTop = boundingBoxes[0].y
        for (let i = 1; i < boundingBoxes.length; i++) {
          const deltaY = Math.abs(boundingBoxes[i].y - firstTop)
          expect(deltaY).toBeLessThanOrEqual(5)
        }

        console.log(`[MEASURE] Nav Desktop @ ${vp.width}px [${role}]: ${count} items nằm thẳng hàng trên 1 dòng (deltaY <= 5px).`)
      })
    }
  }

  // 3. Đo Ma trận 8x8 tại 1440px: Hiển thị trọn vẹn 8 cột hoặc cuộn ngang rõ ràng
  test('Đo Ma trận 8x8 tại 1440px: Kiểm tra hiển thị đủ 8 cột Bát Quái', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/hexagrams')
    await page.waitForLoadState('networkidle')

    // Bảng ma trận
    const table = page.locator('table')
    await expect(table).toBeVisible()

    // 8 cột Thượng quái: Càn, Đoài, Ly, Chấn, Tốn, Khảm, Cấn, Khôn
    const colHeaders = page.locator('thead th')
    const colCount = await colHeaders.count()
    // 1 cột góc "Thượng \ Hạ" + 8 cột quái = 9 cột
    expect(colCount).toBe(9)

    // Kiểm tra cột Khôn (cột thứ 8) có trong DOM và đo vị trí
    const khonHeader = colHeaders.filter({ hasText: 'Khôn' })
    await expect(khonHeader).toBeVisible()

    const khonBox = await khonHeader.boundingBox()
    expect(khonBox).not.toBeNull()
    if (khonBox) {
      console.log(`[MEASURE] Cột Khôn (Cột 8) tại 1440px: x=${khonBox.x}px, width=${khonBox.width}px. Tọa độ nằm trọn trong viewport (${khonBox.x + khonBox.width} <= 1440px).`)
      expect(khonBox.x + khonBox.width).toBeLessThanOrEqual(1440)
    }
  })
})

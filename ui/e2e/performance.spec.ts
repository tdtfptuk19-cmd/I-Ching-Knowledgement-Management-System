import { test, expect } from '@playwright/test'

test.describe('Đo Lường Hiệu Năng Thực Tế (Web Vitals: LCP, CLS, FCP)', () => {
  const ROUTES_TO_MEASURE = [
    { path: '/divination', name: 'Gieo Quẻ (/divination)' },
    { path: '/hexagrams', name: '64 Quẻ Ma Trận (/hexagrams)' },
  ]

  for (const r of ROUTES_TO_MEASURE) {
    test(`Đo hiệu năng trên ${r.name}`, async ({ page }, testInfo) => {
      const vp = page.viewportSize() || { width: 1440, height: 900 }
      page.on('console', (msg) => {
        if (msg.text().includes('LAYOUT_SHIFT')) {
          console.log(msg.text())
        }
      })

      // Đăng ký đo lường trước khi load
      await page.addInitScript(() => {
        ;(window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals = { lcp: 0, cls: 0 }

        try {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            if (entries.length > 0) {
              const lastEntry = entries[entries.length - 1] as unknown as { startTime: number }
              ;(window as unknown as { __vitals: { lcp: number } }).__vitals.lcp = lastEntry.startTime
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true })

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const shift = entry as unknown as { hadRecentInput: boolean; value: number; sources?: Array<{ node?: { nodeName?: string; className?: string }; previousRect?: DOMRectReadOnly; currentRect?: DOMRectReadOnly }> }
              if (!shift.hadRecentInput) {
                ;(window as unknown as { __vitals: { cls: number } }).__vitals.cls += shift.value
                console.log('LAYOUT_SHIFT_EVENT:', shift.value, JSON.stringify(shift.sources?.map((s) => ({
                  tag: s.node?.nodeName,
                  class: s.node?.className,
                  prevTop: s.previousRect?.top,
                  currTop: s.currentRect?.top,
                }))))
              }
            }
          }).observe({ type: 'layout-shift', buffered: true })
        } catch (e) {
          console.warn('PerformanceObserver not fully supported:', e)
        }
      })

      const startTime = Date.now()
      await page.goto(r.path)
      await page.waitForLoadState('networkidle')
      const totalLoadTime = Date.now() - startTime

      // Lấy các chỉ số từ trình duyệt
      const vitals = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find((p) => p.name === 'first-contentful-paint')
        const wVitals = (window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals

        return {
          fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
          lcp: wVitals.lcp ? Math.round(wVitals.lcp) : (fcpEntry ? Math.round(fcpEntry.startTime) : null),
          cls: Number(wVitals.cls.toFixed(4)),
          domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          responseEnd: nav ? Math.round(nav.responseEnd) : null,
        }
      })

      console.log(`\n======================================================`)
      console.log(`[PERF MEASURE] ${r.name} [Project: ${testInfo.project.name}, Viewport: ${vp.width}x${vp.height}]:`)
      console.log(`   - FCP (First Contentful Paint): ${vitals.fcp} ms`)
      console.log(`   - LCP (Largest Contentful Paint): ${vitals.lcp} ms (Chuẩn Google: < 2500ms)`)
      console.log(`   - CLS (Cumulative Layout Shift): ${vitals.cls} (Chuẩn Google: < 0.1)`)
      console.log(`   - DOMContentLoaded: ${vitals.domContentLoaded} ms`)
      console.log(`   - Tổng thời gian hoàn tất trang: ${totalLoadTime} ms`)
      console.log(`======================================================\n`)

      // Kiểm tra tiêu chuẩn Web Vitals tốt (Good threshold)
      if (vitals.lcp !== null) {
        expect(vitals.lcp).toBeLessThan(2500) // LCP chuẩn Good: < 2.5s
      }
      expect(vitals.cls).toBeLessThan(0.1) // CLS chuẩn Good: < 0.1
    })
  }
})

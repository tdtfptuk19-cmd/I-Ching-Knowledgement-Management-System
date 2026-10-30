import { test, expect } from '@playwright/test'

test.describe('E2E KMS Layer 3: 4 Core User Flows (MSW Mock Mode)', () => {
  test.beforeEach(async ({ page }) => {
    // Khởi tạo phiên với vai trò REVIEWER để có quyền truy cập toàn diện
    await page.addInitScript(() => {
      localStorage.setItem('kinhdich_simulated_role', 'REVIEWER')
      localStorage.setItem('kinhdich_reviewer_name', 'ChuyenGia_E2E_Tester')
      localStorage.setItem('kinhdich_user_id', 'ChuyenGia_E2E_Tester')
    })
  })

  test('Luồng 1: Gieo quẻ Kinh Dịch & Nạp phản hồi thực chứng (Double-Loop Learning)', async ({ page }) => {
    await page.goto('/divination')

    // 1. Kiểm tra tiêu đề trang
    await expect(page.locator('h1')).toContainText('Cổng Chiêm Đoán & Luận Giải Quẻ Dịch')

    // 2. Chọn chủ đề và phương pháp lập quẻ
    await page.getByRole('button', { name: /Sự Nghiệp & Công Danh/i }).click()

    // 3. Tiến hành gieo quẻ bằng nút "Khởi Chiêm Lập Quẻ"
    const castBtn = page.getByRole('button', { name: /Khởi Chiêm Lập Quẻ/i })
    await castBtn.click()

    // 4. Kiểm tra giao diện kết quả hiển thị 3 quẻ
    await expect(page.getByText(/Quẻ Chủ/i).first()).toBeVisible()
    await expect(page.getByText(/Quẻ Hỗ/i).first()).toBeVisible()
    await expect(page.getByText(/Quẻ Biến/i).first()).toBeVisible()

    // 4b. Kiểm tra Thanh Độ Phủ Tri Thức (KnowledgeCoverageBar - Phase 0 & 1)
    await expect(page.getByTestId('knowledge-coverage-bar')).toBeVisible()
    await expect(page.getByText(/Tri thức đang dùng/i)).toBeVisible()

    // 4c. Kiểm tra và mở Tab Diễn Giải Chuyên Đề (InterpretationPanel)
    const interpTabBtn = page.getByRole('button', { name: /Diễn Giải Chuyên Đề/i })
    await expect(interpTabBtn).toBeVisible()
    await interpTabBtn.click()
    await expect(page.getByTestId('interpretation-panel').or(page.getByTestId('interpretation-empty-state'))).toBeVisible()

    // 5. Kiểm tra phân rã điểm số và nhãn ASSUMPTION
    await expect(page.getByText(/Tổng Hợp Tri Thức 3 Trụ Cột/i).first()).toBeVisible()
    await expect(page.getByText('ASSUMPTION').first()).toBeVisible()

    // 6. Mở Modal phản hồi thực chứng (Double-Loop Learning)
    const feedbackBtn = page.getByRole('button', { name: /Phản hồi thực chứng/i }).first()
    if (await feedbackBtn.isVisible()) {
      await feedbackBtn.click()
      await expect(page.getByText(/Phản Hồi Thực Chứng Sau Chiêm Đoán/i)).toBeVisible()
      const notesInput = page.getByPlaceholder(/Ghi nhận sự việc, quyết định/i)
      await notesInput.fill('Dự án đã nghiệm thu thành công đúng như quẻ dự báo.')
      const submitFeedbackBtn = page.getByRole('button', { name: /Nạp vào Vòng Lặp Học Tập Đôi/i })
      await submitFeedbackBtn.click()
    }
  })

  test('Luồng 2: Tra cứu toàn văn & Lọc 64 quẻ Kinh Dịch (Search & Multi-criteria filter)', async ({ page }) => {
    await page.goto('/search')

    await expect(page.locator('h1')).toContainText('Tra Cứu & Tìm Kiếm Tri Thức Toàn Văn')

    // 1. Tìm kiếm không dấu
    const searchInput = page.getByPlaceholder(/Nhập từ khóa tìm kiếm/i)
    await searchInput.fill('can')

    // 2. Chờ kết quả debounce render quẻ Thuần Càn (#1)
    await expect(page.getByText(/Thuần Càn/i).first()).toBeVisible()

    // 3. Lọc theo chủ đề qua select #topic-select
    const topicSelect = page.locator('#topic-select')
    await topicSelect.selectOption('CAREER')

    // 4. Đảm bảo trạng thái URL đồng bộ
    await expect(page).toHaveURL(/q=can/)
  })

  test('Luồng 3: Đóng góp diễn giải tri thức mới & Xem trong hàng đợi (Contribute & Validation Gate)', async ({ page }) => {
    // 1. Vào trang Đóng góp
    await page.goto('/contribute')
    await expect(page.locator('h1')).toContainText('Đóng Góp Diễn Giải Tri Thức Mới')

    // 2. Điền thông tin form đóng góp
    const summaryInput = page.locator('#summary-input')
    await summaryInput.fill('Diễn giải thực tiễn cho dự án phần mềm KMS nhóm 5')
    const guidanceInput = page.locator('#guidance-input')
    await guidanceInput.fill('Hành động nhất quán theo nguyên tắc quân tử, chú trọng kiểm định.')

    // 3. Gửi bài đóng góp
    const submitBtn = page.getByRole('button', { name: /Gửi bài đóng góp/i })
    await submitBtn.click()

    // 4. Kiểm tra thông báo tiếp nhận PENDING (McElroy 1999)
    await expect(page.getByText(/Tiếp nhận thành công!/i)).toBeVisible()
    await expect(page.getByText(/PENDING · Chờ thẩm định/i)).toBeVisible()

    // 5. Chuyển sang Hàng đợi kiểm duyệt
    await page.goto('/review')
    await expect(page.locator('h1')).toContainText('Hàng Đợi Kiểm Duyệt Tri Thức')
    await expect(page.getByText(/Kiểm duyệt Tri thức/i).first()).toBeVisible()
  })

  test('Luồng 4: Bảng điều khiển Quản trị Tri thức KMS (Governance Dashboard 4 Blocks)', async ({ page }) => {
    await page.goto('/dashboard')

    // 1. Kiểm tra tiêu đề Dashboard
    await expect(page.locator('h1')).toContainText('Chỉ Số Vận Hành & Học Tập Tri Thức')

    // 2. Kiểm tra đủ 4 khối theo lý thuyết KMS
    await expect(page.getByText(/1\. Kinh Văn Cổ Điển/i)).toBeVisible()
    await expect(page.getByText('Wiig 1993', { exact: true })).toBeVisible()

    await expect(page.getByText(/2\. Hàng Đợi Thẩm Định/i)).toBeVisible()
    await expect(page.getByText('McElroy 1999', { exact: true })).toBeVisible()

    await expect(page.getByText(/3\. Phân Bổ Nguồn/i)).toBeVisible()
    await expect(page.getByText('Provenance', { exact: true })).toBeVisible()

    await expect(page.getByText(/4\. Vòng Lặp Học Tập Đôi/i)).toBeVisible()
    await expect(page.getByText('Argyris 1978', { exact: true })).toBeVisible()

    // 3. Kiểm tra nút làm mới
    const refreshBtn = page.getByRole('button', { name: /Làm mới/i })
    await expect(refreshBtn).toBeVisible()
    await refreshBtn.click()
  })
})

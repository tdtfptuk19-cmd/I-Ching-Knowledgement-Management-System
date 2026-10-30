# TIẾN ĐỘ TẦNG 3 — UI / ACCESS & INTERFACE LAYER (`KinhDich_KB_UI`)
**Dự án:** Hệ thống Quản trị Tri thức Kinh Dịch (`KinhDich_KB`) — Môn học KMS301, Nhóm 5 (IS1906)  
**Cập nhật lần cuối:** 20/10/2026  
**Công nghệ:** React 18, TypeScript 5, Vite 6, Tailwind CSS, TanStack Query v5, React Router v6, Vitest, MSW 2.

---

## 1. MA TRẬN TIẾN ĐỘ CÁC CỔNG KIỂM SOÁT (GATES)

| Gate | Tên Cổng Kiểm Soát | Trạng Thái | Minh Chứng & Kết Quả |
|:---:|:---|:---:|:---|
| **Gate 7** | Khảo Sát Tầng 2 & Thiết Kế Kiến Trúc UI | **HOÀN THÀNH** | [docs/adr/ADR-006_ui_layer_architecture.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-006_ui_layer_architecture.md). Thu thập 13 fixtures thật từ `KinhDich_KB_dev`, thiết kế ma trận RBAC mô phỏng 5 vai trò. |
| **Gate 8** | Nền Tảng Dự Án & Màn Hình Gieo Quẻ Mai Hoa | **HOÀN THÀNH** | Bộ chuẩn hóa lỗi 4 tầng (`error-normalizer.ts`), RBAC Banner mô phỏng, Gieo quẻ Thời gian & Số học, Trực quan hóa 3 quẻ, An toàn nội dung bắt buộc (Y tế/Tài chính), Phân rã điểm 3 trụ cột và cơ chế Tái chuẩn hóa Fallback (`synthesis_engine.py:141-167`). |
| **Gate 9** | Tra Cứu & Cá Nhân Hóa (Bát Quái & Toàn Văn) | **HOÀN THÀNH** | Sinh `hexagram-index.json` từ `kinhdich_64_que.sql` (64 quẻ, ID 1..64, binary_code chuẩn); Đối chiếu parity 5 quẻ mẫu với backend thật đạt 100%; Lưới 8×8 Bát Quái Tiên Thiên; Chi tiết quẻ 3 cấp độ Wiig 1993 (`NOVICE` ẩn Hán tự, `PRACTITIONER` hiện cấu trúc, `EXPERT` hiện trọn vẹn Hán tự font Noto Serif TC & chỉ số kiểm toán); Tìm kiếm toàn văn thông minh debounce/bỏ dấu/Hán tự/URL sync; Toàn bộ 36/36 tests pass; 5 ảnh chụp màn hình dữ liệu thật trong `docs/screenshots/`. |
| **Gate 10** | Quản Trị Tri Thức & Vòng Lặp Học Tập Đôi | **HOÀN THÀNH** | Form đóng góp tri thức (`POST /interpretations`) phân cấp trường động theo `target_type` (HEXAGRAM, LINE 1-7, TRANSFORMATION); Hàng đợi thẩm định (`GET /review/queue`, `PUT /interpretations/{id}/review`) có huy hiệu `AI_DRAFT` nổi bật, hộp thoại duyệt có tooltip BCR-002; Cơ chế Chặn Tự Duyệt (Anti-Self-Review - BCR-004, McElroy 1999); Phản hồi thực chứng (`PUT /divination/{case_id}/feedback`) với khóa cờ Best Practice theo RBAC; Lịch sử ca gieo (`localStorage`); Phòng thủ chống XSS 100%; 47/47 tests Vitest pass (100%), ESLint 0 errors, tsc 0 errors, build production sạch (391.73 kB). |
| **Gate 11** | Báo Cáo Thống Kê KMS & Đóng Gói Toàn Diện | **HOÀN THÀNH** | Dashboard 4 khối thời gian thực (`GET /governance/stats`): Khối 1 Kinh Văn Cổ Điển (Wiig 1993, 964 mục, 100% duyệt, 0 null Hán), Khối 2 Hàng Đợi Thẩm Định (McElroy 1999), Khối 3 Phân Bổ Nguồn (Provenance), Khối 4 Vòng Lặp Học Tập Đôi (Argyris & Schön 1978). `DashboardPage.tsx` + `RoleGuard` (`/dashboard`, RBAC chỉ REVIEWER/EXPERT/ADMIN). 8/8 unit tests pass (`dashboard.test.tsx`). Build production (`build:mock`) thành công, 0 lỗi TypeScript. 3/3 E2E Luồng 4 pass trên mobile/tablet/desktop. Axe a11y 0 lỗi trên Dashboard. Tuyên bố an toàn & báo cáo tổng kết KMS301 tại `docs/05_ui_layer_report.md`. Ảnh chụp màn hình trong `docs/screenshots/gate11_*.png`. |
| **Mở rộng PA2'** | AI Advice Layer & Lưu Bản Thảo Chuyên Gia | **HOÀN THÀNH** | [docs/adr/ADR-007_ai_advice_layer.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-007_ai_advice_layer.md). Tích hợp khối `AIAdviceBlock` (3-5 gạch đầu dòng có thẻ căn cứ, huy hiệu `AI_DRAFT`, model, fallback badge, citations chips, nút lưu bản thảo vào hàng đợi kiểm duyệt chuyên gia). Hỗ trợ Google Gemini, Anthropic và Fake. 7/7 vitest component pass (`ai-advice-block.test.tsx`). |

---

## 2. KẾT QUẢ KIỂM TRA CHẤT LƯỢNG TẦNG 3 (QUALITY GATES — TẤNG 3 TOÀN DIỆN)

- **ESLint:** 0 errors, 1 warning (directive trong file thư viện MSW `mockServiceWorker.js`)
- **TypeScript:** 0 errors (`tsc --noEmit`)
- **Vitest Unit/Component Tests:** **18 files / 117 tests pass (100%)** (bao gồm `ai-advice-block.test.tsx` 7/7, `interpretation-panel.test.tsx` 12/12, `governance.test.tsx` 16/16, `dashboard.test.tsx` 9/9, `wave-2a.test.tsx` 8/8, `DichSuPanel.test.tsx` 8/8)
  - `ai-advice-block.test.tsx`: 7/7 pass
  - `permissions.test.ts`: 6/6 pass
  - `error-normalizer.test.ts`: 5/5 pass
  - `hexagram-index.test.ts`: 5/5 pass
  - `golden-cases.test.ts`: 4/4 pass
  - `hexagram-detail.test.tsx`: 5/5 pass
  - `search.test.tsx`: 6/6 pass
  - `divination-safety.test.tsx`: 3/3 pass
  - `score-decomposition.test.tsx`: 2/2 pass
  - `interpretation-panel.test.tsx`: 12/12 pass (P0/P1/P2: empty-state, role-gate, dynamic status badge, multi-key unit grouping, tab remount reset, CTA deep-linking)
  - `governance.test.tsx`: 16/16 pass (RBAC Guard, Anti-Self-Review, Anti-XSS, Best Practice Guard, Conditional Fields, Contract Fields)
  - `dashboard.test.tsx`: 9/9 pass (Gate 11 & P2: RBAC RoleGuard, 4 Khối KMS, Honest Double-Loop Reporting, Dynamic Covered Hexagrams #1, #2, #50)
  - Các suites khác (API contracts, client, ErrorBoundary, MiniMarkdownRenderer, divination-safety): toàn bộ pass
- **Playwright E2E (4 luồng, 3 viewport):** **12/12 tests pass (100%)** qua `build:mock` (MSW Mock Mode, không phụ thuộc backend thật)
  - Luồng 1: Gieo quẻ & Double-Loop Feedback — pass (mobile/tablet/desktop)
  - Luồng 2: Tra cứu & Lọc 64 quẻ — pass (mobile/tablet/desktop)
  - Luồng 3: Đóng góp & Hàng đợi thẩm định — pass (mobile/tablet/desktop)
  - Luồng 4: Dashboard Quản trị KMS 4 Khối — pass (mobile/tablet/desktop)
- **Axe Core Accessibility:** 0 lỗi Critical/Serious trên tất cả trang (bao gồm `/dashboard` mobile & desktop)
- **Production Build (`build:mock`):** Thành công, 0 lỗi TypeScript, bundle sạch:
  - `dist/index.html`: 3.71 kB (gzip: 1.59 kB)
  - `dist/assets/index-*.css`: 49.37 kB (gzip: 8.44 kB)
  - `dist/assets/index-*.js`: ~300–434 kB (gzip: 90–124 kB)
  - `dist/assets/DashboardPage-*.js`: 24.85 kB (gzip: 6.09 kB)

---

## 3. DANH MỤC ẢNH CHỤP MÀN HÌNH MINH CHỨNG (DOCS/SCREENSHOTS)

| File Ảnh | Màn Hình & Trạng Thái | Kích Thước (Bytes) | Nguồn Dữ Liệu |
|:---|:---|:---:|:---:|
| `gate9_hexagram_grid.png` | Lưới 64 Quẻ Bát Quái Tiên Thiên 8×8 | 232,968 | Dữ liệu SQL thật (64 quẻ) |
| `gate9_hexagram_detail_novice.png` | Chi tiết Quẻ #1 Cấp độ `NOVICE` | 103,899 | FastAPI `GET /hexagram/1` thật |
| `gate9_hexagram_detail_practitioner.png` | Chi tiết Quẻ #1 Cấp độ `PRACTITIONER` | 103,899 | FastAPI `GET /hexagram/1` thật |
| `gate9_hexagram_detail_expert.png` | Chi tiết Quẻ #1 Cấp độ `EXPERT` | 114,403 | FastAPI `GET /hexagram/1` thật |
| `gate9_search_can.png` | Tìm kiếm toàn văn `q=can` | 106,673 | FastAPI `GET /search` thật (133 mục) |
| `gate10_contribute_form.png` | Biểu mẫu đóng góp tri thức PENDING | 113,384 | Giao diện React Layer 3 (`/contribute`) |
| `gate10_review_queue.png` | Hàng đợi thẩm định chuyên gia (Validation Gate) | 183,419 | FastAPI `GET /review/queue` thật |
| `gate10_review_confirm_modal.png` | Hộp thoại xác nhận phê duyệt kèm tooltip BCR-002 | 261,373 | Giao diện Review Modal Layer 3 |
| `gate10_feedback_modal.png` | Modal phản hồi thực chứng (Double-Loop Learning) | 219,875 | Giao diện Feedback Modal Layer 3 |
| `gate11_dashboard_desktop.png` | Dashboard Quản trị Tri thức KMS — Desktop (1440px) | — | `vite preview` build:mock, dữ liệu mock MSW |
| `gate11_dashboard_mobile.png` | Dashboard Quản trị Tri thức KMS — Mobile (390px) | — | `vite preview` build:mock, dữ liệu mock MSW |
| `gate11_review_queue_live.png` | Hàng đợi kiểm duyệt tri thức — Live | — | `vite preview` build:mock, dữ liệu mock MSW |

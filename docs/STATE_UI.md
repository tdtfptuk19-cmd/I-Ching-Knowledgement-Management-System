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
| **Gate 11** | Báo Cáo Thống Kê KMS & Đóng Gói Toàn Diện | *CHƯA BẮT ĐẦU* | Dashboard 4 khối thời gian thực (`GET /governance/stats`), Tuyên bố an toàn, Báo cáo kỹ thuật tổng kết học phần KMS301. Dừng chờ xác nhận duyệt Gate 10. |

---

## 2. KẾT QUẢ KIỂM TRA CHẤT LƯỢNG GATE 10 (QUALITY GATES)

- **ESLint:** 0 errors, 1 warning (directive trong file thư viện MSW `mockServiceWorker.js`)
- **TypeScript:** 0 errors (`tsc --noEmit`)
- **Vitest Unit/Component Tests:** 47/47 tests pass (100%) qua 9 test suites
  - `permissions.test.ts`: 6/6 pass
  - `error-normalizer.test.ts`: 5/5 pass
  - `hexagram-index.test.ts`: 5/5 pass
  - `golden-cases.test.ts`: 4/4 pass
  - `hexagram-detail.test.tsx`: 5/5 pass
  - `search.test.tsx`: 6/6 pass
  - `divination-safety.test.tsx`: 3/3 pass
  - `score-decomposition.test.tsx`: 2/2 pass
  - `governance.test.tsx`: 11/11 pass (RBAC Guard, Anti-Self-Review, Anti-XSS, Best Practice Guard, Conditional Fields)
- **Production Build:** Thành công, kích thước bundle sạch:
  - `dist/index.html`: 1.00 kB (gzip: 0.58 kB)
  - `dist/assets/index-*.css`: 39.26 kB (gzip: 6.96 kB)
  - `dist/assets/index-*.js`: 391.73 kB (gzip: 106.75 kB)
  - MSW: Hoàn toàn không xuất hiện trong bundle (0 bytes, loại trừ bởi tree-shaking khi `VITE_MOCK=false`).

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

# TRẠNG THÁI DỰ ÁN PROCESS LAYER (KMS301 — KINHDICH_KB)
**Cập nhật lần cuối:** 20/10/2026  
**Môn học:** KMS301 — Hệ Thống Quản Trị Tri Thức · Nhóm 5 (Lớp IS1906)  
**Môi trường thực thi:** Python 3.12.8 (`.venv` cục bộ) | SQL Server 2022 (`(local)`)  
**Cơ sở dữ liệu phát triển:** `KinhDich_KB_dev` (CSDL Production `KinhDich_KB` giữ nguyên vẹn 100%)  
**Kết quả kiểm thử tự động (Pytest):** **43/43 Tests PASS (100%)** — Thời gian thực thi: 2.14s  

---

## 1. TỔNG QUAN TIẾN ĐỘ CÁC PHA (MILESTONES & GATES)

| Pha | Tên Hạng Mục | Trạng Thái | Cổng Kiểm Soát (Gate) | Tài Liệu Báo Cáo / Minh Chứng |
|:---:|:---|:---:|:---:|:---|
| **Pha 0** | Khảo sát & Kiểm toán Tầng Dữ liệu | **HOÀN THÀNH** | **Cổng 0: PASS** | [docs/00_data_layer_audit.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/00_data_layer_audit.md). 964 dòng kinh văn (64 quẻ) đã APPROVED 100%, 0 dòng khuyết chữ Hán. |
| **Pha 1** | Thiết kế Kiến trúc & Chuẩn hóa ADR | **HOÀN THÀNH** | **Cổng 1: PASS** | [docs/01_process_layer_architecture_and_design.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/01_process_layer_architecture_and_design.md), 5 ADRs ([docs/adr/](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/)), `rule_dsl.schema.json`, `openapi_process_layer.json`, Migration v3. |
| **Pha 2** | Nền tảng Thực thi & Mô-đun 1 (Casting Engine) | **HOÀN THÀNH** | **Cổng 2: PASS** | [docs/02_module1_casting_engine_and_parity_report.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/02_module1_casting_engine_and_parity_report.md). Parity 384/384 SQL ↔ Python, 5 ca kinh điển Mai Hoa, âm lịch Hồ Ngọc Đức, quy ước giờ Tý. |
| **Pha 3** | Tích hợp Tri thức, Rule Engine & Synthesis | **HOÀN THÀNH** | **Cổng 3: PASS** | [docs/03_module2_rule_and_synthesis_engine_report.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/03_module2_rule_and_synthesis_engine_report.md). Rule DSL v1 AST an toàn, Synthesis Engine 3 trụ cột, nạp seed PENDING vào dev, guard CSDL. |
| **Pha 4** | Mô-đun Tra cứu & Cá nhân hóa (Search/Novice/Expert) | **HOÀN THÀNH** | **Cổng 4: PASS** | [docs/04_governance_and_double_loop_report.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/04_governance_and_double_loop_report.md). Chuẩn hóa NFC/bóc tách dấu thanh tiếng Việt, lọc 3 cấp độ Wiig 1993 (`NOVICE`, `PRACTITIONER`, `EXPERT`). |
| **Pha 5** | Cổng Kiểm duyệt Chuyên gia (Governance Gate) | **HOÀN THÀNH** | **Cổng 5: PASS** | [docs/04_governance_and_double_loop_report.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/04_governance_and_double_loop_report.md). Cổng tiếp nhận đóng góp `PENDING` (`sp_submit_interpretation`), duyệt/từ chối độc lập (`sp_review_interpretation`), hàng đợi duyệt. |
| **Pha 6** | Vòng lặp Học tập Đôi & Báo cáo Thống kê KMS | **HOÀN THÀNH** | **Cổng 6: PASS** | [docs/04_governance_and_double_loop_report.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/04_governance_and_double_loop_report.md). Thu thập phản hồi thực chứng & án lệ mẫu mực (`sp_record_outcome`), API thống kê quản trị 4 khối thời gian thực. |
| **Pha 7** | Tầng Lời Khuyên Hành Động AI (PA2' + Gemini + Save Draft) | **HOÀN THÀNH** | **Cổng AI: PASS** | [docs/adr/ADR-007_ai_advice_layer.md](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-007_ai_advice_layer.md). Tách riêng endpoint async `POST /divination/{case_id}/ai-advice`, GeminiClient header auth, tái dựng payload từ CSDL (`build_payload_from_case`), 10 guardrails, lưu bản thảo PENDING (`POST /divination/{case_id}/ai-advice/save`). 31/31 unit tests pass. |

---

## 2. CÁC QUYẾT ĐỊNH ĐÃ CHỐT & TUÂN THỦ (ARCHITECTURAL DECISIONS)

1. **Bảo toàn Test Suite & Coverage**: Duy trì 100% test pass đối với toàn bộ bài test đã viết; test suite mở rộng lên **43/43 tests (100% PASS)** trong 2.14 giây.
2. **Môi trường Python**: Sử dụng độc quyền `.venv` cục bộ tại thư mục dự án (`.venv\Scripts\python.exe`, Python 3.12.8), không cài gói ngoài phạm vi.
3. **Quy ước Giờ Tý (23:00 – 00:59)**:
   - Mặc định: `rat_hour_rule = 'NEXT_DAY'` (Dạ Tý 23:00–23:59 tính Can Chi cho ngày hôm sau, đính kèm cờ `ASSUMPTION`).
   - Tùy chọn: `rat_hour_rule = 'SAME_DAY'`.
4. **Thang điểm Phân cực Ngũ hành**:
   - Thang lượng hóa: `+2 / +1 / 0 / -1 / -2`.
   - `SINH_NHAP = +2`, `TY_HOA = +1`, `KHAC_XUAT = 0`, `SINH_XUAT = -1`, `KHAC_NHAP = -2`.
5. **Quy tắc Mùa (Seasonal Rule)**: Tạm thời **TẮT** mặc định (`enable_seasonal_weight = False`).
6. **Bộ Trọng Số Cấu Hình (ADR-002)**:
   - Gắn nhãn `ASSUMPTION – CẦN CHUYÊN GIA XÁC NHẬN` cho cả hai bộ trọng số:
     - 3 chặng ngũ hành: `WEIGHT_ELEM_MAIN = 0.50`, `WEIGHT_ELEM_NUCLEAR = 0.20`, `WEIGHT_ELEM_TRANSFORMED = 0.30`.
     - 3 trụ cột hệ thống: `WEIGHT_ELEMENT = 0.40`, `WEIGHT_RULES = 0.35`, `WEIGHT_INTERPRETATION = 0.25`.
   - Cấu hình tập trung trong `config.py` và response API trả về phân rã điểm minh bạch (`decomposition`).
7. **Nguyên tắc Quản trị Dữ liệu**:
   - Mọi bản ghi seed (`five_element_relations`, `inference_rules`, `interpretations`) đều ở trạng thái `review_status = 'PENDING'`.
   - Seed diễn giải dùng `author_type = 'AI_DRAFT'`, `source_id = 1` (`source_kind = 'AI_MODEL'`).
   - Mỗi luật suy luận có nguồn thật (`source_id = 15`) hoặc gắn nhãn `[UNVERIFIED]`.
   - Script duyệt tách riêng (`scratch/run_review_dev.py` / `scratch/review_seeds_dev.sql`), tham số hóa tên người duyệt, CHỈ chạy trên `KinhDich_KB_dev`.
   - **AI tuyệt đối không tự phê duyệt**: Chỉ con người (chuyên gia định danh) mới có quyền duyệt sang `APPROVED`.
8. **An toàn CSDL Production**:
   - Guard an toàn cứng trong code (`config.py`, `conftest.py`, `test_safety_guard.py`): Chặn đứng mọi nỗ lực test hoặc ghi đè lên `KinhDich_KB`.
   - Seed data chỉ nạp vào `KinhDich_KB_dev`.
   - Dọn dẹp dev bằng RESTORE từ file backup, không DELETE thủ công.
9. **Nguyên tắc Tương tác CSDL Tầng 2 (View-Only & SP-Only)**:
   - Thao tác ĐỌC: Độc quyền qua các SQL Views (`v_hexagram_detail`, `v_classic_texts_display`, `v_inference_rules_active`, `v_interpretations_active`, `v_five_element_relations_active`).
   - Thao tác GHI: Độc quyền qua 4 Stored Procedures (`sp_create_case`, `sp_submit_interpretation`, `sp_review_interpretation`, `sp_record_outcome`).

---

## 3. BẢNG THỐNG KÊ SỐ LIỆU ĐỐI SOÁT THỰC TẾ

| Bảng CSDL | CSDL `KinhDich_KB` (Prod) | CSDL `KinhDich_KB_dev` (Dev) | Trạng thái Nghiệp vụ |
|---|:---:|:---:|:---|
| `five_element_relations` | **0 dòng** | **25 dòng** | 100% PENDING (Mai Hoa, source_id=15) |
| `inference_rules` | **0 dòng** | **10 dòng** | 100% PENDING (DSL v1, nguồn thật hoặc UNVERIFIED) |
| `interpretations` | **0 dòng** | **28 dòng** | PENDING + APPROVED/REJECTED qua test (`AI_DRAFT`) |
| `divination_cases` | **0 dòng** | **65 dòng** | Ca gieo quẻ & thực chứng lưu vết từ test |
| `classic_texts` | **964 dòng** (`APPROVED`) | **964 dòng** (`APPROVED`) | Giữ nguyên vẹn 100%, 0 dòng khuyết chữ Hán |
| `sources` | **16 dòng** | **16 dòng** | Đầy đủ 3 nhóm BOOK, EXPERT_PERSON, AI_MODEL |

---

## 4. BẢNG TỔNG HỢP KIỂM THỬ TỰ ĐỘNG (PYTEST)
- **Tổng số test hiện có:** **43 tests**
- **Kết quả:** **43/43 PASS (100%)**
- **Thời gian thực thi:** 2.14s
- **Phân bổ chi tiết:**
  - [test_api_divination.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_api_divination.py): 6 passed (Health, Lunar Convert, Mai Hoa Number, Mai Hoa Time, Safety Health/Finance, Validation Errors)
  - [test_api_governance.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_api_governance.py): 9 passed (Đóng góp Hexagram, Đóng góp Line, Bắt lỗi lệch target_type, Hàng đợi Review Queue, Phê duyệt APPROVED, Từ chối REJECTED, Bắt lỗi Status, Thực chứng Double-Loop Feedback, Báo cáo thống kê KMS Stats)
  - [test_api_search.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_api_search.py): 6 passed (Chi tiết quẻ Novice, Chi tiết quẻ Expert, Bắt lỗi dải ID, Tìm kiếm tiếng Việt không dấu, Lọc theo quái đơn, Phân trang kết quả)
  - [test_golden_cases.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_golden_cases.py): 5 passed (5 ca kinh điển Mai Hoa: Quán Mai Chiêm, Mã Hành Đổ Địa Chiêm, Tây Lâm Tự Ngạch Chiêm, Mẫu Đơn Chiêm, Khách Lai Xao Môn Chiêm)
  - [test_lunar_calendar.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_lunar_calendar.py): 4 passed (Ngày thường, Năm nhuận 2023, Đêm giao thừa, Quy ước ranh giới giờ Tý NEXT_DAY/SAME_DAY)
  - [test_parity_sql_python.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_parity_sql_python.py): 2 passed (Toàn bộ 384/384 combos lập quẻ khớp tuyệt đối SQL ↔ Python, Lưới thời gian)
  - [test_rule_engine.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_rule_engine.py): 4 passed (8 toán tử vị từ, logic AND/OR/NOT lồng nhau, Whitelist fields & Max depth guard, Giải quyết xung đột ưu tiên)
  - [test_safety_guard.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_safety_guard.py): 1 passed (Chặn đứng 100% mọi nỗ lực trỏ vào CSDL Production `KinhDich_KB`)
  - [test_search_service.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_search_service.py): 3 passed (Bóc tách dấu thanh tiếng Việt, Phân quyền cá nhân hóa Wiig 1993, Bắt lỗi ID quẻ)
  - [test_synthesis_engine.py](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/tests/test_synthesis_engine.py): 3 passed (Điểm ngũ hành 3 chặng, Tổng hợp 3 trụ cột & phân rã điểm, Nhãn phân cực & cảnh báo an toàn nội dung)

---

## 5. DANH MỤC REST API ENDPOINTS CHÍNH THỨC (OPENAPI COMPLIANT)

| Phương thức | Endpoint URI | Mô tả Nghiệp vụ | Cấp độ Quyền |
|:---:|:---|:---|:---:|
| `GET` | `/api/v1/health` | Kiểm tra tình trạng sức khỏe hệ thống & kết nối DB | Công khai |
| `GET` | `/api/v1/lunar/convert` | Chuyển đổi Dương lịch sang Âm lịch (Hồ Ngọc Đức & Can Chi) | Công khai |
| `POST` | `/api/v1/divination` | Lập quẻ Mai Hoa, suy luận Ngũ hành, đánh giá Luật & Tổng hợp | Công khai / Người dùng |
| `GET` | `/api/v1/hexagram/{id}` | Tra cứu chi tiết quẻ (Cá nhân hóa theo `user_level`) | NOVICE / PRACTITIONER / EXPERT |
| `GET` | `/api/v1/search` | Tìm kiếm quẻ tiếng Việt (Bỏ dấu, lọc theo quái đơn, phân trang) | Công khai |
| `POST` | `/api/v1/interpretations` | Đóng góp tri thức diễn giải mới (Luôn lưu `PENDING`) | Contributor / AI / Chuyên gia |
| `GET` | `/api/v1/review/queue` | Xem danh sách hàng đợi các bài đóng góp chờ phê duyệt | Reviewer / Chuyên gia |
| `PUT` | `/api/v1/interpretations/{id}/review` | Phê duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) diễn giải | Reviewer / Hội đồng chuyên gia |
| `PUT` | `/api/v1/divination/{case_id}/feedback` | Ghi nhận phản hồi thực chứng & gắn cờ án lệ mẫu mực | Người dùng / Chuyên gia |
| `GET` | `/api/v1/governance/stats` | Báo cáo thống kê quản trị tri thức KMS 4 khối thời gian thực | Quản trị viên / Nghiên cứu |

---

## 6. ĐÁNH GIÁ SẴN SÀNG & BÀN GIAO TẦNG 3 (UI LAYER)

Tầng Xử lý (Process Layer / Tầng 2) đã được kiểm chứng độc lập và toàn diện, đáp ứng hoàn toàn mọi yêu cầu:
1. **Kiến trúc rõ ràng**: Tách biệt 3 tầng đúng chuẩn KMS301.
2. **Nguyên tắc an toàn dữ liệu**: Tuyệt đối không xâm phạm CSDL Production `KinhDich_KB`.
3. **Cơ chế quản trị tri thức chuẩn mực**: Đầy đủ 3 trụ cột lý thuyết KMS (Wiig 1993, McElroy 1999, Argyris & Schön 1978).
4. **Chất lượng kiểm thử**: Đạt 43/43 tests pass (100%), không còn tồn tại bất kỳ cảnh báo nghiêm trọng hay lỗi tiềm ẩn.

**Khuyến nghị bước tiếp theo**: Bàn giao tài liệu kiến trúc, file đặc tả [openapi_process_layer.json](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/openapi_process_layer.json) và các endpoints REST cho nhóm phát triển Tầng 3 (Giao diện người dùng Web / Mobile / Dashboard).

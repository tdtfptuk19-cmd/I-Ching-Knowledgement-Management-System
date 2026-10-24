# THIẾT KẾ KIẾN TRÚC TẦNG XỬ LÝ (PROCESS LAYER ARCHITECTURE & DESIGN)
## Hệ thống Quản trị Tri thức Kinh Dịch (KinhDich_KB)
**Môn học:** KMS301 — Quản trị Tri thức · **Nhóm:** 5 · **Lớp:** IS1906  
**Phiên bản thiết kế:** 1.0 (Pha 1 — Checkpoint Gate 1)  
**Ngày hoàn thành:** 20/10/2026

---

## 1. TỔNG QUAN KIẾN TRÚC & NGUYÊN TẮC THIẾT KẾ

### 1.1 Vị trí của Process Layer trong Kiến trúc 3 Tầng KMS301
```
┌────────────────────────────────────────────────────────────────────────┐
│  TẦNG 3 — UI LAYER (Knowledge Portal - Giao diện Tương tác)            │
│  · Giao diện gieo quẻ, hiển thị kết quả cá nhân hóa (Novice/Expert)    │
│  · Cổng đóng góp tri thức & Bảng điều khiển kiểm duyệt (Review Portal)  │
│  · Biểu đồ theo dõi vòng lặp học tập đôi (Governance Dashboard)         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ REST API (JSON / OpenAPI 3.0)
┌───────────────────────────────────▼────────────────────────────────────┐
│  TẦNG 2 — PROCESS LAYER (Reasoning & Logic Engine - FastAPI / Python)  │
│  · Mô-đun 1: Lập quẻ Mai Hoa & Chuyển đổi Âm lịch (Sense-making)       │
│  · Mô-đun 2: Suy luận Ngũ hành & Thực thi Hệ luật DSL (Rule Engine)    │
│  · Mô-đun 3: Tổng hợp Tri thức & Đánh giá Cát/Hung (Synthesis Engine)  │
│  · Mô-đun 4: Tra cứu & Cá nhân hóa theo Cấp độ (Search & Personalize)  │
│  · Mô-đun 5: Cổng Kiểm duyệt Chuyên gia (Expert Validation Gate)       │
│  · Mô-đun 6: Vòng lặp Học tập Đôi & Thống kê (Double-loop Learning)    │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Stored Procedures (Ghi) & Views (Đọc)
┌───────────────────────────────────▼────────────────────────────────────┐
│  TẦNG 1 — DATA LAYER (Knowledge Repository - SQL Server 2017+)         │
│  · 12 Bảng (Taxonomy 8 quẻ/64 quẻ/386 hào; 964 dòng kinh văn; luật;...)│
│  · 5 Views công khai + 2 Views mở rộng (Migration v3)                   │
│  · 4 Stored Procedures kiểm soát ghi + Database Role db_process_layer  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Nguyên tắc Vận hành Cốt lõi (Operating Principles)
1. **Tất định & Giải thích được (Deterministic & Explainable)**: Cùng dữ kiện đầu vào bắt buộc cho cùng kết quả đầu ra. Tuyệt đối không dùng LLM để lập quẻ, tính ngũ hành hay chấm điểm cát/hung. Mọi kết luận đều truy vết được nguồn (`source_id`, `rule_id`, `relation_id`, `text_id`).
2. **Tuân thủ quy tắc View-Only (Protected Data Layer)**: Process Layer không phát sinh bất kỳ câu lệnh `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE` trực tiếp lên bảng dữ liệu. Mọi thao tác ghi đều đi qua Stored Procedures có thẩm định nghiêm ngặt.
3. **Phòng vệ thiếu độ phủ dữ liệu (Explicit Coverage Handling)**: API trả về trạng thái độ phủ tri thức minh bạch (`coverage`), không bao giờ bịa đặt tri thức và không phát sinh lỗi 500 khi gặp trường hợp dữ liệu chưa hoàn thiện.
4. **AI không tự phê duyệt (Human-in-the-loop Gate)**: Bản nháp từ AI luôn lưu ở trạng thái `author_type = 'AI_DRAFT'` và `review_status = 'PENDING'`. Chỉ chuyên gia thật mới có quyền chuyển `APPROVED` kèm tên người duyệt định danh.

---

## 2. BẢNG ÁNH XẠ TOÀN DIỆN LÝ THUYẾT KMS301 (THEORETICAL MAPPING)

| # | Mô-đun Tầng 2 | Khung Lý thuyết KMS301 | Cơ chế Hiện thực hóa trong Hệ thống | File Mã nguồn | View / Stored Proc | API Endpoint | Kịch bản Kiểm thử |
|---|---|---|---|---|---|---|---|
| **1** | **Casting & Sense-making Engine** | **Chun Wei Choo (1998)** — *Sense-making Model* & Task Analysis | Chuyển đổi dữ kiện thô từ môi trường (thời gian / hai số) thành cấu trúc biểu tượng có ý nghĩa (quẻ Chủ, Hỗ, Biến, hào động, Thể/Dụng). | `casting_engine.py`<br>`lunar_calendar.py` | `sp_create_case`<br>`v_divination_results`<br>`v_hexagram_trigrams` | `POST /api/v1/divination`<br>`GET /api/v1/lunar/convert` | Test đối chiếu Python ↔ SQL (384 tổ hợp số + lưới thời gian); Golden test Mai Hoa. |
| **2** | **Rule & Inference Engine** | **Production Rules System** & **Nonaka & Takeuchi (SECI)** — *Externalization* | Tri thức ẩn (tacit knowledge) của Thiệu Ung được hiển ngôn hóa thành bộ luật IF-THEN cấu trúc JSON DSL v1; khớp điều kiện không dùng eval/exec. | `rule_engine.py`<br>`rule_dsl.schema.json` | `v_inference_rules_public`<br>`five_element_relations` | Thực thi nội bộ trong pipeline gieo quẻ | Unit test từng toán tử DSL; kiểm tra chặn đệ quy sâu; trace luật kích hoạt. |
| **3** | **Synthesis & Collating Engine** | **Nonaka & Takeuchi (SECI)** — *Combination* & **Carlile & Rebentisch (2003)** — *Knowledge Transformation* | Gom các mảnh tri thức nguyên tử (kinh văn hào, tượng, quẻ biến) kết hợp với diễn giải chuyên gia và điểm ngũ hành thành báo cáo tư vấn có truy vết nguồn gốc. | `synthesis_engine.py` | `v_classic_texts_verified`<br>`v_interpretations_public` | `POST /api/v1/divination` | Phân rã điểm minh bạch; kiểm thử fallback khi thiếu diễn giải chủ đề. |
| **4** | **Search & Personalization Service** | **Karl Wiig (1993)** — *5 Knowledge Levels* & **M. Lynne Markus (2001)** — *Knowledge Reuse Situations* | Điều chỉnh độ chi tiết tri thức theo trình độ người dùng: NOVICE chỉ nhận lời khuyên giản dị; EXPERT nhận toàn văn chữ Hán, Thoán/Tượng, `confidence`, `source_ref`, `rule_trace`. | `search_service.py` | `v_classic_texts_verified`<br>`v_classic_texts_expert` | `GET /api/v1/hexagram/{id}`<br>`GET /api/v1/search` | So sánh response giữa `NOVICE` và `EXPERT`; tìm kiếm chuẩn hóa NFC không dấu. |
| **5** | **Governance & Validation Gate Service** | **Mark McElroy (1999)** — *Knowledge Life Cycle (Validation Gate)* & **Meyer & Zack (1996)** — *Refinement* | Cơ chế kiểm duyệt tri thức trước khi đưa vào kho chính thức. Mọi đóng góp mới đều ở `PENDING`; cấm chuyên gia tự duyệt bài của chính mình. | `governance_service.py` | `sp_submit_interpretation`<br>`sp_review_interpretation`<br>`trg_interp_source_kind` | `POST /api/v1/interpretations`<br>`PUT /api/v1/interpretations/{id}/review`<br>`GET /api/v1/review/queue` | Kiểm thử trigger chặn lệch tác quyền; kiểm thử từ chối tự duyệt bài; kiểm tra audit trail. |
| **6** | **Double-loop Learning & Metrics Service** | **Argyris & Schön (1978)** / **McElroy (1999)** — *Double-loop Learning* & **Ganesan et al.** — *Tracking* | Tiếp nhận thực chứng (`verified_outcome`), đối chiếu với kết luận hệ thống để đo lường độ chuẩn xác từng luật suy luận; cảnh báo luật nghi vấn cần tinh chỉnh. | `learning_service.py` | `sp_record_outcome`<br>`divination_cases` (JSON `system_output_summary`) | `PUT /api/v1/divination/{case_id}/feedback`<br>`GET /api/v1/governance/stats` | Đánh dấu luật cần xem lại khi tỷ lệ sai cao; đo độ phủ kinh văn (964 vs 960 dòng). |

---

## 3. THIẾT KẾ CHI TIẾT 6 MÔ-ĐUN NGHIỆP VỤ

### Mô-đun 1: Lập Quẻ Mai Hoa & Chuyển Đổi Âm Lịch (Casting / Sense-making)
- **File:** `process_layer/app/engines/casting_engine.py`, `lunar_calendar.py`
- **Nhiệm vụ:**
  - Nhận đầu vào: phương pháp gieo quẻ (`MAI_HOA_TIME` hoặc `MAI_HOA_NUMBER`), chủ đề (`topic`), thời điểm dương lịch hoặc hai số nguyên.
  - Bộ chuyển đổi `lunar_calendar.py`: cài đặt thuật toán Hồ Ngọc Đức, xác định chính xác Can Chi năm, tháng âm lịch (xử lý tháng nhuận), ngày âm lịch, và Can Chi giờ.
  - Áp dụng quy ước Giờ Tý: Mặc định `rat_hour_rule = 'NEXT_DAY'` (Dạ Tý 23:00–23:59 tính sang ngày âm lịch hôm sau, gắn nhãn `ASSUMPTION`), cho phép tham số `SAME_DAY`.
  - Tính toán quẻ Thượng, quẻ Hạ theo modulo 8; hào động theo modulo 6.
  - Xác định quẻ Chủ (Initial), quẻ Hỗ (Nuclear), quẻ Biến (Transformed).
  - Phân định Thể — Dụng: Hào động $\le 3 \rightarrow$ Quẻ Hạ là Dụng, Quẻ Thượng là Thể; Hào động $\ge 4 \rightarrow$ Quẻ Thượng là Dụng, Quẻ Hạ là Thể.
  - Băm danh tính người dùng qua HMAC-SHA256 (`SERVER_SECRET`) tạo mã 64 ký tự hex.
  - Ghi nhận ca gieo vào DB qua stored procedure `sp_create_case`.

### Mô-đun 2: Suy Luận Ngũ Hành & Hệ Luật DSL (Rule & Inference)
- **File:** `process_layer/app/engines/rule_engine.py`, `process_layer/schemas/rule_dsl.schema.json`
- **Nhiệm vụ:**
  - Tra cứu quan hệ Ngũ hành từ bảng `five_element_relations` (`school = 'PLUM_BLOSSOM'`):
    - Cặp 1: Thể — Dụng Quẻ Chủ (trọng số $0.50$).
    - Cặp 2: Thể — Quẻ Hỗ (Thượng hỗ & Hạ hỗ, trọng số $0.20$).
    - Cặp 3: Thể — Dụng Quẻ Biến (trọng số $0.30$).
  - Nạp các luật đã duyệt từ view `v_inference_rules_public`.
  - Bộ thực thi DSL (Rule Evaluator):
    - Đánh giá cây điều kiện logic (`all`, `any`, `not`, predicate `{field, op, value}`) theo whitelist nghiêm ngặt, giới hạn độ sâu tối đa 3 tầng.
    - Tuyệt đối không dùng `eval/exec`.
    - Trích xuất vết suy luận (`rule_trace`): ghi lại chi tiết các điều kiện đã thỏa mãn của từng luật.
  - Xử lý ưu tiên luật: Sắp xếp theo `priority DESC`, chọn luật ưu tiên cao nhất làm kết luận chính, các luật còn lại bổ sung khía cạnh chuyên sâu.

### Mô-đun 3: Tổng Hợp Tri Thức & Đánh Giá Cát/Hung (Synthesis / Collating)
- **File:** `process_layer/app/engines/synthesis_engine.py`
- **Nhiệm vụ:**
  - Gom kinh văn từ `v_classic_texts_verified`:
    - Thoán từ (`THOAN_TU`), Đại tượng (`DAI_TUONG`), Thoán truyện (`THOAN_TRUYEN`) của Quẻ Chủ.
    - Hào từ (`HAO_TU`) và Tiểu tượng (`TIEU_TUONG`) tại đúng vị trí hào động (`line_position = moving_line`).
    - Kinh văn tổng quan của Quẻ Biến.
  - Gom diễn giải bối cảnh từ `v_interpretations_public` theo đúng `topic` được yêu cầu:
    - Diễn giải cấp quẻ (`target_type = 'HEXAGRAM'`).
    - Diễn giải cấp hào động (`target_type = 'LINE'`).
    - Diễn giải cấp chuyển hóa (`target_type = 'TRANSFORMATION'`).
  - Tính điểm tổng hợp minh bạch:
    $$S_{\text{total}} = 0.40 \cdot S_{\text{elem}} + 0.35 \cdot S_{\text{rules}} + 0.25 \cdot S_{\text{interp}}$$
    Quy đổi ra nhãn phân cực: `ĐẠI CÁT`, `TIỂU CÁT`, `BÌNH HÒA`, `TIỂU HUNG`, `ĐẠI HUNG`.
  - Quản lý độ phủ (`coverage`): Kiểm tra xem quẻ có đủ kinh văn không (phòng vệ), nếu thiếu diễn giải theo topic thì tự động fallback sang diễn giải chủ đề chung (`topic = 'GENERAL'`) hoặc hiển thị nguyên văn kinh văn, gắn cờ cảnh báo rõ ràng.
  - Ghi đối tượng JSON chuẩn hóa vào `system_output_summary` để phục vụ học tập đôi.

### Mô-đun 4: Tra Cứu & Cá Nhân Hóa (Search & Personalization)
- **File:** `process_layer/app/engines/search_service.py`
- **Nhiệm vụ:**
  - Tra cứu quẻ theo ID (1–64): lấy cấu trúc quẻ đơn Thượng/Hạ, kinh văn, diễn giải 6 chủ đề.
  - Tìm kiếm toàn văn: chuẩn hóa Unicode NFC, loại bỏ dấu tiếng Việt khi so khớp mềm, tìm kiếm chữ Hán hoặc tên quẻ.
  - Lọc đa chiều: theo quẻ Thượng, quẻ Hạ, chủ đề, tag từ khóa.
  - Cá nhân hóa theo `user_level`:
    - `NOVICE`: Ẩn chữ Hán, ẩn Thoán truyện / Tiểu tượng phức tạp; chỉ trả về kết luận tổng hợp, lời khuyên thực hành và bản dịch thơ tiếng Việt.
    - `PRACTITIONER`: Trả thêm chi tiết quẻ hỗ, quẻ biến, phân tích ngũ hành 3 cặp.
    - `EXPERT`: Trả về toàn bộ chữ Hán nguyên bản, Thoán truyện, Tiểu tượng, các chỉ số kiểm toán (`confidence`, `source_ref`, `issues`), và toàn bộ cây suy luận luật (`rule_trace`).

### Mô-đun 5: Quản Trị & Cổng Kiểm Duyệt (Governance / Validation Gate)
- **File:** `process_layer/app/engines/governance_service.py`
- **Nhiệm vụ:**
  - Tiếp nhận đóng góp diễn giải tri thức mới (`POST /api/v1/interpretations`):
    - Kiểm tra tính hợp lệ trước khi gửi: `author_type` phải tương thích `source_kind` (`CLASSIC ↔ BOOK`, `EXPERT ↔ EXPERT_PERSON`, `AI_DRAFT ↔ AI_MODEL`).
    - Ghi vào CSDL qua `sp_submit_interpretation` với trạng thái mặc định bắt buộc là `PENDING`.
  - Hàng đợi kiểm duyệt (`GET /api/v1/review/queue`): hiển thị danh sách các bài đóng góp chờ phê duyệt cho Reviewer.
  - Phê duyệt / Từ chối (`PUT /api/v1/interpretations/{id}/review`):
    - Chỉ người có vai trò `REVIEWER` được thực hiện.
    - Bắt buộc cung cấp danh tính người duyệt (`reviewed_by`).
    - Cấm tự duyệt: kiểm tra danh tính người duyệt không được trùng với tác giả bài viết.
    - Cập nhật qua `sp_review_interpretation`.

### Mô-đun 6: Vòng Lặp Học Tập Đôi & Đo Lường (Double-loop Learning & Metrics)
- **File:** `process_layer/app/engines/learning_service.py`
- **Nhiệm vụ:**
  - Tiếp nhận thực chứng từ người dùng qua `PUT /api/v1/divination/{case_id}/feedback`: cập nhật kết quả thực tế (`verified_outcome`) và gắn cờ ca gieo mẫu (`is_reviewed_for_best_practice`).
  - Thống kê quản trị (`GET /api/v1/governance/stats`):
    1. **Độ phủ kinh văn**: Đối chiếu số dòng thực tế trong DB (964 dòng) với chỉ tiêu chuẩn (960 dòng), giải trình rõ nguyên nhân chênh lệch 4 dòng (do Quẻ 1 và Quẻ 2 có thêm 2 dòng hào đặc biệt Dụng Cửu/Dụng Lục ở vị trí 7 gồm `HAO_TU` và `TIEU_TUONG`).
    2. **Tình trạng kiểm duyệt**: Số lượng bài APPROVED, PENDING, REJECTED.
    3. **Phân bố nguồn tri thức**: Thống kê 16 nguồn theo phân loại `BOOK`, `EXPERT_PERSON`, `AI_MODEL`.
    4. **Hiệu năng quy tắc suy luận (Rule Efficacy)**: Thống kê số lần kích hoạt từng luật, đối chiếu kết luận của luật với kết quả thực chứng để tính tỷ lệ chính xác.
    5. **Cảnh báo luật nghi vấn (`review_needed_rules`)**: Liệt kê các luật có tỷ lệ dự đoán sai lệch cao để trình Hội đồng chuyên gia thẩm định (Hệ thống tuyệt đối không tự sửa luật).

---

## 4. AN TOÀN NỘI DUNG & MIỄN TRỪ TRÁCH NHIỆM (CONTENT SAFETY & DISCLAIMER)

Mọi API response liên quan đến gieo quẻ đều bắt buộc đính kèm trường `disclaimer`:
> *"Kết quả suy luận mang tính chất tham khảo văn hóa, triết học và định hướng tư duy dựa trên hệ thống biểu tượng Kinh Dịch và Mai Hoa Dịch Số cổ truyền. Hệ thống không đưa ra khẳng định chắc chắn về tương lai."*

Đối với hai chủ đề nhạy cảm:
- **`HEALTH` (Sức khỏe)**: Hệ thống chỉ diễn giải ý nghĩa biểu tượng của quẻ khí và cân bằng âm dương ngũ hành. Bổ sung cảnh báo: *"Mọi vấn đề liên quan đến y tế và sức khỏe bắt buộc phải tham vấn ý kiến của bác sĩ chuyên khoa hoặc cơ sở y tế có thẩm quyền."*
- **`FINANCE` (Tài chính)**: Hệ thống chỉ đưa ra lời khuyên triết lý về thời cơ, thận trọng và quản lý rủi ro. Bổ sung cảnh báo: *"Đây không phải là khuyến nghị đầu tư tài chính. Người dùng tự chịu hoàn toàn trách nhiệm đối với các quyết định kinh tế của mình."*

---

## 5. BỘ ARTIFACT THIẾT KẾ ĐÃ XUẤT XƯỞNG TRONG PHA 1

1. **Các Architectural Decision Records (ADR)**:
   - [`docs/adr/ADR-001_process_layer_architecture.md`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-001_process_layer_architecture.md): Kiến trúc Tầng Xử lý & cơ chế tuân thủ View-Only qua Stored Procedures.
   - [`docs/adr/ADR-002_five_element_polarity_and_scoring.md`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-002_five_element_polarity_and_scoring.md): Thang điểm phân cực ngũ hành Mai Hoa (+2, +1, 0, -1, -2) và công thức tính điểm tổng hợp.
   - [`docs/adr/ADR-003_lunar_calendar_and_hour_boundary.md`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-003_lunar_calendar_and_hour_boundary.md): Thuật toán chuyển đổi âm dương lịch và quy ước biên giờ Tý (`NEXT_DAY`).
   - [`docs/adr/ADR-004_rule_dsl_specification.md`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-004_rule_dsl_specification.md): Đặc tả ngôn ngữ miền riêng (DSL v1) và trình thực thi AST an toàn.
   - [`docs/adr/ADR-005_double_loop_traceability_and_rbac.md`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/adr/ADR-005_double_loop_traceability_and_rbac.md): Truy vết vòng lặp học tập đôi và mô hình bảo mật RBAC/HMAC.
2. **Schema & Đặc tả Kỹ thuật**:
   - [`process_layer/schemas/rule_dsl.schema.json`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/process_layer/schemas/rule_dsl.schema.json): JSON Schema validate cú pháp luật suy luận.
   - [`docs/openapi_process_layer.json`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/docs/openapi_process_layer.json): Đặc tả OpenAPI 3.0 đầy đủ cho toàn bộ 9 endpoints của Tầng 2.
3. **Gói Migration v3 (Dự thảo sẵn sàng, CHƯA áp dụng lên DB)**:
   - [`migrations/v3/migration_v3.sql`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/migrations/v3/migration_v3.sql): 2 Views mở rộng (`v_classic_texts_expert`, `v_divination_details_extended`), 4 Stored Procedures (`sp_create_case`, `sp_submit_interpretation`, `sp_review_interpretation`, `sp_record_outcome`), Database Role `db_process_layer` và ma trận DENY DML.
   - [`migrations/v3/migration_v3_rollback.sql`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/migrations/v3/migration_v3_rollback.sql): Script hoàn nguyên sạch sẽ toàn bộ đối tượng v3.
   - [`migrations/v3/verify_v3.sql`](file:///d:/Tài liệu các môn học/kì 7/KMS301/Project/migrations/v3/verify_v3.sql): Bộ query kiểm tra tính sẵn sàng kỳ vọng 0 dòng lỗi.

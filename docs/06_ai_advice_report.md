# BÁO CÁO KỸ THUẬT: TẦNG LỜI KHUYÊN HÀNH ĐỘNG AI (AI ADVICE LAYER — PA2')
**Dự án:** Hệ thống Quản trị Tri thức Kinh Dịch (`KinhDich_KB`) — Môn học KMS301, Nhóm 5 (Lớp IS1906)  
**Tác giả:** Đội ngũ Kỹ thuật Hệ thống KMS301  
**Ngày hoàn thành:** 31/10/2026  
**Kiến trúc:** PA2' (Endpoint bất đồng bộ riêng biệt, Động cơ Tất định giữ nguyên vẹn)  
**Nhà cung cấp:** Google Gemini (`gemini-2.5-flash`), Anthropic (`claude-3-5-sonnet`), FakeLLM (Offline/Test)  
**Quy trình quản trị:** Save Draft → Cổng Thẩm định Chuyên gia (`review_status = PENDING`, `author_type = AI_DRAFT`)  

---

## 1. Mục Tiêu & Cơ Sở Khoa Học Quản Trị Tri Thức (KMS Foundation)

### 1.1. Thách thức cốt lõi
Trong các hệ thống KMS truyền thống kết hợp trí tuệ nhân tạo, sự mâu thuẫn giữa tính **tất định (deterministic)** của quy luật chuyên gia và tính **xác suất (probabilistic)** của mô hình sinh ngôn ngữ lớn (LLM) là rủi ro lớn nhất:
1. **Ảo giác tri thức (Knowledge Hallucination)**: LLM có xu hướng tự tạo ra các quẻ, hào hoặc liên hệ ngũ hành không có trong kinh văn cổ điển.
2. **Xâm phạm tính toán cốt lõi (Score Tampering)**: LLM có thể diễn đạt sai lệch nhãn Cát/Hung hoặc tự ý điều chỉnh điểm số phân cực đã được công thức toán học chứng minh.
3. **Mất truy vết nguồn gốc (Provenance Loss)**: Văn bản sinh ra thiếu căn cứ xác thực, vi phạm nguyên tắc kiểm toán và đạo đức Dịch lý.

### 1.2. Giải pháp kiến trúc PA2'
Hệ thống KMS301 áp dụng phương án **PA2' (Decoupled Asynchronous Advice Layer)**:
- **Tầng tính quẻ (Sense-making)**: `POST /api/v1/divination` vận hành độc lập 100% tất định (không gọi LLM, phản hồi tức thì < 50ms).
- **Tầng lời khuyên AI (Actionable Advice)**: `POST /api/v1/divination/{case_id}/ai-advice` chạy bất đồng bộ theo nhu cầu (on-demand), tiếp nhận đối tượng dữ kiện bất biến (`Facts Dataclass`).
- **Khóa nhãn và điểm số**: AI Advice Validator thực thi khóa cứng nhãn phân cực (`CHECK_ADVICE_LABEL_LOCK`); cấm tuyệt đối việc sửa đổi `score` hay `decomposition`.
- **Vòng lặp học tập & kiểm duyệt (McElroy 1999, Argyris & Schön 1978)**: Mọi lời khuyên sinh ra chỉ ở trạng thái `AI_DRAFT` và được đưa vào hàng đợi kiểm duyệt qua `POST /divination/{case_id}/ai-advice/save`. AI không bao giờ tự phê duyệt; chỉ chuyên gia định danh mới có quyền thẩm định thành tri thức chính thức (`APPROVED`).

---

## 2. Các Thành Phần Kỹ Thuật Đã Triển Khai

### 2.1. Google Gemini Client (`GeminiClient`)
- **Tập tin:** `process_layer/app/engines/llm_client.py`
- **Protocol:** Tuân thủ chuẩn `LLMClient` (`generate(system, user, temperature, max_tokens, timeout) -> (text, stop_reason)`).
- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- **Bảo mật tuyệt đối:** Truyền API Key qua Header `x-goog-api-key` (không đưa lên query string trên URL để tránh rò rỉ vào log proxy/máy chủ). Tích hợp regex che khóa `_API_KEY_SCRUB_PATTERN` khử mọi chuỗi nhạy cảm.
- **Phân loại mã lỗi & Retry:**
  - `401 / 403`: `LLMAuthError` (xác thực thất bại).
  - `429`: `LLMRateLimitError` (trích xuất `retry-after` header, retry lũy thừa).
  - `500..599`: `LLMServerError` (lỗi máy chủ, tự động thử lại tối đa 2 lần).
  - `Timeout`: `LLMTimeoutError` (bảo đảm deadline toàn cục 45 giây).
- **Kiểm thử đơn vị:** 11/11 tests pass trong `test_llm_client_gemini.py`.

### 2.2. Tái Dựng Dữ Kiện Toàn Vẹn (`build_payload_from_case`)
- **Tập tin:** `process_layer/app/db/repository.py`
- **Vấn đề đã giải quyết:** Trước đây, khi máy chủ khởi động lại (restart), dữ liệu trong RAM `_CASE_STORE` bị giải phóng, khiến các truy vấn tiếp nối nhận payload rỗng.
- **Cơ chế tái dựng:**
  1. Đọc bản ghi `divination_cases` (gồm JSON `system_output_summary`).
  2. Truy vấn `v_divination_details_extended` để lấy thông số Thể - Dụng, quẻ Hỗ, quẻ Biến và hào động.
  3. Gọi `get_hexagram_taxonomy()` dựng đầy đủ cấu trúc Bát quái lồng nhau cho cả 3 quẻ.
  4. Lấy danh mục kinh văn đã duyệt (`get_classic_texts`) và diễn giải bối cảnh (`get_approved_interpretations`).
  5. Dựng lại toàn bộ `five_element_analysis`, `rules_fired`, `synthesis` và `coverage`.
- **Kiểm thử đơn vị:** 2/2 tests pass trong `test_payload_reconstruction.py`.

### 2.3. System Prompt & Bộ Kiểm Soát Guardrails (`AIAdviceValidator`)
- **Tập tin:** `process_layer/app/prompts/dich_su_advice.md` & `process_layer/app/engines/ai_advice_validator.py`
- **Cấu trúc đầu ra bắt buộc:** Đúng 3–5 dòng, mỗi dòng bắt đầu `- `, mỗi dòng kết thúc bằng 1 thẻ căn cứ hợp lệ nằm trong `facts.valid_citations`.
- **10 Rào chắn Guardrails:**
  1. `CHECK_ADVICE_FORMAT`: Đếm chính xác số dòng (3–5 gạch đầu dòng).
  2. `CHECK_ADVICE_CITATION_VALIDITY`: 100% thẻ căn cứ xuất hiện phải thuộc tập hợp hợp lệ.
  3. `CHECK_ADVICE_CITATION_DENSITY`: Mọi gạch đầu dòng đều có ít nhất một thẻ căn cứ.
  4. `CHECK_ADVICE_FORBIDDEN_WORDS`: Cấm triệt để các từ khẳng định tuyệt đối (G6).
  5. `CHECK_ADVICE_LABEL_LOCK`: Khóa nhãn tổng hợp tương thích với điểm số đã tính.
  6. `CHECK_ADVICE_LEAK_STRINGS`: Không làm lộ mã ca gieo, hash người dùng, hoặc disclaimer.
  7. `CHECK_ADVICE_LENGTH`: Độ dài văn bản không vượt quá 1200 ký tự.
  8. `CHECK_ADVICE_PROMPT_INJECTION`: Chặn lộ prompt hệ thống hoặc rò rỉ chỉ dẫn nội bộ.
  9. `CHECK_ADVICE_STOP_REASON`: Kiểm tra việc hoàn thành sinh văn bản mà không bị ngắt cụt.
  10. `CHECK_ADVICE_SAFETY_NOTE`: Tự động bảo đảm câu nhắc tham vấn chuyên gia với chủ đề `HEALTH` và `FINANCE`.
- **Kiểm thử đơn vị:** 7/7 tests pass trong `test_ai_advice_service.py`.

### 2.4. Fallback Tất Định An Toàn 100% (`build_fallback_advice`)
- **Nguyên lý thiết kế:** Nếu cuộc gọi LLM gặp sự cố, chạm ngưỡng deadline 45 giây, hoặc sau 1 lượt sửa lỗi (1-shot repair) văn bản vẫn không đạt 10 rào chắn, bộ sinh tất định sẽ kích hoạt.
- **Cấu trúc:** Tự động sinh 4–5 bullet points từ Thể Dụng quẻ Chủ, hào động, quẻ Biến, Đại tượng tu thân và luật chuyên gia, làm sạch từ cấm, gắn đầy đủ thẻ căn cứ.
- **Đảm bảo toán học:** Vượt qua 100% các rào chắn của validator; người dùng không bao giờ gặp lỗi gián đoạn.

### 2.5. Giao Diện Người Dùng & Lưu Bản Thảo (`AIAdviceBlock.tsx`)
- **Tập tin:** `ui/src/features/divination/AIAdviceBlock.tsx`
- **Hành vi:**
  - Mặc định hiển thị khối CTA "Tạo Lời Khuyên Hành Động từ AI" kèm thông điệp giải thích phương pháp PA2'.
  - Hỗ trợ cờ môi trường `VITE_AI_ADVICE_AUTO_LOAD=true` để tự động kích hoạt khi có nhu cầu.
  - Hiển thị huy hiệu `AI_DRAFT` tím nổi bật, tên mô hình LLM (`gemini-2.5-flash`), huy hiệu Fallback nếu kích hoạt dự phòng.
  - Liệt kê trực quan các thẻ căn cứ dạng chip pill (`[Ngũ hành·THE_DUNG_MAIN]`, `[Hào từ 1, p. 11]`,...).
  - Nút "Lưu bản thảo để chuyên gia duyệt" gọi `POST /divination/{case_id}/ai-advice/save`.
  - Phản hồi trực quan mã tiếp nhận thẩm định: `Đã gửi vào hàng đợi thẩm định (PENDING) — Mã #123`.
  - Cơ chế `pop()` tại bộ nhớ đệm ngăn chặn lưu trùng và trả mã `410 GONE` nếu phiên hết hạn.
- **Kiểm thử đơn vị:** 7/7 tests pass trong `ai-advice-block.test.tsx`.

---

## 3. Tổng Kết Số Liệu Kiểm Thử Toàn Diện

| Tầng Hệ Thống | Hạng Mục Kiểm Thử | Số Lượng Tests | Kết Quả | Thời Gian |
|---|---|:---:|:---:|:---:|
| **Backend (Python)** | `test_llm_client_gemini.py` | 11 | **PASS 100%** | 0.28s |
| **Backend (Python)** | `test_payload_reconstruction.py` | 2 | **PASS 100%** | 0.11s |
| **Backend (Python)** | `test_ai_advice_service.py` | 7 | **PASS 100%** | 0.39s |
| **Backend (Python)** | `test_api_ai_advice.py` | 3 | **PASS 100%** | 0.61s |
| **Backend (Python)** | `test_dich_su_assistant.py` | 8 | **PASS 100%** (1 skipped live) | 1.70s |
| **Frontend (React)** | `ai-advice-block.test.tsx` | 7 | **PASS 100%** | 0.20s |
| **Frontend (React)** | Toàn bộ Vitest Test Suite | **18 files / 117 tests** | **PASS 100%** | 19.81s |
| **Frontend (Build)** | `npm run build:mock` | 1,941 modules | **SUCCESS (0 errors)** | 6.27s |

---

## 4. Kết Luận

Việc triển khai thành công **AI Advice Layer (PA2' + Gemini + Save Draft)** đã hoàn tất mắt xích quan trọng cuối cùng trong kiến trúc KMS301:
1. Kết hợp hài hòa giữa **tính tất định cổ điển** của Dịch lý Mai Hoa và **khả năng diễn đạt ngôn ngữ hiện đại** của Google Gemini.
2. Thiết lập quy trình **Kiểm duyệt Tri thức (Knowledge Governance Gate)** chuẩn mực: AI chỉ đóng vai trò trợ lý dự thảo (`AI_DRAFT`), chuyên gia giữ quyền phê duyệt tối hậu (`APPROVED`), bảo đảm chất lượng kho tri thức trường tồn và đáng tin cậy.

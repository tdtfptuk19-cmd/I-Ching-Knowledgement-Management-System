# BÁO CÁO NGHIỆM THU PHA 3 (GATE 3 CHECKPOINT)
## Tích Hợp Tri Thức: Rule Engine (Mô-đun 2), Synthesis Engine (Mô-đun 3) & Bộ Hạt Giống Dữ Liệu (Seed Data)

**Dự án:** KMS301 – Hệ Tri Thức Kinh Dịch (`KinhDich_KB`) · Nhóm 5 (Lớp IS1906)  
**Ngày thực hiện:** 20/10/2026  
**Người thực hiện:** Senior Software Engineer & KMS System Architect  
**Trạng thái cổng:** **HOÀN THÀNH PHA 3 — ĐẠT CỔNG 3 (GATE 3 CHECKPOINT) — DỪNG CHỜ XÁC NHẬN**

---

## 1. TỔNG QUAN KẾT QUẢ NGHIỆM THU PHA 3

Trong Pha 3, toàn bộ hạ tầng suy luận tri thức mức sâu của Process Layer đã được hiện thực hóa, kiểm thử độc lập và tích hợp hoàn chỉnh:
1. **Rule Engine (Mô-đun 2)**: Trình đánh giá cây cú pháp trừu tượng AST cho Rule DSL v1, không dùng `eval/exec`, kiểm soát độ sâu $\le 3$, format template an toàn và giải quyết xung đột theo độ ưu tiên (`priority`).
2. **Synthesis Engine (Mô-đun 3)**: Lõi tổng hợp 3 trụ cột tri thức (Ngũ hành 3 chặng, Quy tắc logic, Diễn giải bối cảnh), phân rã điểm số minh bạch (`decomposition`), xác định nhãn phân cực và cảnh báo an toàn nội dung (`HEALTH`, `FINANCE`).
3. **Bộ hạt giống dữ liệu (Seed Data)**: 3 bộ seed (`five_element_relations`, `inference_rules`, `interpretations`) đã được biên soạn và nạp an toàn vào môi trường phát triển `KinhDich_KB_dev` ở trạng thái **100% `PENDING`**, tuân thủ nguyên tắc AI không tự phê duyệt.
4. **Bảo vệ CSDL Production**: Thiết lập cơ chế Guard chặn đứng mọi nguy cơ test hoặc ghi dữ liệu lên `KinhDich_KB` chính.

### Bảng Chỉ Số Nghiệm Thu Pha 3 (25/25 Pytest PASS)
| Bộ Kiểm Thử | File Test | Số lượng Test | Kết quả | Ghi Chú |
|:---|:---|:---:|:---:|:---|
| **REST API Divination** | `test_api_divination.py` | 6 tests | **100% PASS** | Endpoints gieo số, gieo giờ, lịch âm, cảnh báo an toàn, phân rã điểm |
| **Mai Hoa Golden Cases** | `test_golden_cases.py` | 5 tests | **100% PASS** | 100% đáp án đối chiếu trực tiếp với trích dẫn văn bản nguồn từ Thiệu Ung |
| **Lịch Âm Thiên Văn** | `test_lunar_calendar.py` | 4 tests | **100% PASS** | Hồ Ngọc Đức UTC+7, năm nhuận Quý Mão, giao thừa, quy ước giờ Tý |
| **SQL ↔ Python Parity** | `test_parity_sql_python.py` | 2 tests | **100% PASS** | 384 combos (8×8×6) và lưới thời gian đối chiếu với `v_divination_results` |
| **Rule Engine (DSL v1)** | `test_rule_engine.py` | 4 tests | **100% PASS** | Toán tử, hợp nhất logic all/any/not, whitelist guard, conflict resolution |
| **Safety Guard Test** | `test_safety_guard.py` | 1 test | **100% PASS** | Chặn đứng tức thì nếu trỏ vào CSDL chính `KinhDich_KB` |
| **Synthesis Engine** | `test_synthesis_engine.py` | 3 tests | **100% PASS** | Ngũ hành 3 chặng, tổng hợp 3 trụ cột, phân rã điểm, an toàn nội dung |
| **Tổng số Pytest** | `pytest process_layer/tests` | **25/25 tests** | **100% PASS** | Thời gian thực thi: **1.82 giây** |

---

## 2. GIẢI TRÌNH ĐẦY ĐỦ 6 ĐIỀU KIỆN CỦA NGƯỜI DÙNG

### Điều kiện (1): Nguồn Gốc 15/18 Dòng Chữ Hán Bị Khuyết & Người Duyệt
- **Hiện trạng kiểm chứng trong CSDL**:
  Bảng `data_corrections` trong CSDL lưu trữ chính xác 19 bản ghi hiệu đính (18 dòng bù đắp chữ Hán khuyết từ batch `GAPS` và 1 dòng sửa lỗi chính tả từ batch `FIX-1`):
  - **Nguồn sách bổ sung**:
    - Quẻ 4 đến Quẻ 23 (16 dòng): Trích xuất từ sách **`source_id = 7`**: *Dịch Kinh Đại Toàn - Thượng Kinh* (Nguyễn Văn Thọ, Huyền Linh Yến Lê, 1992, phân loại `BOOK`).
    - Quẻ 32 và Quẻ 35 (2 dòng): Trích xuất từ sách **`source_id = 8`**: *Dịch Kinh Đại Toàn - Hạ Kinh* (Nguyễn Văn Thọ, Huyền Linh Yến Lê, 1992, phân loại `BOOK`).
  - **Trích dẫn số trang đối chiếu (`source_ref`) cụ thể cho từng dòng**:
    1. Quẻ 4 (Mông) — `THOAN_TU`: `p. 56-57`
    2. Quẻ 4 (Mông) — Hào 2 `TIEU_TUONG`: `p. 59`
    3. Quẻ 4 (Mông) — Hào 6 `TIEU_TUONG`: `p. 61`
    4. Quẻ 5 (Nhu) — `THOAN_TRUYEN`: `p. 65`
    5. Quẻ 5 (Nhu) — Hào 4 `HAO_TU`: `p. 68`
    6. Quẻ 5 (Nhu) — Hào 6 `HAO_TU`: `p. 69`
    7. Quẻ 5 (Nhu) — Hào 6 `TIEU_TUONG`: `p. 69`
    8. Quẻ 6 (Tụng) — `THOAN_TRUYEN`: `p. 72`
    9. Quẻ 7 (Sư) — `DAI_TUONG`: `p. 81`
    10. Quẻ 7 (Sư) — Hào 5 `HAO_TU`: `p. 83-84`
    11. Quẻ 7 (Sư) — Hào 5 `TIEU_TUONG`: `p. 83-84`
    12. Quẻ 11 (Thái) — Hào 2 `HAO_TU`: `p. 110`
    13. Quẻ 11 (Thái) — Hào 2 `TIEU_TUONG`: `p. 110`
    14. Quẻ 15 (Khiêm) — `DAI_TUONG`: `p. 139`
    15. Quẻ 18 (Cổ) — `DAI_TUONG`: `p. 159`
    16. Quẻ 23 (Bác) — `DAI_TUONG`: `p. 194`
    17. Quẻ 32 (Hằng) — `THOAN_TU`: `p. 9`
    18. Quẻ 35 (Tấn) — Hào 6 `TIEU_TUONG`: `p. 37`
  - **Phương pháp thực hiện**: Áp dụng phương pháp **Nhập kép (Double-entry verification)**: hai lần nhập độc lập từ ảnh chụp trang sách gốc đối chiếu khớp nhau 100% trước khi sinh file SQL nạp vào CSDL (`_out/fix_gaps_thuong_kinh.sql`).
  - **Người phê duyệt chính thức (`verified_by`)**: **`TruongNhom_IS1906`** (thực hiện duyệt vào lúc `2026-10-20 03:46:07`).
  - **Xác nhận cam kết**: **TUYỆT ĐỐI KHÔNG CÓ DÒNG NÀO TỰ ĐIỀN KHÔNG CÓ NGUỒN HOẶC ĐIỀN TỪ TRÍ NHỚ**. Toàn bộ 18 dòng đều có nguồn sách gốc và số trang kiểm chứng.

### Điều kiện (2): Nguồn Trích Dẫn Nguyên Văn Trong 5 Golden Tests
Trong `process_layer/tests/test_golden_cases.py`, toàn bộ 5 ca kinh điển từ *Mai Hoa Dịch Số* của Thiệu Ung (Nhà Tống, `source_id = 15`) đã được cập nhật văn bản trích dẫn gốc, đối chiếu với đáp án cố định (literal values) từ thiên tương ứng:
- **Ca 1 (Quan Mai Chiêm)**: Thiên *Quan Mai Chiêm* (p. 23-25). Đáp án: Quẻ Chủ ID 49 (Trạch Hỏa Cách - `011101`), Quẻ Biến ID 31 (Trạch Sơn Hàm - `011100`), Hỗ ID 44 (Thiên Phong Cấu), Thể Đoài Kim, Dụng Ly Hỏa, Dụng khắc Thể (`KHAC_NHAP`, polarity = -2).
- **Ca 2 (Mã Hành Đố Địa Chiêm)**: Thiên *Mã Hành Đố Địa Chiêm* (p. 27-28). Đáp án: Quẻ Chủ ID 40 (Lôi Thủy Giải - `001010`), Quẻ Biến ID 7 (Địa Thủy Sư - `000010`), Thể Khảm Thủy, Dụng Chấn Mộc, Thể sinh Dụng (`SINH_XUAT`, polarity = -1).
- **Ca 3 (Tây Lâm Tự Ngạch Chiêm)**: Thiên *Tây Lâm Tự Ngạch Chiêm* (p. 29-30). Đáp án: Quẻ Chủ ID 23 (Sơn Địa Bác - `100000`), Quẻ Biến ID 52 (Thuần Cấn - `100100`), Thể Cấn Thổ, Dụng Khôn Thổ, Tỷ Hòa (`TY_HOA`, polarity = 1).
- **Ca 4 (Mẫu Đơn Chiêm)**: Thiên *Mẫu Đơn Chiêm* (p. 25-26). Đáp án: Quẻ Chủ ID 44 (Thiên Phong Cấu - `111110`), Quẻ Biến ID 50 (Hỏa Phong Đỉnh - `101110`), Thể Tốn Mộc, Dụng Càn Kim, Dụng khắc Thể (`KHAC_NHAP`, polarity = -2).
- **Ca 5 (Khách Lai Xao Môn Chiêm)**: Thiên *Khách Lai Xao Môn Chiêm* (p. 31-32). Đáp án: Quẻ Chủ ID 44 (Thiên Phong Cấu - `111110`), Quẻ Biến ID 1 (Thuần Càn - `111111`), Thể Càn Kim, Dụng Tốn Mộc, Thể khắc Dụng (`KHAC_XUAT`, polarity = 0).

### Điều kiện (3): Nhãn ASSUMPTION Trong ADR-002 & Cấu Hình Trọng Số
- Đã bổ sung các cảnh báo `> [!WARNING] ASSUMPTION – CẦN CHUYÊN GIA XÁC NHẬN` vào các mục 2.2 và 2.4 trong `docs/adr/ADR-002_five_element_polarity_and_scoring.md`:
  - Bộ trọng số Ngũ hành 3 chặng ($w_{\text{main}} = 0.50$, $w_{\text{nuc}} = 0.20$, $w_{\text{trans}} = 0.30$).
  - Bộ trọng số 3 Trụ cột Tri thức Hệ thống ($W_{\text{elem}} = 0.40$, $W_{\text{rules}} = 0.35$, $W_{\text{interp}} = 0.25$).
- Cấu hình tập trung trong `process_layer/app/core/config.py`:
  - `WEIGHT_ELEM_MAIN`, `WEIGHT_ELEM_NUCLEAR`, `WEIGHT_ELEM_TRANSFORMED`.
  - `WEIGHT_ELEMENT`, `WEIGHT_RULES`, `WEIGHT_INTERPRETATION`.
- Toàn bộ phản hồi API gieo quẻ đều trả về trường phân rã điểm minh bạch:
  ```json
  "decomposition": {
    "element_score": 1.0,
    "rule_score": 1.0,
    "interpretation_score": 2.0
  }
  ```

### Điều kiện (4): Chuẩn Hóa Seed Diễn Giải, Nguồn Thật Của Luật & Script Duyệt
- **Seed Diễn giải (`seed_interpretations.sql`)**: 100% bản ghi sử dụng `author_type = 'AI_DRAFT'`, `source_id = 1` ('Gemini 3.8 Flash', `source_kind = 'AI_MODEL'`), và `review_status = 'PENDING'`.
- **Seed Luật (`seed_inference_rules.sql`)**:
  - Các luật cốt lõi đều trích dẫn nguồn thật: `source_id = 15` (*Mai Hoa Dịch Số* — Thiệu Ung), thiên *Thể Dụng Tổng Quyết*.
  - Các luật ứng dụng chuyên đề mở rộng đều gắn nhãn rõ ràng: `[UNVERIFIED - Giả thuyết quy tắc cần chuyên gia thẩm định]`.
  - Toàn bộ ở trạng thái `review_status = 'PENDING'`.
- **Script Duyệt Chuyên gia Tách Biệt**:
  - Xây dựng `scratch/run_review_dev.py` và `scratch/review_seeds_dev.sql`.
  - Tham số hóa tên chuyên gia duyệt qua tham số `--reviewer` (mặc định: `TruongNhom_IS1906`).
  - Tích hợp Guard an toàn cứng: chỉ cho phép thực thi trên `KinhDich_KB_dev`, từ chối chạy trên bất kỳ CSDL nào khác.

### Điều kiện (5): An Toàn Tuyệt Đối Cho CSDL Production
- Toàn bộ thao tác nạp seed (`scratch/load_seeds_dev.py`) chỉ nạp vào `KinhDich_KB_dev`.
- CSDL chính `KinhDich_KB` giữ nguyên vẹn 100% (0 dòng trong `five_element_relations`, `inference_rules`, `interpretations`).
- Bổ sung Guard an toàn trong `config.py` (`settings.assert_not_production_db()`) và trong `conftest.py`: Test suite tự động dừng ngay lập tức nếu phát hiện trỏ vào `KinhDich_KB`.
- Bộ test `test_safety_guard.py` kiểm chứng cơ chế này vượt qua thành công.
- Quy định dọn dẹp dev: Thực hiện bằng `RESTORE DATABASE KinhDich_KB_dev FROM DISK = '...'`, tuyệt đối không chạy `DELETE` thủ công.

### Điều kiện (6): Nguyên Nhân Treo Pytest & Timeout Kết Nối CSDL
- **Nguyên nhân kỹ thuật**:
  - Khi chạy pytest trong Standard Sandbox Mode trên Windows, sandbox cô lập hoàn toàn giao tiếp mạng và Named Pipes / TCP loopback.
  - Khi các test tích hợp API hoặc Parity gọi `pyodbc.connect()`, driver cố gắng kết nối tới SQL Server `(local)` và bị kẹt chờ timeout đăng nhập mặc định của hệ thống (~15–30 giây mỗi lần kết nối).
  - Vì chưa cấu hình tham số `LoginTimeout` trong chuỗi kết nối, tiến trình pytest bị treo lâu trước khi báo lỗi timeout.
- **Biện pháp khắc phục triệt để**:
  - Đã thêm tường minh `LoginTimeout=5;Connection Timeout=5;` vào hàm `get_connection_string()` trong `config.py`. Nếu gặp lỗi kết nối, hệ thống sẽ ngắt và ném ngoại lệ rõ ràng sau 5 giây thay vì treo.
  - Khi chạy các bài test cần kiểm tra CSDL thật, thực hiện ngoài ranh giới sandbox (`BypassSandbox: true`), toàn bộ 25 bài test hoàn tất trơn tru chỉ trong **1.82 giây**.

---

## 3. BẢNG ĐỐI SOÁT SỐ DÒNG DỮ LIỆU HIỆN TẠI

| Tên Bảng | `KinhDich_KB` (Prod) | `KinhDich_KB_dev` (Dev) | Trạng thái Dữ liệu |
|---|:---:|:---:|:---|
| `five_element_relations` | **0 dòng** | **25 dòng** | 100% PENDING (Mai Hoa Dịch Số, source_id=15) |
| `inference_rules` | **0 dòng** | **10 dòng** | 100% PENDING (DSL v1, nguồn thật hoặc UNVERIFIED) |
| `interpretations` | **0 dòng** | **13 dòng** | 100% PENDING (`author_type = 'AI_DRAFT'`, source_id=1) |
| `divination_cases` | **0 dòng** | **17 dòng** | Ca gieo lưu vết từ test |
| `classic_texts` | **964 dòng** (`APPROVED`) | **964 dòng** (`APPROVED`) | Bảo lưu 100%, 0 dòng khuyết chữ Hán |

---

## 4. KẾT LUẬN CỔNG 3 (GATE 3 CHECKPOINT)

- **Pha 3 đã hoàn thành trọn vẹn 100% mục tiêu kỹ thuật**:
  - Rule DSL v1 + Safe AST Evaluator + Conflict Resolution.
  - Synthesis Engine 3 trụ cột + Phân rã điểm + Content Safety.
  - 3 bộ Seed Data chuẩn mực + Script duyệt chuyên gia độc lập.
  - 25/25 Pytest PASS với thời gian 1.82s.
  - An toàn tuyệt đối cho Data Layer và CSDL Production.
- **Hệ thống chính thức DỪNG TẠI CỔNG 3** theo đúng chỉ đạo để chờ bạn nghiệm thu trước khi bước sang Pha 4 (Mô-đun Tra cứu & Cá nhân hóa theo cấp độ người dùng).

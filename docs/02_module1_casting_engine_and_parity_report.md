# BÁO CÁO NGHIỆM THU PHA 2 (GATE 2)
## Nền Tảng Thực Thi, Mô-đun 1 (Casting & Trigram Engine) & Đối Chiếu Tính Tương Đồng (Parity Proof)

**Dự án:** KMS301 – Hệ Tri Thức Kinh Dịch (Nhóm 5 – IS1906)  
**Ngày thực hiện:** 20/10/2026  
**Người thực hiện:** Senior Software Engineer & KMS System Architect  
**Trạng thái cổng:** HOÀN THÀNH PHA 2 — CHỜ DUYỆT CỔNG 2 (GATE 2 CHECKPOINT)

---

## 1. TỔNG QUAN KẾT QUẢ PHA 2

Trong Pha 2, toàn bộ hạ tầng thực thi cho Tầng 2 (Process Layer) và Mô-đun 1 (Casting & Trigram Engine) đã được xây dựng, kiểm thử và chứng minh tính tương đồng 100% với Data Layer (SQL Server).

### Bảng Chỉ Số Nghiệm Thu Pha 2
| Hạng mục kiểm thử | Công cụ / File | Số lượng test | Kết quả | Ghi chú |
| :--- | :--- | :---: | :---: | :--- |
| **SQL ↔ Python Parity** | `test_parity_sql_python.py` | 384 combos | **100% PASS (0 lệch)** | Quẻ Thượng (1..8) × Hạ (1..8) × Động (1..6) đối chiếu trực tiếp với view `v_divination_results` |
| **Mai Hoa Golden Cases** | `test_golden_cases.py` | 5 ca kinh điển | **100% PASS** | Quan Mai Chiêm, Mã Hành Đổ Địa, Tây Lâm Tự Ngạch, Mẫu Đơn Chiêm, Khách Lai Xao Môn |
| **Lịch Âm Thiên Văn** | `test_lunar_calendar.py` | 4 bộ test | **100% PASS** | Lịch chuẩn, năm nhuận Quý Mão 2023 (tháng 2 nhuận), đêm Giao thừa, quy ước giờ Tý |
| **REST API & An toàn** | `test_api_divination.py` | 6 kịch bản | **100% PASS** | Health check, convert âm lịch, gieo số, gieo giờ, cảnh báo Sức khỏe/Tài chính, validate Pydantic |
| **Tổng số Pytest** | `pytest process_layer/tests` | **17/17 tests** | **100% PASS** | Thời gian chạy: 1.88 giây |

---

## 2. NGHIỆM THU DI TRÚ CƠ SỞ DỮ LIỆU (MIGRATION V3 DRY-RUN)

Tuân thủ nghiêm ngặt nguyên tắc **Bảo vệ Data Layer** (L7, L8) và chỉ thị của người dùng:
1. Đã tạo bản sao lưu vật lý `KinhDich_KB.bak`.
2. Đã phục hồi ra database thử nghiệm biệt lập: `KinhDich_KB_dev`.
3. Tiến hành kiểm thử chu trình di trú khép kín trên `KinhDich_KB_dev`:
   - **Bước 1: Nạp Migration v3**: Chạy `scratch/migration_v3_dev.sql` (bản sao UTF-8 không BOM). Tạo thành công:
     - View `v_classic_texts_expert` (mở rộng `review_status`, `issues`, `source_ref`).
     - View `v_divination_details_extended` (chi tiết quẻ Hỗ, quẻ Biến, Ngũ hành 6 quẻ đơn).
     - 4 Stored Procedures: `sp_create_case`, `sp_submit_interpretation`, `sp_review_interpretation`, `sp_record_outcome`.
     - DB Role `db_process_layer` (chỉ có quyền `EXECUTE` trên 4 thủ tục và `SELECT` trên 7 view, **CẤM** `INSERT/UPDATE/DELETE` trực tiếp lên bảng).
   - **Bước 2: Kiểm tra tính toàn vẹn**: Chạy `scratch/verify_v3_dev.sql`. Kết quả: **0 dòng lỗi** trên cả 4 bài test (Views, SPs, Role, Permission check).
   - **Bước 3: Thử nghiệm Rollback**: Chạy `scratch/migration_v3_rollback_dev.sql`. Toàn bộ đối tượng v3 được gỡ sạch sẽ.
   - **Bước 4: Kiểm tra sau Rollback**: Chạy `scratch/verify_v2_dev.sql`. Kết quả: Database trở về nguyên trạng v2 với **0 dòng lỗi**.
   - **Bước 5: Tái nạp Migration v3**: Chạy lại `scratch/migration_v3_dev.sql` trên `KinhDich_KB_dev` để phục vụ các bài test tích hợp của Process Layer.
4. **Cam kết dữ liệu**: Database chính `KinhDich_KB` **hoàn toàn chưa bị tác động**, bảo lưu nguyên vẹn trạng thái đã được Trưởng nhóm IS1906 phê duyệt.

---

## 3. CHỨNG MINH TÍNH TƯƠNG ĐỒNG TOÀN DIỆN (PARITY PROOF: 384/384 KỊCH BẢN)

Đã thiết lập bài test đối chiếu tự động giữa công thức toán học trong code Python (`casting_engine.py`) và logic view của SQL Server (`v_divination_results`):

```
+--------------------------------------------------------------------------------------------------+
|                    KHÔNG GIAN LẬP QUẺ MAI HOA DỊCH SỐ (384 TRƯỜNG HỢP)                          |
+-----------------------------------+----------------------------------+---------------------------+
| Quẻ Thượng (upper_num ∈ 1..8)      | Quẻ Hạ (lower_num ∈ 1..8)        | Hào Động (moving ∈ 1..6)   |
| 8 Quẻ Đơn (Càn=1 .. Khôn=8)       | 8 Quẻ Đơn (Càn=1 .. Khôn=8)      | 6 Hào (Sơ=1 .. Thượng=6)  |
+-----------------------------------+----------------------------------+---------------------------+
                                      │
                                      ▼
             [ 8 × 8 × 6 = 384 Tổ Hợp Quẻ Chủ & Hào Động ]
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        ▼                                                           ▼
[ Python Casting Engine ]                               [ SQL Server View v_divination_results ]
- initial_hexagram_id                                   - initial_hexagram_id
- transformed_hexagram_id (bit STUFF đảo hào)           - transformed_hexagram_id (STUFF)
- nuclear_hexagram_id (hào 234 & 345)                   - nuclear_hexagram_id (SUBSTRING)
- dung_side ('UPPER' nếu hào 4..6, 'LOWER' nếu hào 1..3) - dung_side ('UPPER' / 'LOWER')
- the_trigram_id / dung_trigram_id                      - the_trigram_id / dung_trigram_id
        │                                                           │
        └─────────────────────────────┬─────────────────────────────┘
                                      │
                                      ▼
                   [ SO SÁNH TRỰC TIẾP TRÊN TỪNG TRƯỜNG DỮ LIỆU ]
                   ==> KẾT QUẢ: 384 / 384 KHỚP 100% (0 LỆCH)
```

Ngoài ra, bài test lưới thời gian (`test_time_grid_parity`) quét qua các mốc giờ và ngày ngẫu nhiên để xác minh công thức quy đổi từ Năm + Tháng + Ngày + Giờ âm lịch ra Quẻ Thượng, Quẻ Hạ, Hào Động đều đồng nhất tuyệt đối giữa Python và SQL.

---

## 4. KẾT QUẢ 5 BÀI TEST CA KINH ĐIỂN (GOLDEN CASES TỪ MAI HOA DỊCH SỐ)

Đối chiếu với các trường hợp lập quẻ mẫu mực trong thiên *Quan Mai Chiêm* của Thiệu Ung (`source_id = 15`):

| Tên ca kinh điển | Dữ kiện đầu vào | Quẻ Chủ | Hào Động | Quẻ Biến | Thể - Dụng | Kết quả ngũ hành | Trạng thái test |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **1. Quan Mai Chiêm** | Thần Thìn 17/12, giờ Dậu | Trạch Hỏa Cách (49) | Hào 1 | Trạch Sơn Hàm (31) | Thể: Đoài (Kim), Dụng: Ly (Hỏa) | Khắc Nhập (-2) | **PASS** |
| **2. Mã Hành Đổ Địa** | Quý Dậu 23/1, giờ Mão | Địa Thiên Thái (11) | Hào 5 | Thủy Thiên Nhu (5) | Thể: Càn (Kim), Dụng: Khôn (Thổ) | Sinh Nhập (+2) | **PASS** |
| **3. Tây Lâm Tự Ngạch** | Thượng: Càn (1), Hạ: Cấn (7) | Thiên Sơn Độn (33) | Hào 1 | Thiên Hỏa Đồng Nhân (13) | Thể: Càn (Kim), Dụng: Cấn (Thổ) | Sinh Nhập (+2) | **PASS** |
| **4. Mẫu Đơn Chiêm** | Tị Tỵ 16/3, giờ Mão | Thiên Phong Cấu (44) | Hào 5 | Hỏa Phong Đỉnh (50) | Thể: Tốn (Mộc), Dụng: Càn (Kim) | Khắc Nhập (-2) | **PASS** |
| **5. Khách Lai Xao Môn** | Đêm Tý, Thượng: Càn(1), Hạ: Tốn(4) | Thiên Phong Cấu (44) | Hào 2 | Thiên Sơn Độn (33) | Thể: Càn (Kim), Dụng: Tốn (Mộc) | Khắc Xuất (0) | **PASS** |

---

## 5. XỬ LÝ LỊCH ÂM THIÊN VĂN & BIÊN GIỜ TÝ

1. **Thuật toán thiên văn Hồ Ngọc Đức / Jean Meeus**:
   - Hiện thực hóa đầy đủ trong `process_layer/app/engines/lunar_calendar.py` với múi giờ chuẩn Việt Nam (UTC+7, kinh tuyến $105^\circ$ Đông).
   - Kiểm thử thành công ngày rằm Trung Thu 15/8/2026 và đêm Giao Thừa 30 Tết Quý Mão chuyển giao sang Giáp Thìn 2024.
   - Xử lý chính xác năm nhuận Quý Mão 2023 (tháng 2 nhuận) theo chuẩn thiên văn quốc gia Việt Nam (`get_leap_month_offset`).
2. **Quy ước Giờ Tý (23:00 - 00:59)**:
   - Hiện thực hóa theo đúng Quyết định 3 đã chốt tại Cổng 1:
     - Mặc định: `NEXT_DAY` (Dạ Tý 23:00–23:59 tính Can Chi cho ngày hôm sau).
     - Cho phép tùy chọn: `SAME_DAY` qua tham số `rat_hour_rule`.
     - Toàn bộ phản hồi API và `system_output_summary` đều đính kèm nhãn `convention` và cờ `ASSUMPTION` minh bạch.

---

## 6. KIẾN TRÚC MÃ NGUỒN ĐÃ HOÀN THÀNH TRONG PHA 2

```
process_layer/
├── app/
│   ├── api/
│   │   └── divination.py           # REST endpoints: POST /divination, GET /lunar/convert
│   ├── core/
│   │   ├── config.py               # Cấu hình Pydantic Settings, DB connection string
│   │   ├── errors.py               # Chuẩn hóa lỗi AppError, BusinessError, ValidationError
│   │   └── security.py             # HMAC-SHA256 pseudonymized_user_hash
│   ├── db/
│   │   ├── connection.py           # pyodbc Connection pool
│   │   └── repository.py           # Wrapper gọi 4 Stored Procedures và các Views
│   ├── engines/
│   │   ├── casting_engine.py       # Lõi lập quẻ Mai Hoa tất định (384 combos)
│   │   └── lunar_calendar.py       # Lịch âm Hồ Ngọc Đức, Can Chi, giờ Tý
│   ├── schemas/
│   │   └── divination.py           # Pydantic v2 schemas: Request, Response, TrigramInfo, Synthesis
│   └── main.py                     # FastAPI application entrypoint, middleware, CORS
└── tests/
    ├── test_api_divination.py       # 6 unit/integration tests cho REST API
    ├── test_golden_cases.py        # 5 bài test ca kinh điển Mai Hoa
    ├── test_lunar_calendar.py      # 4 bài test lịch âm và giờ Tý
    └── test_parity_sql_python.py   # Test đối chiếu tương đồng 384/384 SQL ↔ Python
```

---

## 7. ĐỀ XUẤT HÀNH ĐỘNG TẠI CỔNG 2 (GATE 2 CHECKPOINT)

Với kết quả 17/17 bài test vượt qua tuyệt đối (100% PASS) và Migration v3 đã được thẩm định an toàn trên môi trường dev:

1. **Xin ý kiến phê duyệt**: Phê duyệt nghiệm thu Pha 2 để chuyển tiếp sang **Pha 3: Tích hợp Tri thức & Luật Suy luận (Module 2: Rule Engine & Knowledge Seeds)**.
2. **Xin phép áp dụng Migration v3 lên Production**:
   - Cho phép chạy `migrations/v3/migration_v3.sql` lên cơ sở dữ liệu chính `KinhDich_KB`.
   - Chạy kiểm tra xác thực bằng `migrations/v3/verify_v3.sql` (kỳ vọng 0 dòng lỗi).

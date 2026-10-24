# 📦 TÀI LIỆU BÀN GIAO TOÀN DIỆN: TẦNG 1 & TẦNG 2 (KMS301)
## Hệ Thống Quản Trị Tri Thức Kinh Dịch (`KinhDich_KB`)
**Môn học:** KMS301 — Hệ Thống Quản Trị Tri Thức · Nhóm 5 (Lớp IS1906)  
**Phiên bản bàn giao:** `v2.0-full` (Hoàn tất 100% Tầng 1 và Tầng 2)  
**Ngày bàn giao:** 20/10/2026  
**Mục tiêu bàn giao:** Cung cấp đầy đủ mã nguồn, CSDL, tài liệu kiến trúc và hướng dẫn cài đặt để teammate tiếp nhận phát triển **Tầng 3 (UI Layer / Cổng Tri thức)**.

---

## 1. 🗺️ BỨC TRANH KIẾN TRÚC TỔNG THỂ (3 TẦNG KMS)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    TẦNG 3 — UI LAYER (CỔNG TRI THỨC / PORTAL)                  │
│   Web App / Mobile / Dashboard Thống Kê / Giao Diện Gieo Quẻ & Kiểm Duyệt    │
│   👉 [TEAMMATE TIẾP NHẬN PHÁT TRIỂN DỰA TRÊN REST API TẦNG 2]                │
├───────────────────────────────────────────────────────────────────────────────┤
│                  TẦNG 2 — PROCESS LAYER (REASONING & LOGIC ENGINE)            │
│   ✅ HOÀN TẤT 100% — 43/43 PYTEST PASS — FASTAPI & OPENAPI COMPLIANT          │
│   • Mô-đun 1: Lập quẻ Mai Hoa & Lịch âm Hồ Ngọc Đức (Can Chi, Giờ Tý)        │
│   • Mô-đun 2: Suy luận Ngũ hành Mai Hoa & Lõi Rule DSL v1 AST an toàn        │
│   • Mô-đun 3: Tổng hợp Tri thức 3 trụ cột & Phân rã điểm minh bạch            │
│   • Mô-đun 4: Tra cứu Quẻ (Bỏ dấu TV) & Cá nhân hóa 3 cấp độ (Wiig 1993)     │
│   • Mô-đun 5: Cổng Kiểm duyệt Chuyên gia Validation Gate (McElroy 1999)      │
│   • Mô-đun 6: Vòng lặp Học tập Đôi Double-Loop Learning (Argyris & Schön)    │
├───────────────────────────────────────────────────────────────────────────────┤
│                  TẦNG 1 — DATA LAYER (KNOWLEDGE REPOSITORY LAYER)             │
│   ✅ HOÀN TẤT 100% — CSDL SQL SERVER 2022 — CHUẨN KIỂM TOÁN DỮ LIỆU          │
│   • 11 bảng CSDL cốt lõi + Bảng Audit + Phân quyền Role db_process_layer     │
│   • 964 dòng kinh văn cổ điển (64 quẻ) 100% APPROVED, 0 dòng khuyết chữ Hán  │
│   • 5 SQL Views bảo mật (View-Only) & 4 Stored Procedures kiểm soát ghi       │
│   • Bộ Seed Data (Ngũ hành, Hệ luật DSL, Diễn giải mẫu)                      │
│   • Cung cấp sẵn file Backup (.bak) phục hồi 1 click                         │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ⚡ HƯỚNG DẪN KHỞI CHẠY NHANH CHO TEAMMATE (QUICK START)

### Bước 1: Thiết lập Cơ sở dữ liệu (SQL Server)

Bạn có thể chọn 1 trong 2 cách:

#### 👉 Cách 1: Phục hồi trực tiếp từ file Backup `.bak` (Khuyên dùng — Nhanh nhất)
Mở **SQL Server Management Studio (SSMS)** hoặc **sqlcmd**, chạy lệnh sau:
```sql
-- Phục hồi CSDL Môi trường Phát triển (KinhDich_KB_dev)
RESTORE DATABASE KinhDich_KB_dev 
FROM DISK = 'D:\...\db\KinhDich_KB_dev.bak' 
WITH REPLACE;

-- (Tùy chọn) Phục hồi CSDL Môi trường Sản xuất nguyên bản (KinhDich_KB)
RESTORE DATABASE KinhDich_KB 
FROM DISK = 'D:\...\db\KinhDich_KB_prod.bak' 
WITH REPLACE;
```

#### 👉 Cách 2: Chạy lần lượt các script SQL (Từ đầu)
1. `db/kinhdich_schema_v1.sql` (Tạo bảng, Trigger, View cơ bản).
2. `db/kinhdich_64_que.sql` (Nạp 8 quái, 64 quẻ kép, 386 hào).
3. `migration/migration_v2.sql` & `migration/approve_verified.sql` (Nạp đủ 964 dòng kinh văn chuẩn hóa).
4. `migrations/v3/migration_v3.sql` (Tạo 5 views, 4 stored procedures, database role).
5. `migrations/v3/seeds/*.sql` (Nạp seed ngũ hành, quy tắc suy luận, diễn giải mẫu).

---

### Bước 2: Thiết lập Môi trường Python & Cài đặt Thư viện

Mở terminal tại thư mục gốc dự án:
```powershell
# 1. Tạo môi trường ảo
python -m venv .venv

# 2. Kích hoạt môi trường ảo
# Trên Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Hoặc Command Prompt:
.\.venv\Scripts\activate.bat

# 3. Nâng cấp pip và cài đặt thư viện phụ thuộc
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Bước 3: Chạy Kiểm Thử Tự Động (Verify Pytest)

Chạy toàn bộ 43 test case để đảm bảo môi trường đã hoạt động chuẩn xác:
```powershell
pytest -v process_layer/tests
```
✅ **Kỳ vọng:** `43 passed, 1 warning in ~2.0s`.

---

### Bước 4: Khởi Động REST API Server (Uvicorn)

Chạy máy chủ backend Tầng 2:
```powershell
uvicorn process_layer.app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Base URL:** `http://localhost:8000`
- **Tài liệu Swagger UI tương tác trực quan:** `http://localhost:8000/docs`
- **Tài liệu ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI Schema file:** `docs/openapi_process_layer.json`

---

## 3. 📋 DANH MỤC 10 REST API ENDPOINTS CHÍNH THỨC CHO TẦNG 3 (UI)

Tầng 3 (UI Layer) chỉ cần gọi 10 API endpoints sau đây để xây dựng toàn bộ ứng dụng:

| STT | Nhóm Chức Năng | Method | Endpoint URI | Mô Tả Dành Cho Giao Diện UI |
|:---:|---|:---:|---|---|
| 1 | **Hệ Thống** | `GET` | `/api/v1/health` | Kiểm tra trạng thái server & kết nối SQL Server. |
| 2 | **Lịch Pháp** | `GET` | `/api/v1/lunar/convert` | Đổi Dương lịch sang Âm lịch, Can Chi năm/tháng/ngày/giờ, tiết khí. |
| 3 | **Gieo Quẻ & Suy Luận** | `POST` | `/api/v1/divination` | **Lõi gieo quẻ**: Hỗ trợ 2 phương pháp `MAI_HOA_TIME` & `MAI_HOA_NUMBER`. Trả về quẻ chủ, hỗ, biến, điểm ngũ hành, luật kích hoạt, diễn giải ngữ cảnh & cảnh báo an toàn. |
| 4 | **Chi Tiết Quẻ** | `GET` | `/api/v1/hexagram/{id}` | Lấy chi tiết 1 quẻ (1–64). Có tham số `user_level` (`NOVICE`, `PRACTITIONER`, `EXPERT`) để UI hiển thị giao diện phù hợp. |
| 5 | **Tìm Kiếm Quẻ** | `GET` | `/api/v1/search` | Tìm kiếm quẻ tiếng Việt (gõ không dấu vẫn tìm được), lọc theo quẻ đơn thượng/hạ, phân trang. |
| 6 | **Đóng Góp Tri Thức** | `POST` | `/api/v1/interpretations` | Giao diện cho người dùng/chuyên gia gửi bài diễn giải mới (Luôn ghi nhận `PENDING`). |
| 7 | **Hàng Đợi Kiểm Duyệt** | `GET` | `/api/v1/review/queue` | Màn hình dành cho Chuyên gia xem danh sách bài đang chờ thẩm định. |
| 8 | **Thẩm Định Tri Thức** | `PUT` | `/api/v1/interpretations/{id}/review` | Nút bấm "Phê duyệt" (`APPROVED`) hoặc "Từ chối" (`REJECTED`) kèm nhận xét. |
| 9 | **Phản Hồi Thực Chứng** | `PUT` | `/api/v1/divination/{case_id}/feedback` | Cho phép người dùng gửi kết quả thực tế sau khi sự việc đã diễn ra; cờ đánh dấu quẻ mẫu mực. |
| 10 | **Dashboard Quản Trị** | `GET` | `/api/v1/governance/stats` | Hiển thị biểu đồ Dashboard: độ phủ 964 dòng kinh văn, số bài trong hàng đợi, phân bổ 16 nguồn, thống kê học tập đôi. |

---

## 4. 🧠 CÁC LÝ THUYẾT QUẢN TRỊ TRI THỨC (KMS) ĐÃ HIỆN THỰC

Khi thuyết trình hoặc viết báo cáo đồ án, hãy nhấn mạnh 4 nền tảng lý thuyết này:

1. **Phân cấp Tri thức theo Năng lực Tiếp nhận (Wiig 1993)**:
   - `NOVICE` (Người mới): Ẩn toàn bộ chữ Hán, tập trung vào hành động thực tiễn, lời khuyên dễ hiểu.
   - `PRACTITIONER` (Người thực hành): Hiển thị cấu trúc quẻ, dịch nghĩa, quẻ hỗ, quẻ biến.
   - `EXPERT` (Nhà nghiên cứu): Hiển thị toàn văn chữ Hán, số trang trích dẫn gốc (`source_ref`), định danh chuyên gia duyệt và mốc thời gian kiểm toán.

2. **Cổng Kiểm Duyệt Tri Thức — Validation Gate (McElroy 1999)**:
   - Tri thức mới (Knowledge Claim) đi vào hệ thống luôn ở trạng thái `PENDING`.
   - Cơ chế Separation of Concerns: AI và người đóng góp **tuyệt đối không được tự phê duyệt**. Chỉ chuyên gia có định danh (`reviewer`) mới có quyền đưa vào kho tri thức chính thức.

3. **Vòng Lặp Học Tập Đôi — Double-Loop Learning (Argyris & Schön 1978)**:
   - Không chỉ dừng ở suy luận đơn tuyến (Single-loop), hệ thống thu thập kết quả thực tế qua `sp_record_outcome`. Dữ liệu này giúp hội đồng đánh giá hiệu lực của các quy tắc suy luận trong tương lai.

4. **Tổng Hợp Tri Thức Đa Trụ Cột & Phân Rã Điểm (Three-Pillar Synthesis)**:
   - Điểm đánh giá gồm 3 thành phần minh bạch:
     $$S_{\text{final}} = 0.40 \times S_{\text{elem}} + 0.35 \times S_{\text{rules}} + 0.25 \times S_{\text{interp}}$$
   - Phân loại rõ 5 nhãn Cát/Hung: `ĐẠI CÁT`, `TIỂU CÁT`, `BÌNH HÒA`, `TIỂU HUNG`, `ĐẠI HUNG`.
   - Tích hợp bộ lọc an toàn nội dung (`Content Safety Guard`) bắt buộc kèm lời khuyên y tế/tài chính chuyên nghiệp cho các chủ đề `HEALTH` và `FINANCE`.

---

## 5. 🛡️ NGUYÊN TẮC AN TOÀN & BẢO VỆ DỮ LIỆU (QUY TẮC BẮT BUỘC)

1. **Tuyệt đối không can thiệp CSDL Production**:
   - `KinhDich_KB` là môi trường thật, luôn giữ sạch.
   - Mọi hoạt động phát triển UI, test API, đóng góp dữ liệu **phải trỏ vào `KinhDich_KB_dev`**.
   - Mã nguồn đã tích hợp Guard cứng (`assert_not_production_db()`), nếu cấu hình nhầm sang Prod, hệ thống sẽ từ chối khởi chạy ngay lập tức.
2. **Quy tắc View-Only & SP-Only**:
   - Tầng 2 chỉ ĐỌC dữ liệu qua các SQL Views (`v_*`).
   - Tầng 2 chỉ GHI dữ liệu qua 4 Stored Procedures: `sp_create_case`, `sp_submit_interpretation`, `sp_review_interpretation`, `sp_record_outcome`.
   - Không bao giờ viết lệnh SQL `INSERT/UPDATE/DELETE` trực tiếp trong mã nguồn ứng dụng.

---

## 6. 📂 CẤU TRÚC GÓI BÀN GIAO (FILE MANIFEST)

```text
HANDOFF_KinhDich_KB_Layer1_Layer2/
├── db/                                # TẦNG 1: Dữ liệu & Schema CSDL
│   ├── KinhDich_KB_dev.bak            # Bản sao lưu phục hồi 1 click cho môi trường dev
│   ├── KinhDich_KB_prod.bak           # Bản sao lưu môi trường prod chuẩn
│   ├── kinhdich_schema_v1.sql         # DDL Schema gốc (11 bảng cốt lõi)
│   ├── kinhdich_64_que.sql            # DML Seed 64 quẻ và 386 hào
│   ├── build_64_que.py                # Script kiểm chứng mã bit quẻ
│   └── load_json_to_sql.py            # Trình nạp dữ liệu kinh văn JSON
├── migration/                         # TẦNG 1: Migration v2 (Kinh văn)
│   ├── migration_v2.sql               # Nạp đủ 964 dòng kinh văn 64 quẻ
│   └── approve_verified.sql           # Phê duyệt 100% dòng kinh văn
├── migrations/                        # TẦNG 2: Migration v3 (Views, Procedures, Seeds)
│   └── v3/
│       ├── migration_v3.sql           # Tạo 5 Views, 4 SPs, Role db_process_layer
│       ├── verify_v3.sql              # Script kiểm toán v3
│       └── seeds/
│           ├── seed_five_element_relations.sql # 25 quan hệ Ngũ hành Mai Hoa
│           ├── seed_inference_rules.sql        # 10 quy tắc suy luận DSL v1
│           └── seed_interpretations.sql        # 11 bài diễn giải bối cảnh mẫu
├── process_layer/                     # TẦNG 2: Toàn bộ mã nguồn Backend
│   ├── app/
│   │   ├── api/                       # REST API Routers (divination, search, governance)
│   │   ├── core/                      # Cấu hình, bảo mật, định nghĩa lỗi
│   │   ├── db/                        # Kết nối DB & Repository gọi SP/Views
│   │   ├── engines/                   # CastingEngine, RuleEngine AST, SynthesisEngine, SearchService, GovernanceService
│   │   ├── models/                    # Domain models
│   │   ├── schemas/                   # Pydantic v2 schemas (In/Out DTOs)
│   │   └── main.py                    # Điểm khởi chạy ứng dụng FastAPI
│   ├── schemas/
│   │   └── rule_dsl.schema.json       # JSON Schema đặc tả Rule DSL v1
│   └── tests/                         # Bộ kiểm thử tự động 43 test cases
├── docs/                              # Toàn bộ tài liệu thiết kế & báo cáo
│   ├── adr/                           # 5 Kiến trúc quyết định (ADR-001 đến ADR-005)
│   ├── 00_data_layer_audit.md         # Báo cáo kiểm toán dữ liệu Tầng 1 (Gate 0)
│   ├── 01_process_layer_architecture_and_design.md # Thiết kế chi tiết Tầng 2 (Gate 1)
│   ├── 02_module1_casting_engine_and_parity_report.md # Báo cáo Mô-đun 1 (Gate 2)
│   ├── 03_module2_rule_and_synthesis_engine_report.md # Báo cáo Mô-đun 2 & 3 (Gate 3)
│   ├── 04_governance_and_double_loop_report.md        # Báo cáo Mô-đun 4, 5 & 6 (Gate 4, 5, 6)
│   ├── openapi_process_layer.json     # OpenAPI 3.1 Specification chính thức
│   └── STATE.md                       # Bản ghi trạng thái dự án
├── requirements.txt                   # Danh mục thư viện Python cần thiết
└── HANDOFF_TANG_1_VA_2_KMS301.md      # Tài liệu này
```

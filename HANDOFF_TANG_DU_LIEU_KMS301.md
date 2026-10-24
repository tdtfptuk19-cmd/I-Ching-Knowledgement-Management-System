# 📦 HANDOFF PACKAGE — Tầng Dữ Liệu (Data Layer)
## Dự án KMS301 — KinhDich_KB · Nhóm 5 IS1906

> [!IMPORTANT]
> Đây là tài liệu bàn giao **Tầng 1 (Data Layer)** đã hoàn chỉnh. Teammate nhận file này cần hoàn thành **Tầng 2 (Process Layer)** và **Tầng 3 (UI Layer)**. Đọc kỹ toàn bộ tài liệu trước khi bắt đầu.
> *(Cập nhật sau kiểm toán v2: Chuẩn hóa số liệu 694/900/960 dòng, 15 dòng NULL, bổ sung cơ chế Ngoại lệ Migration).*

---

## 1. 🗺️ Kiến Trúc Hệ Thống — Bức Tranh Tổng Thể

Hệ thống KMS **KinhDich_KB** theo kiến trúc **3 tầng chuẩn KMS301**:

```
┌─────────────────────────────────────────────────────────────────┐
│  TẦNG 3 — UI LAYER (Cổng Tri Thức / Knowledge Portal)          │
│  Trình bày trực quan, tương tác 2 chiều, cá nhân hóa           │
│  ← CẦN TEAMMATE HOÀN THÀNH →                                   │
├─────────────────────────────────────────────────────────────────┤
│  TẦNG 2 — PROCESS LAYER (Reasoning Engine / Logic Engine)       │
│  Thuật toán suy luận, tìm kiếm, phân quyền, cá nhân hóa        │
│  ← CẦN TEAMMATE HOÀN THÀNH →                                   │
├─────────────────────────────────────────────────────────────────┤
│  TẦNG 1 — DATA LAYER (Knowledge Repository Layer)              │
│  SQL Server · 11 bảng · 5 Views · 694 dòng kinh văn đã nạp DB  │
│  (900 dòng trong final JSON; mục tiêu đủ 64 quẻ = 960 dòng)    │
│  ✅ HOÀN THÀNH — Đây là phần bàn giao                           │
└─────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **Tại sao đây là KMS chứ không phải CSDL thông thường?**
> Điểm khác biệt nằm ở 4 trụ cột: (1) **Provenance** — truy vết nguồn gốc tri thức, (2) **Atomic Chunking** — bóc tách đơn vị tri thức nhỏ nhất, (3) **Taxonomy/Ontology** — phân loại học bất biến, (4) **Expert Validation Gate** — cổng kiểm duyệt chuyên gia chặn tri thức rác.

---

## 2. 📁 Danh Sách File Bàn Giao

### 📂 File cốt lõi (trong thư mục `db/`)

| File | Mục đích | Bắt buộc chạy trước |
|------|----------|---------------------|
| `db/kinhdich_schema_v1.sql` | **Schema chính** — Tạo database, 11 bảng, trigger, 5 view | **Bước 1** |
| `db/kinhdich_64_que.sql` | **Seed data** — Nạp 8 quẻ đơn + 64 quẻ kép + 386 hào | Sau schema |
| `db/build_64_que.py` | Script sinh `kinhdich_64_que.sql` (tự kiểm tra mã bit, diff rỗng) | — |
| `db/load_json_to_sql.py` | Chuyển file `final_*.json` → câu lệnh INSERT (hỗ trợ cột mới, kiểm tra `gaps_all.csv`) | Xem mục 4 |

### 📂 Dữ liệu kinh văn (`_out/final_b*.json`)

Tổng cộng **900 dòng classic_texts** trong 16 file final (Quẻ 5–64). Hiện DB đã nạp **694 dòng** (đến checkpoint B11, Quẻ 5–46):

| Lô | Quẻ | Trạng thái |
|----|-----|------------|
| Quẻ 1–4 | Thượng Kinh | 📋 Đã trích xuất (`extracted_que01-04.generated.json`, 64 dòng), chờ duyệt thành final |
| B1–B7 (Thượng Kinh) | Quẻ 5–30 | ✅ Đã nạp vào DB |
| B8 Quẻ 31–34 | Hạ Kinh | ✅ Đã nạp |
| B9 Quẻ 35–38 | Hạ Kinh | ✅ Đã nạp |
| B10 Quẻ 39–42 | Hạ Kinh | ✅ Đã nạp |
| B11 Quẻ 43–46 | Hạ Kinh | ✅ Đã nạp (checkpoint B11: 694 dòng) |
| B12–B16 Quẻ 47–64 | Hạ Kinh | ✅ File final sẵn sàng (`final_b12` đến `final_b16`, 270 dòng), chờ nạp tiếp |

> [!NOTE]
> **Quy tắc đếm dòng chuẩn**: 64 quẻ × 15 dòng/quẻ = **960 dòng** chuẩn (không tính `VAN_NGON` đang tạm hoãn theo L5). Hai hào đặc biệt Dụng Cửu/Dụng Lục (position = 7) chỉ nằm trong taxonomy `hexagram_lines`, không tạo dòng riêng trong `classic_texts`.

### 📄 Tài liệu tham chiếu & Migration

| File | Mục đích |
|------|----------|
| `source_map.csv` | Danh mục 16 nguồn tri thức (đã có header chuẩn UTF-8) |
| `_out/master_state.json` | Trạng thái checkpoint hiện tại của project (B11 COMPLETE, 694 rows) |
| `_out/gaps_all.csv` | 14 dòng `text_han = NULL` gốc (thực tế 16 final files có 15 dòng, bổ sung Quẻ 32 THOAN_TU) |
| `_out/migration_v2.sql` | Migration v2: thêm cột audit, sửa nội dung Quẻ 44–46, cập nhật sources |
| `_out/migration_v2_rollback.sql` | Script rollback hoàn nguyên migration v2 an toàn |
| `_out/verify_v2.sql` | Bộ query kiểm tra kỳ vọng 0 dòng sau migration |
| `_out/audit_content.py` | Script kiểm toán nội dung độc lập (text_han, text_vn, đối chiếu hào) |

---

## 3. 🗄️ Thiết Kế CSDL — 5 Nhóm Bảng

### Nhóm 1 — Nguồn gốc & Siêu dữ liệu (Provenance & Metadata)

```sql
sources         -- 16 nguồn tri thức (BOOK, EXPERT_PERSON, AI_MODEL)
                -- Cột quan trọng: reliability_score, copyright_status, publication_year
tags            -- Thẻ từ khóa mô tả (Descriptive Metadata)
interpretation_tags  -- Bảng nối nhiều-nhiều interpretations ↔ tags
```

### Nhóm 2 — Taxonomy Cốt lõi (Core Taxonomy)

```sql
trigrams        -- 8 quẻ đơn (Bát Quái), mã nhị phân 3 bit
hexagrams       -- 64 quẻ kép; upper_code + lower_code là COMPUTED COLUMN (PERSISTED)
                -- → tự động tham chiếu sang trigrams, không thể nhập sai
hexagram_lines  -- 386 hào (64×6=384 + 2 hào đặc biệt Dụng Cửu/Lục tại position=7)
```

**Quy ước mã nhị phân**: `binary_code` đọc từ **trái sang phải = hào 6 (trên) → hào 1 (dưới)**. 3 ký tự đầu = quẻ Thượng, 3 ký tự cuối = quẻ Hạ.

### Nhóm 3 — Kinh Văn Nguyên Tử (Atomic Knowledge Texts)

```sql
classic_texts   -- Đơn vị tri thức nhỏ nhất
```

Mỗi quẻ chuẩn có **15 dòng** kinh văn nguyên tử:

| `text_type` | `line_position` | Mô tả |
|-------------|-----------------|-------|
| `THOAN_TU` | NULL | Thoán từ (Văn Vương) |
| `THOAN_TRUYEN` | NULL | Thoán truyện (Khổng Tử) |
| `DAI_TUONG` | NULL | Đại tượng truyện |
| `HAO_TU` | 1–6 | Hào từ (6 hào) |
| `TIEU_TUONG` | 1–6 | Tiểu tượng (6 hào) |
| `VAN_NGON` | NULL | Văn Ngôn (chỉ Quẻ 1 & 2, **tạm hoãn**) |

> [!WARNING]
> `text_han` chỉ chứa thuần chữ Hán. `text_vn` giữ nguyên văn dịch. Hai cột này **tách biệt tuyệt đối** — không lẫn lộn.

### Nhóm 4 — Tri Thức Diễn Giải theo Ngữ cảnh

```sql
interpretations -- Ánh xạ tri thức vào chủ đề thực tế
                -- topic: CAREER | RELATIONSHIP | FINANCE | HEALTH | ACADEMIC | GENERAL
                -- target_type: HEXAGRAM | LINE | TRANSFORMATION
                -- author_type: CLASSIC | EXPERT | AI_DRAFT
                -- review_status: PENDING | APPROVED | REJECTED
```

> [!CAUTION]
> **Trigger `trg_interp_source_kind`** kiểm tra `author_type` phải khớp `source_kind`. AI_DRAFT tuyệt đối không thể tự động thành APPROVED — phải có `reviewed_by` và `reviewed_at`.

### Nhóm 5 — Cơ Sở Quy Tắc Suy Luận (Rule Base)

```sql
five_element_relations  -- Ma trận Ngũ hành sinh khắc
                        -- relation_type: SINH_XUAT | SINH_NHAP | KHAC_XUAT | KHAC_NHAP | TY_HOA
inference_rules         -- Luật suy luận dạng JSON
                        -- condition_expression phải là JSON hợp lệ (CHECK ISJSON = 1)
divination_cases        -- Ca gieo quẻ thực tế → Double-Loop Learning
                        -- casting_method: MAI_HOA_TIME | MAI_HOA_NUMBER
```

---

## 4. 🔍 5 Views Công Khai — Cổng Kết Nối với Tầng Trên

Tầng Process và UI Layer **chỉ được đọc qua Views**, không truy cập bảng gốc trực tiếp:

| View | Điều kiện lọc | Dùng cho |
|------|---------------|----------|
| `v_interpretations_public` | `review_status = 'APPROVED'` | Process Layer lấy diễn giải đã duyệt |
| `v_inference_rules_public` | `review_status = 'APPROVED'` | Process Layer lấy luật suy luận |
| `v_classic_texts_verified` | `verified_by IS NOT NULL` | Hiển thị kinh văn đã xác thực |
| `v_hexagram_trigrams` | — | Join 64 quẻ với 8 quẻ đơn tương ứng |
| `v_divination_results` | — | View phức — tính quẻ chủ/biến/hộ theo cả 2 phương pháp Mai Hoa |

---

## 5. ⚙️ Hướng Dẫn Cài Đặt Môi Trường

### Yêu cầu
- SQL Server 2017+ (hoặc SQL Server Express)
- Python 3.10+
- `sqlcmd` đã cài trên máy

### Bước 1 — Tạo Schema
```powershell
sqlcmd -S "(local)" -E -d master -b -f 65001 -I -i kinhdich_schema_v1.sql
```

### Bước 2 — Nạp Taxonomy
```powershell
sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i kinhdich_64_que.sql
```

### Bước 3 — Áp dụng Migration v2 (nếu nâng cấp)
```powershell
sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i migration_v2_nobom.sql
```

---

## 6. 🎯 Nhiệm Vụ Tầng 2 & 3 (Dành cho Teammate)

### Tầng 2 — Process Layer (Logic / Reasoning Engine)
- **Suy luận Mai Hoa**: Sử dụng `v_divination_results`.
- **Phân tích Ngũ hành**: Đọc `five_element_relations` + `inference_rules`.
- **Matching diễn giải**: Query `v_interpretations_public`.
- **Kiểm duyệt nội dung**: Workflow PENDING → APPROVED/REJECTED.

### Tầng 3 — User Interface Layer (Knowledge Portal)
- Giao diện gieo quẻ, tra cứu 64 quẻ, bảng duyệt tri thức cho chuyên gia.

---

## 7. 📊 Số Liệu Hiện Tại (Kiểm Toán v2)

| Chỉ số | Giá trị | Ghi chú kỹ thuật |
|--------|---------|------------------|
| Nguồn tri thức (`sources`) | 16 | Đã chuẩn hóa header CSV |
| Quẻ đơn (`trigrams`) | 8 | 100% đúng Bát quái |
| Quẻ kép (`hexagrams`) | 64 | 100% đúng Văn Vương |
| Hào (`hexagram_lines`) | 386 | 64×6=384 thường + 2 đặc biệt (pos 7) |
| Kinh văn đã nạp DB (`classic_texts`) | **694 dòng** | Quẻ 5–46 (checkpoint B11); review_status: PENDING |
| Kinh văn trong final JSON (`_out/final_b*.json`) | **900 dòng** | 16 file hoàn chỉnh Quẻ 5–64 (60 quẻ × 15 dòng) |
| Mục tiêu kinh văn đủ 64 quẻ | **960 dòng** | 64 quẻ × 15 dòng (chưa tính VAN_NGON hoãn) |
| Khuyết tật minh bạch (`text_han = NULL`) | **15 dòng** | 14 dòng trong gaps_all + 1 dòng Quẻ 32 THOAN_TU |
| Tình trạng duyệt (`verified_by`) | 0 dòng (NULL 100%) | Đã qua 20 cổng tự động; chưa gán duyệt chuyên gia |
| Kết quả kiểm toán tự động | **ALL 20 GATES PASS** | Checkpoint B11 |

---

## 8. ⚠️ Quy Tắc Bảo Vệ Dữ Liệu & Ngoại Lệ Migration

> [!CAUTION]
> **Tuyệt đối không** chạy DROP, DELETE, TRUNCATE, UPDATE, ALTER trực tiếp tùy tiện lên bất kỳ bảng nào trong danh sách: `sources`, `trigrams`, `hexagrams`, `hexagram_lines`, `interpretations`, `inference_rules`, `five_element_relations`, `tags`, `divination_cases`, `classic_texts`.

### 8.1 🛡️ Ngoại lệ Migration có kiểm soát (Migration v2)
Quy tắc cấm ở trên nhằm ngăn chặn việc tự tiện can thiệp làm hỏng tính toàn vẹn của kho tri thức. Tuy nhiên, việc nâng cấp schema và sửa lỗi dữ liệu phát hiện qua kiểm toán được thực hiện thông qua **Ngoại lệ Migration có kiểm soát**:
1. **Đóng gói độc lập**: Mọi thay đổi schema (thêm cột `review_status`, `confidence`, `source_ref`, `issues`) và sửa nội dung (Quẻ 44–46) phải nằm trong file migration mới (`migration_v2.sql`).
2. **Idempotent & Transaction**: Migration có kiểm tra điều kiện tồn tại trước khi chạy, bọc toàn bộ trong `BEGIN TRANSACTION ... COMMIT TRANSACTION`.
3. **Rollback Script**: Bắt buộc kèm script hoàn nguyên (`migration_v2_rollback.sql`) để đưa database về trạng thái cũ nếu cần.
4. **Phê duyệt nhóm**: Script migration phải được nhóm kiểm duyệt thông qua trước khi chạy trên database chính.

---

## 9. 📖 Nền Lý Thuyết KMS301 Áp Dụng

| Lý thuyết | Áp dụng trong dự án |
|-----------|---------------------|
| **Meyer & Zack KM Cycle** (1996) | Acquisition → Refinement → Storage → Distribution: toàn bộ pipeline trích xuất kinh văn |
| **McElroy Knowledge Life Cycle** (1999) | Expert Validation Gate + `divination_cases` làm vòng lặp Double-Loop Learning |
| **DIKW Pyramid** | Data (raw PDF) → Information (classic_texts) → Knowledge (interpretations + inference_rules) → Wisdom (v_divination_results) |
| **Garbage In, Garbage Out** | Cổng kiểm toán 2 pha (Automated Gates + Human-in-the-loop Gate) |
| **Atomic Knowledge Unit** (Meyer & Zack) | Mỗi hào/tượng là 1 dòng trong `classic_texts` — đơn vị nhỏ nhất |
| **Metadata 3 loại** | `sources` (Admin) · `trigrams/hexagrams` (Structural) · `tags` (Descriptive) |

---

*Tài liệu được cập nhật sau kiểm toán v2 · Ngày: 2026-10-20*

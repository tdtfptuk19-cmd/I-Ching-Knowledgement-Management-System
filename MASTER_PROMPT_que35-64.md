# MASTER PROMPT — TRÍCH XUẤT & NẠP KINH VĂN LÕI (QUẺ 35–64)

> Dùng cho Knowledge Engineer agent chạy độc lập, CHỈ ĐỌC file nguồn PDF và ghi vào `_out\`. Không chạm database. Cấu trúc 7 lô: **B9 (chốt+load, đã dở)** + **B10–B16 (extract mới)**.

---

## A. BỐI CẢNH & QUY TẮC BẮT BUỘC (L1–L13)

Áp dụng toàn bộ quy tắc L1 đến L13 đã ghi trong `GEMINI.md` và `AGENTS.md` (cùng nội dung). Tóm tắt:

| ID | Quy tắc |
|:--|:--|
| L1 | text_han chỉ chứa chữ Hán. Cấm Latin/số/khoảng trắng/dấu câu. Không đọc được → null. |
| L2 | Chữ Hán đọc một phần → null cả dòng, confidence: "medium". |
| L3 | text_vn giữ NGUYÊN (kể cả nhãn "Hào Sơ Cửu.", "Tượng viết:", ngắt dòng). Chỉ cắt khoảng trắng đầu/cuối, gộp dãy khoảng trắng, bỏ dòng trống. |
| L4 | Biến thể chữ nguồn: giữ nguyên, ghi "source_variant: ..." vào _meta.issues. |
| L5 | VAN_NGON: KHÔNG xuất, KHÔNG nạp. |
| L6 | Sau khi có JSON phải chạy audit, liệt kê mọi lệch. KHÔNG tự sửa JSON. |
| L7 | Cấm DROP/DELETE/TRUNCATE/UPDATE/ALTER (ngoại trừ SQL do load_json_to_sql.py sinh từ file final). Cấm đụng sources/trigrams/hexagrams/hexagram_lines/interpretations/inference_rules/five_element_relations/tags/divination_cases. |
| L8 | Chạy SQL bằng sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I, dùng bản sao KHÔNG BOM. |
| L9 | KHÔNG chạy script nào có thể ghi vào/sinh lại bất kỳ *.json dữ liệu trong _out\ ngoài *.generated.json của batch đang làm. Lệnh xem/so sánh = chỉ đọc. |
| L10 | Parser chỉ ghi _out\<P>.generated.json. File final <P>.json do NGƯỜI DÙNG tạo (copy rồi sửa tay). Sau khi chốt KHÔNG chạy lại bất kỳ script nào ghi đè. |
| L11 | Chữ Hán từ trí nhớ → chỉ ghi _meta.issues với tiền tố "memory_hint:", KHÔNG BAO GIỜ điền vào text_han/text_vn. |
| L12 | text_han/text_vn phải do parser CẮT TỰ ĐỘNG từ raw. Không gõ, không viết sẵn. |
| L13 | Nguồn thiếu tiền tố (彖曰/象曰) hoặc in lặp văn bản hào khác: giữ nguyên theo nguồn (hoặc null nếu lặp nhầm), ghi "source_defect". Khi giải thích bất thường: CHỈ in bằng chứng nguyên văn kèm số trang, KHÔNG dùng trí nhớ. |

Quy tắc cứng chống bịa R1–R11 đã ghi trong prompt gốc cũng áp dụng (xem file prompt đã dùng cho B1–B8).

---

## B. CÔNG CỤ & NGUỒN

- **PDF nguồn**: `D:\MySQL\KinhDich-20261005T164605Z-1-001\KinhDich\Dick Kinh Dai Toan-Thuong Kinh.pdf` (chỉ đọc).
- **Bảng ánh xạ trang**: `compare_names_thuong_kinh.csv` (đã có quẻ 1–31, dùng làm mốc; **quẻ 32–64 cần scrape lại bằng pypdf trước khi viết prompt B10+** — xem mục C).
- **Script cấu trúc**: `D:\MySQL\db\build_64_que.py` (mã bit, tên quẻ; import được trong cùng thư mục).
- **Script nạp SQL**: `D:\MySQL\db\load_json_to_sql.py` (hỗ trợ `--strip-han-punct --texts-only`).
- **Script phiếu**: `D:\MySQL\db\review_sheet.py` (`make` / `stats`).
- **Quy ước mã bit**: ký tự TRÁI = hào 6 (trên cùng), PHẢI = hào 1 (dưới cùng). Hào dương: 初九, 九二, 九三, 九四, 九五, 上九. Hào âm: 初六, 六二, 六三, 六四, 六五, 上六. Hào k lấy ký tự thứ (7−k) từ trái.
- **Source ID**: `7` (đã có trong `sources`, không thêm).

---

## C. BƯỚC 0 (MỘT LẦN, TRƯỚC B10) — SCRAPE TRANG PDF CHO QUẺ 32–64

`compare_names_thuong_kinh.csv` chỉ có 31 quẻ. Cần bổ sung cột `page_start` cho 33 quẻ còn lại (32–64).

**Tác vụ (CHỈ ĐỌC, ghi 1 file mới `_out\scrape_pages_que32-64.csv`):**

1. Dùng `pypdf` đọc toàn bộ PDF từ trang 248 trở đi (sau quẻ 31) đến hết.
2. Với mỗi hexagram_id trong 32–64, tìm trang đầu tiên xuất hiện tên quẻ (theo `name_vn` trong `build_64_que.py`, ví dụ: 32 = "Lôi Phong Hằng", 33 = "Thiên Sơn Độn"...).
3. Ghi CSV với header: `hexagram_id,name_vn,page_start`. Sort theo `hexagram_id`.
4. Báo cáo tóm tắt: bao nhiêu quẻ tìm được trang, quẻ nào không tìm thấy (để con người đối chiếu mục lục sách).

**Không** tự ý thay đổi `compare_names_thuong_kinh.csv`. Chỉ tạo file mới `_out\scrape_pages_que32-64.csv`.

---

## D. LÔ B9 — CHỐT & NẠP (ĐÃ CÓ generated.json)

**Trạng thái đầu vào:** Đã có `_out\b09_que35-38.generated.json` (60 dòng), `_out\audit_b09_que35-38.csv`, `_out\review_b09_que35-38.csv`. Người dùng sẽ tự duyệt `review_b09_que35-38.csv` rồi tạo `final_b09_que35-38.json`.

**Phần việc của agent cho B9:** Chỉ chạy phần **G. NẠP** sau khi người dùng xác nhận SHA256 của `final_b09_que35-38.json` (xem mục G phía dưới).

---

## E. LÔ B10–B16 — TRÍCH XUẤT MỚI (6 LÔ × 60 DÒNG = 360 DÒNG)

| Lô | Quẻ | Tên quẻ (theo `build_64_que.py`) | Trang |
|:--:|:--:|:--|:--|
| B10 | 39–42 | Thủy Sơn Kiển, Lôi Thủy Giải, Sơn Trạch Tổn, Phong Lôi Ích | (lấy từ scrape) |
| B11 | 43–46 | Trạch Thiên Quải, Thiên Phong Cấu, Trạch Địa Tụy, Địa Phong Thăng | (lấy từ scrape) |
| B12 | 47–50 | Trạch Thủy Khốn, Thủy Phong Tỉnh, Trạch Hỏa Cách, Hỏa Phong Đỉnh | (lấy từ scrape) |
| B13 | 51–54 | Thuần Chấn, Thuần Cấn, Phong Sơn Tiệm, Lôi Trạch Quy Muội | (lấy từ scrape) |
| B14 | 55–58 | Lôi Hỏa Phong, Hỏa Sơn Lữ, Thuần Tốn, Thuần Đoài | (lấy từ scrape) |
| B15 | 59–61 | Phong Thủy Hoán, Thủy Trạch Tiết, Phong Trạch Trung Phu | (lấy từ scrape) |
| B16 | 62–64 | Lôi Sơn Tiểu Quá, Thủy Hỏa Ký Tế, Hỏa Thủy Vị Tế | (lấy từ scrape) |

> Sau khi scrape (mục C), cập nhật cột "Trang" trong bảng này vào prompt từng lô.

---

## F. PROMPT MẪU CHO MỖI LÔ B10–B16 (Dán nguyên, thay `<N>`)

```
NHIỆM VỤ: Lượt 1B-<N> (Batch B<N>). Trích xuất kinh văn LÕI cho 4 quẻ: <danh sách quẻ + tên Việt theo build_64_que.py>.

NGUỒN & PHẠM VI
- source_id = 7. PDF: D:\MySQL\KinhDich-20261005T164605Z-1-001\KinhDich\Dick Kinh Dai Toan-Thuong Kinh.pdf (pypdf, chỉ đọc).
- Mỗi quẻ 15 dòng: THOAN_TU, THOAN_TRUYEN, DAI_TUONG (line_position = null) + HAO_TU, TIEU_TUONG cho hào 1..6. Không VAN_NGON, không lời bình, không hào 7.
- Khoảng trang đọc: lấy từ cột page_start trong _out\scrape_pages_que32-64.csv. Quẻ k đọc từ trang page_start(k) đến trang page_start(k+1)−1; quẻ cuối lô đọc đến trang page_start(quẻ đầu lô kế tiếp)−1 hoặc hết sách. Cộng 1 trang đệm mỗi đầu/cuối.

CÁCH TÁCH
- text_han: khối Hán văn, bỏ hết dấu câu/khoảng trắng (L1). Không đọc được / nghi lỗi font → text_han = null, issues "han_text_unreadable" kèm vị trí, KHÔNG ghi chuỗi "chuẩn" (L11). confidence "medium".
- text_vn: phiên âm + dịch thơ, giữ NGUYÊN các dòng như PDF (L3). Có nhãn "Hào Sơ Cửu.", "Tượng viết:"... thì giữ nguyên.
- Biến thể chữ nguồn: giữ nguyên, ghi "source_variant: ..." (L4, L13).
- Mỗi bản ghi có _meta.source_ref = "<đường dẫn PDF>, p. <số trang>".

MÃ BIT & TIỀN TỐ HÀO (tự kiểm)
- <chèn danh sách binary_code và expected_prefixes cho 4 quẻ>
- Mỗi HAO_TU phải bắt đầu bằng đúng tiền tố theo binary_code.
- Mỗi TIEU_TUONG phải bắt đầu bằng 象曰 (trừ khi nguồn thiếu → ghi "source_defect", L13).
- THOAN_TRUYEN nên bắt đầu bằng 彖曰 (nếu thiếu → "source_defect").

TỰ KIỂM TRA TRƯỚC KHI GIAO (assert):
- Tổng 60 dòng (4 quẻ × 15).
- Mỗi quẻ đủ 15 dòng với (text_type, line_position) đúng bộ.
- text_han (nếu không null) chỉ chứa chữ Hán (regex [\u4e00-\u9fff...]).
- HAO_TU có đúng tiền tố; TIEU_TUONG bắt đầu bằng 象曰 (trừ khi ghi source_defect).
- Báo cáo: số dòng text_han=null, danh sách (hexagram_id, line_position, text_type, lý do).

ĐẦU RA (L9, L10):
1. _out\raw_que<N>_p1.txt, _out\raw_que<N>_p2.txt, ... (1 file/quẻ, có dòng "=== PAGE n ===").
2. _out\b<N>_que<XX-YY>.generated.json. Cấu trúc: {"classic_texts": [...], "_report": {counts_by_hexagram, total_rows, null_text_han_count, null_text_han_rows, low_medium_confidence_count, variants_noted}}.
3. _out\gaps_b<N>.csv: hexagram_id, line_position, text_type, pdf_page, error_description.

SAU KHI XUẤT JSON (CHỈ ĐỌC, KHÔNG sửa JSON, KHÔNG chạy SQL):
a) Chạy D:\MySQL\db\load_json_to_sql.py _out\b<N>_que<XX-YY>.generated.json --strip-han-punct --texts-only — chỉ để KIỂM TRA. File _load.sql sinh ra KHÔNG được chạy vào DB. Báo nguyên văn các dòng LOI và CANH BAO.
b) Chạy audit (audit_json_vs_pdf_v3.py nếu có, hoặc audit_v3) trên JSON generated. CSV: _out\audit_b<N>_que<XX-YY>.csv.
c) Chạy D:\MySQL\db\review_sheet.py make _out\b<N>_que<XX-YY>.generated.json --include-flagged --audit-csv _out\audit_b<N>_que<XX-YY>.csv (KHÔNG dùng --sample, lấy 100% vì lô mới). Phiếu: _out\review_b<N>_que<XX-YY>.csv.
d) Báo: bảng tóm tắt audit, từng dòng lệch kèm detail, danh sách dòng text_han=null.

Sau đó DỪNG. Người dùng tự đối chiếu và tạo file chính thức (final_b<N>_que<XX-YY>.json).

CẤM: chạy bất kỳ script nào trong scratch\ có thể ghi đè file ngoài .generated.json; chạy SQL; đụng DB; sửa file prompt này.
```

**Sau mỗi lô extract, áp dụng quy trình chốt của mục G.**

---

## G. QUY TRÌNH CHỐT & NẠP (ÁP DỤNG CHO MỖI LÔ B9–B16)

### G.1. Người dùng làm sau khi nhận extract từ agent

1. Mở `_out\review_b<N>_que<XX-YY>.csv`. Đánh dấu `han_ok` (Y/N/N/A) và `vn_ok` (Y/N) cho từng dòng. Lưu file.
2. Copy `_out\b<N>_que<XX-YY>.generated.json` → `_out\final_b<N>_que<XX-YY>.json`. Tự tay sửa trên bản final (không dùng script) các lỗi đã xác minh. Với mỗi dòng sửa, thêm `"manual_fix: <mô tả>"` vào `_meta.issues`. Có thể bỏ `_meta` ở các dòng đã verify XONG; hoặc giữ `_meta` để truy vết — `load_json_to_sql.py` tự bỏ qua.
3. Tính SHA256:
   `Get-FileHash _out\final_b<N>_que<XX-YY>.json -Algorithm SHA256`
   → Ghi lại mã băm.
4. Đặt chỉ đọc:
   `attrib +R _out\final_b<N>_que<XX-YY>.json`
5. (Nếu cần) Xóa/đổi tên `_out\b<N>_que<XX-YY>_load.sql` sinh ra từ bước audit, để khỏi nhầm.

### G.2. Người dùng dán prompt nạp sau (đã có mã băm) cho agent:

```
XÁC NHẬN: Tôi đã kiểm tra _out\final_b<N>_que<XX-YY>.json bằng review_sheet:
- Tổng <T> dòng, mỗi quẻ 15 dòng.
- Số dòng text_han=null: <K> (còn <M> dòng cần điền bù sau).
- Tỷ lệ lỗi sau sửa: <X>%.

Bản chuẩn để nạp: SHA256 = <HASH> (LastWriteTime <GIỜ> là chấp nhận được, vì tôi đã đọc nội dung trực tiếp qua review).
File đã được đặt chỉ đọc.

Hãy thực hiện (CHỈ ĐỌC trước khi nạp):
Bước 0. Tính lại SHA256 của file trên: phải đúng <HASH>. Lệch thì DỪNG, báo tôi.
Bước 1. Sinh bản SQL KHÔNG BOM:
        copy _out\final_b<N>_que<XX-YY>.json _out\final_b<N>_que<XX-YY>_nobom.json
        python D:\MySQL\db\load_json_to_sql.py _out\final_b<N>_que<XX-YY>_nobom.json --strip-han-punct --texts-only
        (KHÔNG sửa file final; nếu có lỗi, dừng báo tôi.)
Bước 2. Chạy SQL bằng sqlcmd với tham số L8 (KHÔNG chạy các script ngoài sqlcmd):
        sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i "_out\final_b<N>_que<XX-YY>_nobom_load.sql"
Bước 3. Chạy bộ kiểm tra V1–V7 (xem mục H), in PASS/FAIL cho từng câu.
Bước 4. Báo cáo: tổng dòng classic_texts mới trong DB, COUNT theo hexagram_id, danh sách text_han IS NULL.

CẤM: chạy lại bất kỳ script nào có thể ghi vào file JSON đã chốt; chạy script nào trong scratch\.
```

### G.3. Người dùng xử lý sau khi agent báo PASS

1. Mở SSMS, tự chạy lại V1–V7 (L9: agent không tự chấm).
2. Backup DB: chuột phải `KinhDich_KB` → Tasks → Back Up.
3. Cập nhật `_out\quality_log.csv`:
   `python D:\MySQL\db\review_sheet.py stats _out\review_b<N>_que<XX-YY>.csv --batch B<N> --log _out\quality_log.csv --require-flagged`
4. Cập nhật `_out\gaps_all.csv` (thêm dòng mới nếu có).
5. Nếu có dòng text_han IS NULL mới → ghi vào sổ để điền bù sau (xem mục I).

---

## H. BỘ KIỂM TRA V1–V7 (CHẠY TRONG DB SAU NẠP)

```sql
USE KinhDich_KB;

-- V1: Tổng số dòng classic_texts
SELECT COUNT(*) AS total_classic_texts FROM classic_texts;
-- Kỳ vọng: 514 (sau B8) + 60 = 574 (sau B9); +60 mỗi lô; sau B16 = 934

-- V2: Mỗi quẻ 17/17/15/15 dòng
SELECT hexagram_id, COUNT(*) AS n
FROM classic_texts
WHERE hexagram_id BETWEEN 1 AND 64
GROUP BY hexagram_id
ORDER BY hexagram_id;
-- Kiểm: 1, 2 → 17; 3..64 → 15.

-- V3: Không có chữ Latin/số trong text_han
SELECT TOP 100 hexagram_id, line_position, text_type, text_han
FROM classic_texts
WHERE text_han IS NOT NULL
  AND (text_han LIKE '%[a-zA-Z0-9]%' OR text_han LIKE '% %');
-- Kỳ vọng: 0 dòng.

-- V4: text_han IS NULL
SELECT COUNT(*) AS null_han FROM classic_texts WHERE text_han IS NULL;
SELECT hexagram_id, line_position, text_type FROM classic_texts WHERE text_han IS NULL ORDER BY hexagram_id, line_position;

-- V5: Không có VAN_NGON
SELECT COUNT(*) AS van_ngon_count FROM classic_texts WHERE text_type = 'VAN_NGON';

-- V6: source_id tồn tại
SELECT DISTINCT source_id FROM classic_texts;
-- Kỳ vọng: chỉ {7}.

-- V7: Không trùng khóa tự nhiên
SELECT hexagram_id, line_position, text_type, source_id, COUNT(*) AS dup
FROM classic_texts
GROUP BY hexagram_id, line_position, text_type, source_id
HAVING COUNT(*) > 1;
```

---

## I. KẾ HOẠCH ĐIỀN BÙ CÁC DÒNG text_han IS NULL

Hiện tại (sau B8): 1 dòng (B8: quẻ 34 THOAN_TU, trang 25, `source_defect`). Khi chạy B10–B16 có thể phát sinh thêm (lỗi font PDF).

**Cách xử lý** (làm sau khi toàn bộ 64 quẻ đã nạp, hoặc sau mỗi 3–4 lô):

1. Tổng hợp từ `_out\gaps_all.csv`.
2. Với mỗi dòng `gap_kind = font` (lỗi mã hóa): cần OCR ảnh trang (Tesseract + chi phông phồn thể, hoặc đọc ảnh thủ công). Tuyệt đối không dùng mô hình ngôn ngữ vì sẽ tự chuẩn hóa về bản kinh điển quen thuộc.
3. Với `gap_kind = source_duplicate` (nguồn in lặp): OCR cũng không giúp — cần nguồn thứ hai có lớp chữ sạch.
4. Với `gap_kind = source_defect` (nguồn thiếu): ghi nhận, không bịa.
5. Mỗi lần điền bù: dùng UPDATE do người chạy, có ghi nhật ký (ngày, text_id cũ→mới, nguồn ảnh OCR/sách, người làm).

**Quyết định cấu trúc còn mở**: hiện bảng `classic_texts` chưa có cột `source_ref` (số trang PDF), chỉ có ở tầng JSON. Khi điền bù phải tra lại từng dòng. Khuyến nghị: trước khi điền bù, thêm cột `source_ref NVARCHAR(50) NULL` vào bảng, cập nhật script nạp, viết script điền ngược cho 514 dòng đã nạp từ các file JSON. Có thể đưa vào prompt phụ sau khi B16 xong.

---

## J. BÁO CÁO CUỐI MỖI PHIÊN

Sau khi đóng phiên làm việc, gửi cho tôi:
1. SHA256 của mỗi file final đã chốt.
2. Kết quả V1–V7 từ DB (sau khi tôi tự chạy lại).
3. Số dòng text_han IS NULL còn lại (lũy kế).
4. Nếu có audit phát sinh dòng mới cần xem xét: trích nguyên văn dòng CSV.

---

## K. TÓM TẮT 7 LÔ

| Lô | Quẻ | Prompt | Trạng thái |
|:--:|:--|:--|:--|
| B9 | 35–38 | (extract xong, đã có file) → chỉ chạy mục G (chốt + load) | chờ người dùng duyệt review_b09 |
| B10 | 39–42 | mục F (thay N=10, XX-YY=39-42) | sẵn sàng sau khi có scrape_pages |
| B11 | 43–46 | mục F (N=11, 43-46) | sẵn sàng |
| B12 | 47–50 | mục F (N=12, 47-50) | sẵn sàng |
| B13 | 51–54 | mục F (N=13, 51-54) | sẵn sàng |
| B14 | 55–58 | mục F (N=14, 55-58) | sẵn sàng |
| B15 | 59–61 | mục F (N=15, 59-61) | sẵn sàng |
| B16 | 62–64 | mục F (N=16, 62-64) | sẵn sàng |

**Bước tiếp theo**:
1. (Khuyến nghị) Chạy mục C (scrape trang PDF) trước.
2. Duyệt `_out\review_b09_que35-38.csv` → tạo `final_b09_que35-38.json` → SHA256 → attrib +R.
3. Dán prompt ở mục G.2 với `<HASH>` thật để nạp B9.
4. Lặp lại F → G cho B10–B16.

---

## L. BẢNG MÃ BIT & TIỀN TỐ HÀO 6 LÔ (B10–B16, 24 QUẺ)

Dùng để điền vào prompt từng lô (mục F).

| Lô | Quẻ | Tên | binary | Tiền tố hào 1-6 |
|:--:|:--:|:--|:--|:--|
| B10 | 39 | Thủy Sơn Kiển | 001010 | 初六, 九二, 六三, 六四, 九五, 上六 |
| B10 | 40 | Lôi Thủy Giải | 100010 | 初六, 九二, 六三, 六四, 六五, 上九 |
| B10 | 41 | Sơn Trạch Tổn | 100011 | 初九, 九二, 六三, 六四, 六五, 上六 |
| B10 | 42 | Phong Lôi Ích | 110001 | 初九, 九二, 六三, 六四, 九五, 上六 |
| B11 | 43 | Trạch Thiên Quải | 011111 | 初九, 九二, 九三, 九四, 九五, 上六 |
| B11 | 44 | Thiên Phong Cấu | 111110 | 初六, 六二, 九三, 九四, 九五, 上九 |
| B11 | 45 | Trạch Địa Tụy | 011000 | 初六, 六二, 六三, 六四, 九五, 上六 |
| B11 | 46 | Địa Phong Thăng | 000110 | 初六, 六二, 九三, 六四, 六五, 上六 |
| B12 | 47 | Trạch Thủy Khốn | 011010 | 初六, 九二, 六三, 六四, 九五, 上六 |
| B12 | 48 | Thủy Phong Tỉnh | 010110 | 初六, 六二, 九三, 六四, 九五, 上六 |
| B12 | 49 | Trạch Hỏa Cách | 011101 | 初九, 九二, 六三, 九四, 九五, 上六 |
| B12 | 50 | Hỏa Phong Đỉnh | 101110 | 初六, 六二, 九三, 九四, 六五, 上九 |
| B13 | 51 | Thuần Chấn | 001001 | 初九, 六二, 六三, 六四, 六五, 上六 |
| B13 | 52 | Thuần Cấn | 100100 | 初六, 六二, 六三, 六四, 六五, 上六 |
| B13 | 53 | Phong Sơn Tiệm | 110100 | 初六, 六二, 六三, 六四, 九五, 上六 |
| B13 | 54 | Lôi Trạch Quy Muội | 001011 | 初九, 九二, 六三, 六四, 六五, 上六 |
| B14 | 55 | Lôi Hỏa Phong | 001101 | 初九, 九二, 六三, 九四, 六五, 上六 |
| B14 | 56 | Hỏa Sơn Lữ | 101100 | 初六, 六二, 九三, 六四, 六五, 上九 |
| B14 | 57 | Thuần Tốn | 110110 | 初六, 六二, 九三, 六四, 九五, 上六 |
| B14 | 58 | Thuần Đoài | 011011 | 初九, 九二, 六三, 六四, 六五, 上九 |
| B15 | 59 | Phong Thủy Hoán | 110010 | 初六, 六二, 九三, 六四, 六五, 上六 |
| B15 | 60 | Thủy Trạch Tiết | 010011 | 初九, 九二, 六三, 九四, 六五, 上六 |
| B15 | 61 | Phong Trạch Trung Phu | 110011 | 初九, 九二, 六三, 六四, 六五, 上六 |
| B16 | 62 | Lôi Sơn Tiểu Quá | 001100 | 初六, 六二, 六三, 六四, 六五, 上六 |
| B16 | 63 | Thủy Hỏa Ký Tế | 010101 | 初九, 九二, 六三, 六四, 九五, 上六 |
| B16 | 64 | Hỏa Thủy Vị Tế | 101010 | 初六, 六二, 九三, 九四, 六五, 上九 |

(Đã tự kiểm: mỗi hào 1-6, bit = binary[6-k]; dương = 1 → 初九/九二/九三/九四/九五/上九; âm = 0 → 初六/六二/六三/六四/六五/上六.)

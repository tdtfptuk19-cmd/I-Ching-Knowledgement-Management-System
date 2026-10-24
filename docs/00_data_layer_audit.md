# BÁO CÁO KIỂM TOÁN TẦNG DỮ LIỆU (DATA LAYER AUDIT)
## Dự án: KinhDich_KB · Nhóm 5 — Lớp IS1906 (Môn KMS301)
**Giai đoạn:** Pha 0 — Khảo sát & Kiểm toán Tầng Dữ Liệu (Source of Truth Audit)  
**Ngày thực hiện:** 20/10/2026  
**Người thực hiện:** Senior Software Engineer / KMS Architect (Nhóm 5)

---

## 1. TỔNG QUAN & MỤC TIÊU KIỂM TOÁN
Báo cáo này độc lập kiểm chứng toàn bộ hồ sơ dữ liệu bàn giao từ Tầng 1 (Data Layer), đối chiếu giữa tài liệu mô tả (`HANDOFF_TANG_DU_LIEU_KMS301.md`, các file schema/seed/migration) với hiện trạng vật lý thực tế trong CSDL SQL Server `KinhDich_KB` và các tệp dữ liệu JSON trong `data/batches/`.

Mục tiêu cốt lõi:
1. **Xác nhận nguồn sự thật (Source of Truth)**: Số lượng bảng, view, dòng dữ liệu, ràng buộc toàn vẹn.
2. **Kiểm tra công thức lập quẻ & Thể - Dụng**: Tái hiện toàn bộ logic trong `v_divination_results`, xác thực tính nhất quán của quy ước mã nhị phân (binary code) và các phép biến đổi quẻ.
3. **Phát hiện sai lệch & rủi ro kiến trúc**: Làm rõ những điểm khác biệt giữa mô tả giả định ban đầu và trạng thái thực tế của DB.
4. **Chuẩn bị đầu vào cho Pha 1 (Thiết kế)**: Xác định các Stored Procedures cần thiết, view mở rộng và cơ chế DSL suy luận.

---

## 2. BẢNG ĐỐI CHIẾU SỐ LIỆU: MÔ TẢ GIẢ ĐỊNH VS HIỆN TRẠNG THỰC TẾ

> [!IMPORTANT]
> **Phát hiện quan trọng nhất trong đợt kiểm toán:**
> Trạng thái thực tế của CSDL `KinhDich_KB` trên máy đã tiến xa hơn so với mô tả tĩnh tại thời điểm viết Handoff B11:
> - CSDL hiện tại **đã nạp đủ toàn bộ 64 quẻ (964 dòng)**, không phải chỉ đến Quẻ 46 (694 dòng).
> - Toàn bộ 964 dòng đã được **duyệt chính thức (`review_status = 'APPROVED'`)** bởi `TruongNhom_IS1906`.
> - Toàn bộ 18 dòng khuyết chữ Hán đã được **điền chữ Hán kiểm chứng qua phương pháp nhập kép (Double-entry)** và ghi nhật ký đầy đủ trong bảng `data_corrections`.

| Hạng mục / Đối tượng | Mô tả trong Handoff B11 | Hiện trạng thực tế tại Data Layer & DB | Kết luận & Đánh giá |
|---|---|---|---|
| **Số lượng bảng (Tables)** | 11 bảng | **12 bảng**: 11 bảng chuẩn + `data_corrections` | Bảng `data_corrections` (51 dòng) do script `data_fixes.py` sinh ra để lưu vết sửa đổi. 11 bảng chuẩn giữ nguyên vẹn. |
| **Số lượng Views** | 5 views | **5 views**: `v_classic_texts_verified`, `v_divination_results`, `v_hexagram_trigrams`, `v_inference_rules_public`, `v_interpretations_public` | Đầy đủ 5 view theo đúng `db/kinhdich_schema_v1.sql`. |
| **Triggers** | 1 trigger (`trg_interp_source_kind`) | **1 trigger** đang kích hoạt (enabled) trên bảng `interpretations` | Đúng thiết kế, chặn lệch `author_type` ↔ `source_kind`. |
| **Stored Procedures** | 0 | **0** | Chưa có Stored Procedure nào. Cần bổ sung ở Migration v3 để Tầng 2 ghi nhận dữ liệu theo quy tắc View-Only. |
| **Nguồn tri thức (`sources`)** | 16 nguồn | **16 dòng** (đã cập nhật `publication_year` qua migration v2) | Nguồn số 15 là `Mai Hoa Dịch Số` (Thiệu Ung) — nguồn tham chiếu chính. |
| **Bát quái đơn (`trigrams`)** | 8 quẻ đơn | **8 dòng** (100% khớp Bát Quái Tiên Thiên / Hậu Thiên) | Đầy đủ Ngũ hành, biểu tượng, số Tiên thiên 1–8. |
| **Quẻ kép (`hexagrams`)** | 64 quẻ | **64 dòng** (Thứ tự Văn Vương 1–64) | Khớp 64 tổ hợp Thượng/Hạ. Cột `name_source` đã có. |
| **Hào (`hexagram_lines`)** | 386 hào | **386 dòng** (384 hào thường + 2 hào đặc biệt Dụng Cửu/Lục tại position = 7) | Đúng 100% ràng buộc kiểm tra `chk_line_validity`. |
| **Kinh văn (`classic_texts`)** | 694 dòng (B11, Quẻ 5–46); Quẻ 1–4 chưa nạp; Quẻ 47–64 chưa nạp | **964 dòng** trong DB (phủ toàn bộ 64 quẻ: Quẻ 1–2 có 17 dòng/quẻ; Quẻ 3–64 có 15 dòng/quẻ) | **Đã nạp đủ 64 quẻ!** Quẻ 1 và 2 có thêm 2 dòng hào đặc biệt (position = 7: Dụng Cửu/Dụng Lục) gồm `HAO_TU` và `TIEU_TUONG`. |
| **Trạng thái duyệt (`verified_by`)** | NULL 100% (View `v_classic_texts_verified` rỗng) | **100% (964/964 dòng) ĐÃ DUYỆT (`APPROVED`)** bởi `TruongNhom_IS1906` | View `v_classic_texts_verified` hiện trả về **964 dòng**. |
| **Khuyết tật chữ Hán (`text_han = NULL`)** | 15 dòng NULL (trong `gaps_all.csv`) | - Trong file JSON thô: 18 dòng.<br>- Trong DB thực tế: **0 dòng NULL** (đã bù đắp qua 19 lệnh UPDATE trong `data_corrections`) | Toàn bộ chữ Hán đã được hoàn thiện bằng phương pháp nhập kép từ ảnh sách gốc. |
| **Quy tắc quan hệ Ngũ hành** | Chưa có dữ liệu | **0 dòng** trong `five_element_relations` | Cần tạo seed 25 quan hệ Ngũ hành trường phái `PLUM_BLOSSOM` ở Pha 3. |
| **Hệ luật suy luận (`inference_rules`)**| Chưa có dữ liệu | **0 dòng** trong `inference_rules` | Cần thiết kế DSL và seed luật ở Pha 3. |
| **Diễn giải (`interpretations`)** | Chưa có dữ liệu | **0 dòng** trong `interpretations` | Cần seed diễn giải cho 6 topic ở Pha 3. |
| **Ca gieo quẻ (`divination_cases`)** | Chưa có dữ liệu | **0 dòng** trong `divination_cases` | Sẽ được ghi nhận thông qua Stored Procedure từ API Tầng 2. |

---

## 3. TÁI HIỆN & KIỂM CHỨNG TOÁN HỌC TRONG `v_divination_results`

### 3.1 Quy ước mã nhị phân (Binary Code Convention)
- **Chuỗi nhị phân 6 ký tự** `c1 c2 c3 c4 c5 c6`:
  - Ký tự bên TRÁI NHẤT ($c_1$) đại diện cho **Hào 6** (Hào Thượng).
  - Ký tự bên PHẢI NHẤT ($c_6$) đại diện cho **Hào 1** (Hào Sơ).
  - Quy ước âm dương: Hào Dương = `1`, Hào Âm = `0`.
- **Ánh xạ hào $k \in \{1, 2, 3, 4, 5, 6\}$ sang vị trí chuỗi 1-indexed (SQL)**:
  $$\text{char\_index}(k) = 7 - k$$
  - $k = 1$ (Hào Sơ) $\rightarrow \text{char\_index} = 6$ (ký tự cuối cùng).
  - $k = 6$ (Hào Thượng) $\rightarrow \text{char\_index} = 1$ (ký tự đầu tiên).
- **Phân tách Quẻ Thượng / Quẻ Hạ**:
  - Quẻ Thượng = `LEFT(binary_code, 3)` = $c_1 c_2 c_3$ (Hào 6, 5, 4).
  - Quẻ Hạ = `RIGHT(binary_code, 3)` = $c_4 c_5 c_6$ (Hào 3, 2, 1).

### 3.2 Công thức tính toán lập quẻ
Áp dụng phép chia lấy dư vòng tròn trong phạm vi $[1..M]$:
$$\text{mod\_cycle}(X, M) = ((X - 1) \pmod M) + 1$$

1. **Phương pháp thời gian (`MAI_HOA_TIME`)**:
   - $X_{\text{upper}} = \text{year\_branch} + \text{lunar\_month} + \text{lunar\_day}$
     $$\text{upper\_n} = ((X_{\text{upper}} - 1) \pmod 8) + 1$$
   - $X_{\text{lower}} = X_{\text{upper}} + \text{hour\_branch}$
     $$\text{lower\_n} = ((X_{\text{lower}} - 1) \pmod 8) + 1$$
   - Hào động:
     $$\text{moving\_line} = ((X_{\text{lower}} - 1) \pmod 6) + 1$$

2. **Phương pháp hai số (`MAI_HOA_NUMBER`)**:
   - Quẻ Thượng: $\text{upper\_n} = ((\text{number\_upper} - 1) \pmod 8) + 1$
   - Quẻ Hạ: $\text{lower\_n} = ((\text{number\_lower} - 1) \pmod 8) + 1$
   - Hào động: $\text{moving\_line} = ((\text{number\_upper} + \text{number\_lower} - 1) \pmod 6) + 1$

3. **Phép xác định Thể — Dụng**:
   - Trong Mai Hoa Dịch Số, quẻ có hào động gọi là **Dụng quái** (chủ về biến đổi, sự việc bên ngoài), quẻ tĩnh không có hào động gọi là **Thể quái** (chủ về bản thể, chủ thể chiêm bói).
   - Nếu $\text{moving\_line} \le 3$: Hào động nằm ở Quẻ Hạ $\rightarrow$ **Quẻ Hạ là DỤNG**, **Quẻ Thượng là THỂ**.
   - Nếu $\text{moving\_line} \ge 4$: Hào động nằm ở Quẻ Thượng $\rightarrow$ **Quẻ Thượng là DỤNG**, **Quẻ Hạ là THỂ**.

4. **Biến quái (Transformed Hexagram)**:
   - Đảo bit tại vị trí $7 - \text{moving\_line}$:
     $$\text{transformed\_binary} = \text{STUFF}(\text{initial\_binary}, 7 - \text{moving\_line}, 1, \text{flip\_bit})$$

5. **Hỗ quái (Nuclear Hexagram)**:
   - Thượng hỗ lấy các hào 5, 4, 3 (vị trí ký tự 2, 3, 4 $\rightarrow$ `SUBSTRING(bin, 2, 3)`).
   - Hạ hỗ lấy các hào 4, 3, 2 (vị trí ký tự 3, 4, 5 $\rightarrow$ `SUBSTRING(bin, 3, 3)`).
   - Hỗ quái = Thượng hỗ + Hạ hỗ $\rightarrow$ `SUBSTRING(bin, 2, 3) + SUBSTRING(bin, 3, 3)`.

### 3.3 Kiểm chứng thực tế qua 3 ca gieo mẫu

| Thông số kiểm tra | Ca 1 (Số: 1, 1) | Ca 2 (Số: 3, 5) | Ca 3 (Thời gian: Tý, T1, N1, Tý) |
|---|---|---|---|
| **Casting Method** | `MAI_HOA_NUMBER` | `MAI_HOA_NUMBER` | `MAI_HOA_TIME` |
| **upper_n / lower_n / moving** | $1 / 1 / 2$ | $3 / 5 / 2$ | $3 / 4 / 4$ |
| **Quẻ Chủ (Initial)** | ID 1: **Thuần Càn** (`111111`) | ID 50: **Hỏa Phong Đỉnh** (`101110`) | ID 21: **Hỏa Lôi Phệ Hạp** (`101001`) |
| **Hào động** | Hào 2 (Nội quái) | Hào 2 (Nội quái) | Hào 4 (Ngoại quái) |
| **Phân định Thể - Dụng** | Dung = LOWER, The = UPPER | Dung = LOWER, The = UPPER | Dung = UPPER, The = LOWER |
| **Hành Thể / Hành Dụng** | Thể: **KIM** / Dụng: **KIM** | Thể: **HOA** / Dụng: **MOC** | Thể: **MOC** / Dụng: **HOA** |
| **Quẻ Hỗ (Nuclear)** | ID 1: **Thuần Càn** (`111111`) | ID 43: **Trạch Thiên Quải** (`011111`) | ID 39: **Thủy Sơn Kiển** (`010100`) |
| **Quẻ Biến (Transformed)** | ID 13: **Thiên Hỏa Đồng Nhân** (`111101`) | ID 56: **Hỏa Sơn Lữ** (`101100`) | ID 27: **Sơn Lôi Di** (`100001`) |
| **Kết quả kiểm toán T-SQL** | **PASS** (khớp hoàn toàn) | **PASS** (khớp hoàn toàn) | **PASS** (khớp hoàn toàn) |

---

## 4. KHOẢNG TRỐNG & HẠN CHẾ CẦN BỔ SUNG TRONG PROCESS LAYER (MIGRATION V3)

Qua kiểm toán, phát hiện 5 khoảng trống kỹ thuật cốt lõi cần được giải quyết ở Tầng 2:

1. **Hạn chế của `v_divination_results` về phân tích Ngũ hành toàn diện**:
   - `v_divination_results` hiện tại chỉ tính Thể và Dụng của **quẻ chủ**.
   - Tuy nhiên, phép đoán Mai Hoa kinh điển (*Mai Hoa Dịch Số - Thiệu Ung*) bắt buộc phải xét thêm quan hệ giữa **Thể quái** với:
     - **Thượng hỗ** và **Hạ hỗ** (phản ánh quá trình diễn biến trung gian).
     - **Quẻ biến** (phản ánh kết quả chung cuộc).
   - *Giải pháp*: Process Layer (Python) sẽ tính toán 3 cặp quan hệ Ngũ hành này dựa trên thông tin quẻ đơn, đồng thời đề xuất view mở rộng trong Migration v3 để hỗ trợ truy vấn tối ưu.

2. **Quy tắc View-Only vs Thao tác ghi dữ liệu**:
   - Kiến trúc KMS yêu cầu Tầng 2 và 3 chỉ đọc qua view, không can thiệp DML trực tiếp lên bảng để bảo vệ tính toàn vẹn tri thức.
   - Tuy nhiên, Tầng 2 vẫn phải ghi nhận ca gieo quẻ (`divination_cases`), bài đóng góp (`interpretations`), luật mới (`inference_rules`), và phản hồi thực chứng.
   - *Giải pháp bắt buộc*: Xây dựng bộ **Stored Procedures** được kiểm soát chặt chẽ (`sp_create_case`, `sp_submit_interpretation`, `sp_review_interpretation`, `sp_record_outcome`) và tạo DB Role `process_layer_role` chỉ có quyền `EXECUTE` trên các thủ tục này và `SELECT` trên các view.

3. **Thiếu thông tin cho chế độ hiển thị Chuyên gia (Expert Mode)**:
   - View `v_classic_texts_verified` hiện chỉ có: `text_id, hexagram_id, line_position, text_type, text_han, text_vn, source_id`.
   - Các trường quan trọng hỗ trợ truy vết chuyên sâu như `confidence`, `source_ref`, `issues`, `review_status`, `verified_by`, `verified_at` (đã có trong bảng từ migration v2) lại bị giấu kín.
   - *Giải pháp*: Tạo view mới `v_classic_texts_expert` trong Migration v3 (giữ nguyên view cũ không đổi).

4. **Truy vết Vòng lặp học tập đôi (Double-Loop Learning Traceability)**:
   - Bảng `divination_cases` có cột `system_output_summary NVARCHAR(MAX)`.
   - Để đo lường độ chính xác của từng quy tắc suy luận khi người dùng gửi `verified_outcome`, cột này bắt buộc phải lưu trữ một đối tượng **JSON có cấu trúc chuẩn hóa**:
     - `engine_version`: phiên bản logic engine.
     - `rules_fired`: danh sách `rule_id` và trọng số đóng góp.
     - `relations_used`: danh sách `relation_id` (Thể–Dụng, Thể–Hỗ, Thể–Biến).
     - `interpretation_ids`: danh sách diễn giải đã trích xuất.
     - `synthesis_score`: điểm số tổng hợp và nhãn phân cực.

5. **Bộ chuyển đổi Lịch âm (Vietnamese Lunar Calendar)**:
   - CSDL chỉ nhận số đã quy đổi (`year_branch_num`, `lunar_month`, `lunar_day`, `hour_branch_num`).
   - Tầng 2 phải tự đảm nhận chuyển đổi dương lịch $\rightarrow$ âm lịch có xử lý tháng nhuận, chuẩn múi giờ `Asia/Ho_Chi_Minh` (UTC+7) dựa trên thuật toán Hồ Ngọc Đức.

---

## 5. ĐÁNH GIÁ MA TRẬN QUAN HỆ NGŨ HÀNH & TRỌNG SỐ (POLARITY WEIGHTS)

Trong bảng `five_element_relations`, mỗi quan hệ được xét từ **góc nhìn của Thể** (Thể là Chủ thể, Dụng là Khách thể / Sự việc bên ngoài):

$$\text{Primary Element} = \text{Thể}, \quad \text{Target Element} = \text{Dụng}$$

Căn cứ văn bản nguồn từ *Mai Hoa Dịch Số* (Thiệu Ung, `source_id = 15`):
- *"Dụng sinh Thể hữu tấn ích chi hỷ"* $\rightarrow$ **`SINH_NHAP`**: Dụng sinh Thể (Khách sinh Chủ, thuận lợi bồi đắp) $\rightarrow$ Trọng số: **`+2`** (Đại Cát).
- *"Thể Dụng tỷ hòa, bách sự thuận toại"* $\rightarrow$ **`TY_HOA`**: Thể và Dụng đồng hành (Hòa hợp, tương trợ lẫn nhau) $\rightarrow$ Trọng số: **`+1`** (Cát / Thuận).
- *"Thể khắc Dụng chu tri sự trì"* $\rightarrow$ **`KHAC_XUAT`**: Thể khắc Dụng (Chủ chế ngự được sự việc, nhưng tiêu hao sinh lực, việc thành nhưng chậm trễ) $\rightarrow$ Trọng số: **`0`** (Bình / Tiểu Cát có điều kiện).
- *"Thể sinh Dụng hữu táng thất chi bi"* $\rightarrow$ **`SINH_XUAT`**: Thể sinh Dụng (Chủ tiết khí vì Khách, hao tổn tài sức) $\rightarrow$ Trọng số: **`-1`** (Tiểu Hung).
- *"Dụng khắc Thể quyết đoạn sự bại"* $\rightarrow$ **`KHAC_NHAP`**: Dụng khắc Thể (Sự việc đè nén, tổn hại chủ thể, nghịch lý) $\rightarrow$ Trọng số: **`-2`** (Đại Hung).

Ma trận này bao gồm đủ $5 \times 5 = 25$ cặp cho trường phái `PLUM_BLOSSOM`, sẽ được nạp trong seed data ở Pha 3.

---

## 6. MÔI TRƯỜNG THỰC THI & RỦI RO KỸ THUẬT

1. **Phiên bản Python**:
   - Môi trường hiện có: `Python 3.14.4` (tại `C:\Python314\python.exe`).
   - Đã cài đặt sẵn: `pandas (3.0.6)`, `numpy (2.5.4)`, `pypdf (6.19.0)`, `python-docx (1.2.0)`, `reportlab (5.0.1)`.
   - **Chưa có**: `fastapi`, `uvicorn`, `pydantic`, `pyodbc`, `pytest`.
   - *Rủi ro*: Quy tắc workspace `AGENTS.md` ghi *"không cài gói"*. Tuy nhiên, yêu cầu bài toán đặt ra là xây dựng REST API bằng FastAPI, Pydantic v2, pyodbc, và test bằng pytest. Cần xin phép người dùng xác nhận cài đặt các thư viện này (hoặc chỉ định môi trường venv).

2. **Kết nối SQL Server**:
   - Server: `DESKTOP-TAFCAMU` (SQL Server 2022 Express / Developer).
   - Cơ chế kết nối: Lệnh `sqlcmd -S "(local)" -E -d KinhDich_KB` chạy hoàn toàn thông suốt với Windows Authentication.
   - Lưu ý Sandbox: Trong môi trường Windows Sandbox, cơ chế Named Pipes / TCP loopback bị cô lập mạng chặn lại; do đó các lệnh kiểm tra DB cần được cấp quyền BypassSandbox phù hợp.

---

## 7. DANH SÁCH CÂU HỎI MỞ CẦN NHÓM & CHUYÊN GIA QUYẾT ĐỊNH (GATE 0)

Trước khi chuyển sang **Pha 1 — Thiết kế Kiến trúc**, kính chuyển các câu hỏi sau để Nhóm 5 / Chuyên gia duyệt và định hướng:

1. **Dữ liệu kinh văn trong DB hiện đã có đủ 64 quẻ (964 dòng)**:
   - *Thực tế*: DB hiện có đủ 64 quẻ, toàn bộ đã được `TruongNhom_IS1906` duyệt `APPROVED`, và không còn dòng Hán văn nào bị NULL.
   - *Câu hỏi*: Process Layer có tiếp tục xử lý kịch bản fallback "thiếu độ phủ kinh văn" (như thiết kế ban đầu để dự phòng cho trường hợp nạp DB khác chưa đủ) hay tối ưu trực tiếp trên giả định DB đã có đủ 64 quẻ?
   *(Khuyến nghị: Vẫn giữ cơ chế fallback phòng vệ để đảm bảo tính module hóa cao và chịu lỗi nếu DB bị rollback).*

2. **Cài đặt thư viện Python cho REST API**:
   - Hiện máy chưa có `fastapi`, `uvicorn`, `pydantic`, `pytest`, `pyodbc`.
   - *Câu hỏi*: Nhóm có cho phép chạy lệnh cài đặt các gói chuẩn này vào môi trường `C:\Python314` (hoặc tạo một `.venv` riêng trong thư mục dự án) để triển khai FastAPI và pytest hay không?

3. **Quy ước Giờ Tý (23:00 – 00:59) trong thuật toán Lịch âm**:
   - *Câu hỏi*: Khi người dùng gieo quẻ lúc 23:30 ngày dương lịch $D$:
     - Phương án A (Dạ Tý / Can Chi ngày mới): Tính là Giờ Tý của ngày âm lịch hôm sau ($D+1$).
     - Phương án B (Chính Tý): 23:00-23:59 vẫn giữ ngày âm lịch hiện tại ($D$), chỉ đổi sang ngày mới từ 00:00.
     *(Khuyến nghị: Phương án A là quy ước phổ biến nhất trong phép lập quẻ Mai Hoa Dịch Số truyền thống).*

4. **Trọng số cho quan hệ Thể khắc Dụng (`KHAC_XUAT`)**:
   - Trong ngũ hành Mai Hoa, Thể khắc Dụng là "chế ngự được nhưng tốn sức".
   - *Câu hỏi*: Nhóm muốn gán `polarity_weight` cho `KHAC_XUAT` là **0** (Trung tính / Bình) hay **+1** (Tiểu cát)?
   *(Khuyến nghị: Gán bằng 0 trong ma trận mặc định, và dùng luật DSL để cộng thêm điểm nếu quẻ được vượng theo mùa).*

---
*Báo cáo kết thúc kiểm toán Pha 0. Sẵn sàng trình duyệt tại Cổng 0.*

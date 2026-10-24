# ADR-003: Thuật Toán Chuyển Đổi Dương Lịch sang Âm Lịch & Quy Ước Giờ Tý
**Dự án:** KinhDich_KB (KMS301 — Nhóm 5, Lớp IS1906)  
**Ngày:** 20/10/2026  
**Trạng thái:** ACCEPTED (Tuân thủ Quyết định 3 của Nhóm)

---

## 1. Ngữ cảnh (Context)
Phương pháp gieo quẻ theo thời gian (`MAI_HOA_TIME`) trong bảng `divination_cases` yêu cầu 4 số nguyên đầu vào đã quy đổi:
- `year_branch_num` $\in [1..12]$ (Tý=1, Sửu=2, Dần=3... Hợi=12).
- `lunar_month` $\in [1..12]$ (Tháng âm lịch).
- `lunar_day` $\in [1..30]$ (Ngày âm lịch).
- `hour_branch_num` $\in [1..12]$ (Tý=1, Sửu=2... Hợi=12).

Để người dùng tiện sử dụng, hệ thống API Tầng 2 phải tự động chuyển đổi từ thời điểm dương lịch (`session_time`) sang các số âm lịch này. Quá trình chuyển đổi đòi hỏi tính chính xác thiên văn (xử lý tháng nhuận, múi giờ Việt Nam UTC+7) và phải xử lý biên giờ Tý (23:00 – 00:59).

## 2. Quyết định (Decision)

### 2.1 Thuật toán Âm lịch Việt Nam
- Áp dụng thuật toán thiên văn kinh điển của **TS. Hồ Ngọc Đức** (Viện Hàn lâm Khoa học và Công nghệ Việt Nam / Đại học Leipzig).
- Căn cứ múi giờ cố định: `Asia/Ho_Chi_Minh` (UTC+7, kinh độ $105^\circ$ Đông).
- Xử lý chính xác:
  - Các tháng âm lịch có độ dài 29 ngày (tháng thiếu) hoặc 30 ngày (tháng đủ).
  - Năm nhuận âm lịch (tháng nhuận được tính cùng số tháng với tháng chính, có cờ `is_leap_month = True`).
  - Giao thừa âm lịch: chuyển đổi năm âm lịch chính xác theo tiết khí / mùng 1 Tết Nguyên Đán.

### 2.2 Quy ước Giờ Tý (`rat_hour_rule`)
Khoảng thời gian 23:00 đến 00:59 được chia làm 2 giai đoạn:
- 23:00 – 23:59: Dạ Tý (Tý muộn).
- 00:00 – 00:59: Sớm Tý (Chính Tý).

Theo quyết định của Nhóm:
1. **Giá trị mặc định**: `rat_hour_rule = 'NEXT_DAY'`.
   - Khi thời gian nằm trong khoảng 23:00 – 23:59 ngày dương lịch $D$, hệ thống tính:
     - `hour_branch_num = 1` (Giờ Tý).
     - Ngày âm lịch tính theo ngày $D + 1$.
   - **Ghi chú nguồn**: `ASSUMPTION: Quy ước Dạ Tý tính sang ngày Can Chi hôm sau theo tập quán Mai Hoa Dịch Số và Lý số Đông phương phổ biến tại Việt Nam`.
2. **Giá trị tùy chọn**: `rat_hour_rule = 'SAME_DAY'`.
   - Giữ nguyên ngày âm lịch $D$ cho khoảng 23:00 – 23:59, chỉ chuyển sang ngày $D+1$ khi qua 00:00.

### 2.3 Minh bạch trong Dữ liệu Trả về
Mọi kết quả gieo quẻ qua endpoint `POST /api/divination` và endpoint tra cứu `GET /api/lunar/convert` đều trả về đầy đủ:
- `solar_datetime`: Thời điểm dương lịch (kèm múi giờ `+07:00`).
- `lunar_date`: `{ "year_branch": "...", "year_branch_num": 1..12, "lunar_month": 1..12, "lunar_day": 1..30, "is_leap_month": bool, "hour_branch": "...", "hour_branch_num": 1..12 }`.
- `rat_hour_convention`: `"NEXT_DAY"` hoặc `"SAME_DAY"`.
- Giá trị này được ghi nhận đồng bộ vào đối tượng JSON trong cột `system_output_summary` của bảng `divination_cases`.

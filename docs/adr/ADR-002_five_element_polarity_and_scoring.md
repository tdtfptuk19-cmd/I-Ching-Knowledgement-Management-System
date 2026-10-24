# ADR-002: Thang Điểm Phân Cực Ngũ Hành Mai Hoa & Công Thức Tính Điểm Tổng Hợp
**Dự án:** KinhDich_KB (KMS301 — Nhóm 5, Lớp IS1906)  
**Ngày:** 20/10/2026  
**Trạng thái:** ACCEPTED (Tuân thủ Quyết định 4 của Nhóm)

---

## 1. Ngữ cảnh (Context)
Trong phép đoán Mai Hoa Dịch Số, phân tích Ngũ hành giữa Thể (Chủ thể) và Dụng (Khách thể / Sự việc bên ngoài) là nền tảng cốt lõi để định hướng Cát/Hung. Hệ thống cần một thang đo lượng hóa khách quan, tất định (deterministic), minh bạch và có truy vết nguồn để tích hợp vào công thức chấm điểm tổng hợp của Tầng 2.

Đồng thời, cần giải quyết rõ sự phân định giữa quan hệ của Thể với:
1. Quẻ Dụng của Quẻ Chủ (giai đoạn ban đầu).
2. Quẻ Hỗ (Thượng hỗ & Hạ hỗ - quá trình diễn biến trung gian).
3. Quẻ Biến (kết quả chung cuộc).

## 2. Quyết định (Decision)

### 2.1 Thang điểm phân cực 5 quan hệ Ngũ hành (`polarity_weight`)
Căn cứ kinh điển từ sách *Mai Hoa Dịch Số* của Thiệu Ung (Nhà Tống, nguồn `sources.source_id = 15`):
- *"Dụng sinh Thể hữu tấn ích chi hỷ"* $\rightarrow$ **`SINH_NHAP`**: Dụng sinh Thể (Khách sinh Chủ) $\rightarrow$ Trọng số: **`+2`** (Đại Cát).
- *"Thể Dụng tỷ hòa, bách sự thuận toại"* $\rightarrow$ **`TY_HOA`**: Thể và Dụng đồng hành $\rightarrow$ Trọng số: **`+1`** (Cát).
- *"Thể khắc Dụng chu tri sự trì"* $\rightarrow$ **`KHAC_XUAT`**: Thể khắc Dụng (Chủ khắc Khách, bản thân khắc phục được khó khăn nhưng tiêu hao năng lượng, sự việc thành nhưng chậm chạp, có trở ngại) $\rightarrow$ Trọng số: **`0`** (Bình hòa / Trung tính, tuân thủ Quyết định 4).
- *"Thể sinh Dụng hữu táng thất chi bi"* $\rightarrow$ **`SINH_XUAT`**: Thể sinh Dụng (Chủ sinh Khách, tiết khí, hao tài tổn lực) $\rightarrow$ Trọng số: **`-1`** (Tiểu Hung).
- *"Dụng khắc Thể quyết đoạn sự bại"* $\rightarrow$ **`KHAC_NHAP`**: Dụng khắc Thể (Khách khắc Chủ, tai họa, nghịch lý) $\rightarrow$ Trọng số: **`-2`** (Đại Hung).

Ma trận này sinh đủ $5 \times 5 = 25$ cặp cho trường phái `PLUM_BLOSSOM` trong bảng `five_element_relations`.

### 2.2 Công thức tính điểm Ngũ hành ($S_{\text{elem}}$)

> [!WARNING]
> **ASSUMPTION – CẦN CHUYÊN GIA XÁC NHẬN (Bộ trọng số Ngũ hành 3 chặng)**:
> Bộ trọng số cho 3 chặng quẻ ($w_{\text{main}} = 0.50$, $w_{\text{nuc}} = 0.20$, $w_{\text{trans}} = 0.30$) là giả định kỹ thuật ban đầu do đội ngũ phát triển đề xuất dựa trên nguyên lý Mai Hoa (Quẻ Chủ định hướng, Quẻ Hỗ trung gian, Quẻ Biến chung cuộc). Bộ trọng số này được cấu hình tập trung trong file `process_layer/app/core/config.py` qua các biến môi trường (`WEIGHT_ELEM_MAIN`, `WEIGHT_ELEM_NUCLEAR`, `WEIGHT_ELEM_TRANSFORMED`) và cần được Hội đồng Chuyên gia thẩm định chính thức.

Điểm Ngũ hành tổng hợp không chỉ xét Quẻ Chủ mà xét đủ 3 chặng của sự việc:
$$S_{\text{elem}} = w_{\text{main}} \cdot P(\text{Thể}, \text{Dụng}) + w_{\text{nuc}} \cdot P_{\text{nuc}} + w_{\text{trans}} \cdot P_{\text{trans}}$$
Trong đó:
- $w_{\text{main}} = 0.50$ (Trọng số quẻ chủ - định hướng ban đầu).
- $w_{\text{nuc}} = 0.20$ (Trọng số quẻ hỗ - quá trình diễn biến). Với $P_{\text{nuc}} = \frac{P(\text{Thể}, \text{Thượng hỗ}) + P(\text{Thể}, \text{Hạ hỗ})}{2}$.
- $w_{\text{trans}} = 0.30$ (Trọng số quẻ biến - kết quả chung cuộc). $P_{\text{trans}} = P(\text{Thể}, \text{Dụng biến})$.
- Giá trị $S_{\text{elem}} \in [-2.0, +2.0]$.

### 2.3 Điểm mở rộng yếu tố Mùa (Seasonal Weight Extension)
- *Trạng thái*: **TẮT MẶC ĐỊNH (`enable_seasonal_weight = False`)** theo quyết định của Nhóm.
- *Thiết kế mở rộng*: Hàm suy luận cung cấp hook nhận tham số tháng sinh vượng/tử tuyệt (Xuân Mộc vượng, Hạ Hỏa vượng, Thu Kim vượng, Đông Thủy vượng, Tứ quý Thổ vượng) để cộng/trừ $\Delta_{\text{season}} \in [-0.5, +0.5]$ khi người dùng bật cờ nâng cao.

### 2.4 Công thức Chấm điểm Tổng hợp Hệ thống ($S_{\text{total}}$)

> [!WARNING]
> **ASSUMPTION – CẦN CHUYÊN GIA XÁC NHẬN (Bộ trọng số 3 Trụ cột Tri thức Hệ thống)**:
> Bộ trọng số phân bổ giữa 3 trụ cột tri thức ($W_{\text{elem}} = 0.40$, $W_{\text{rules}} = 0.35$, $W_{\text{interp}} = 0.25$) là giả định kỹ thuật của Tầng Xử lý. Toàn bộ trọng số này được cấu hình tập trung trong file `process_layer/app/core/config.py` (`WEIGHT_ELEMENT`, `WEIGHT_RULES`, `WEIGHT_INTERPRETATION`) và response API bắt buộc trả về đối tượng phân rã điểm (`decomposition: { element_score, rule_score, interpretation_score }`) để minh bạch tuyệt đối trước người dùng và chuyên gia.

Hệ thống tổng hợp minh bạch 3 trụ cột tri thức:
$$S_{\text{total}} = W_{\text{elem}} \cdot S_{\text{elem}} + W_{\text{rules}} \cdot S_{\text{rules}} + W_{\text{interp}} \cdot S_{\text{interp}}$$
Các trọng số cấu hình (có thể điều chỉnh qua biến môi trường):
- $W_{\text{elem}} = 0.40$ (Ngũ hành Mai Hoa).
- $W_{\text{rules}} = 0.35$ (Bộ luật suy luận logic kích hoạt từ `inference_rules`).
- $W_{\text{interp}} = 0.25$ (Diễn giải chuyên gia đã duyệt theo chủ đề từ `interpretations`).

### 2.5 Phân loại Nhãn Cát / Hung (Polarity Label)
Dựa trên $S_{\text{total}} \in [-2.0, +2.0]$:
- $S_{\text{total}} \ge +1.20$: **ĐẠI CÁT** (Very Auspicious)
- $+0.40 \le S_{\text{total}} < +1.20$: **TIỂU CÁT** (Moderately Auspicious)
- $-0.40 \le S_{\text{total}} < +0.40$: **BÌNH HÒA** (Neutral / Balanced)
- $-1.20 \le S_{\text{total}} < -0.40$: **TIỂU HUNG** (Moderately Inauspicious)
- $S_{\text{total}} < -1.20$: **ĐẠI HUNG** (Very Inauspicious)

Mọi response trả về đều phân rã rõ ràng từng thành phần điểm (Decomposition) và danh sách nguồn trích dẫn tương ứng.

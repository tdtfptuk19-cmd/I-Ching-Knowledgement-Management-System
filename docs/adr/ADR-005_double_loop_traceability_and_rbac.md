# ADR-005: Truy Vết Vòng Lặp Học Tập Đôi (Double-Loop Learning) & Bảo Mật RBAC/HMAC
**Dự án:** KinhDich_KB (KMS301 — Nhóm 5, Lớp IS1906)  
**Ngày:** 20/10/2026  
**Trạng thái:** ACCEPTED

---

## 1. Ngữ cảnh (Context)
Lý thuyết Quản trị Tri thức của **Chris Argyris & Donald Schön (1978)** và **Mark McElroy (1999)** phân biệt rõ:
- **Vòng lặp đơn (Single-loop learning)**: Sửa chữa sai lệch vận hành tức thời mà không thay đổi cấu trúc nền tảng.
- **Vòng lặp đôi (Double-loop learning)**: Thu thập thực chứng thực tế (`verified_outcome`) để thẩm định, chất vấn và tinh chỉnh lại chính các quy tắc suy luận (`inference_rules`) và các giả định tri thức cốt lõi.

Trong Data Layer, bảng `divination_cases` cung cấp 2 cột `system_output_summary NVARCHAR(MAX)` và `verified_outcome NVARCHAR(MAX)`. Để thực hiện được vòng lặp đôi, cột `system_output_summary` phải lưu cấu trúc dữ liệu đủ giàu để liên kết ngược: "Kết luận này được sinh ra từ những luật nào, quan hệ nào, diễn giải nào?".

Đồng thời, CSDL không có bảng người dùng (Users), do đó Tầng 2 phải tự quản lý định danh người dùng theo chuẩn bảo mật không lưu thông tin cá nhân (PII), và phân quyền truy cập (RBAC).

## 2. Quyết định (Decision)

### 2.1 Cấu trúc JSON Chuẩn hóa của `system_output_summary`
Khi ca gieo quẻ được khởi tạo qua `POST /api/divination`, Process Layer sinh và lưu trữ đối tượng JSON chuẩn hóa vào `system_output_summary`:
```json
{
  "engine_version": "1.0.0",
  "generated_at": "2026-10-20T11:45:00Z",
  "lunar_meta": {
    "solar_date": "2026-10-20T23:30:00+07:00",
    "lunar_date": "2026-09-12",
    "rat_hour_rule": "NEXT_DAY",
    "year_branch": "Ngọ",
    "hour_branch": "Tý"
  },
  "trigram_analysis": {
    "initial_hex_id": 21,
    "transformed_hex_id": 27,
    "nuclear_hex_id": 39,
    "moving_line": 4,
    "dung_side": "UPPER",
    "the_element": "MOC",
    "dung_element": "HOA"
  },
  "relations_used": [
    { "role": "MAIN", "primary": "MOC", "target": "HOA", "type": "SINH_XUAT", "weight": -1, "relation_id": 14 },
    { "role": "NUCLEAR", "primary": "MOC", "target": "THUY", "type": "SINH_NHAP", "weight": 2, "relation_id": 6 },
    { "role": "TRANSFORMED", "primary": "MOC", "target": "THO", "type": "KHAC_XUAT", "weight": 0, "relation_id": 17 }
  ],
  "rules_fired": [
    { "rule_id": 102, "rule_code": "PB_MOC_SINH_XUAT", "priority": 80, "weight": -1 }
  ],
  "interpretation_ids": [45, 82],
  "classic_text_ids": [301, 302, 305],
  "synthesis": {
    "score": -0.35,
    "label": "BÌNH HÒA",
    "breakdown": {
      "element_score": -0.20,
      "rule_score": -0.50,
      "interpretation_score": -0.40
    }
  }
}
```

### 2.2 Vòng lặp học tập đôi trong thống kê (`learning_service.py`)
Khi endpoint `PUT /api/divination/{case_id}/feedback` ghi nhận kết quả thực chứng, hệ thống định kỳ (hoặc theo yêu cầu qua `GET /api/governance/stats`) thực hiện phân tích đối chiếu:
- Tần suất kích hoạt của từng `rule_id`.
- Tỷ lệ dự đoán của luật trùng khớp với kết quả thực tế (Accuracy / Success rate).
- **Cảnh báo luật nghi vấn (`review_needed_rules`)**: Đánh dấu các luật có tỷ lệ sai lệch thực chứng cao ($> 40\%$) để chuyên gia xem xét lại (Hệ thống tuyệt đối không tự sửa luật).

### 2.3 Bảo mật Danh tính bằng HMAC-SHA256
- Để tuân thủ Luật An toàn thông tin và không lưu trữ PII thô:
  $$\text{pseudonymized\_user\_hash} = \text{HMAC-SHA256}(\text{user\_id}, \text{SERVER\_SECRET}).\text{hexdigest()}$$
- Chuỗi trả về có độ dài đúng 64 ký tự Hex, vừa vặn với kiểu `VARCHAR(64)` của cột `pseudonymized_user_hash`.
- Secret được cấu hình qua biến môi trường `HMAC_SERVER_SECRET`, không hard-code.

### 2.4 Ma trận Phân quyền Ứng dụng (RBAC Matrix)

| Vai trò (Role) | Mô tả & Đối tượng | Quyền hạn trên API |
|---|---|---|
| **NOVICE** | Người mới tìm hiểu, người hỏi quẻ phổ thông | - Gieo quẻ (`POST /api/divination`)<br>- Xem quẻ và lời khuyên tổng hợp<br>- Tra cứu quẻ (`GET /api/hexagram/{id}`)<br>- Tìm kiếm cơ bản |
| **PRACTITIONER** | Người thực hành Kinh Dịch, hội viên | - Đầy đủ quyền NOVICE<br>- Xem chi tiết quẻ biến, quẻ hỗ, kinh văn dịch thơ<br>- Gửi phản hồi thực chứng cho ca gieo của chính mình (`PUT /api/divination/{case_id}/feedback`) |
| **EXPERT** | Chuyên gia Dịch học, nhà nghiên cứu | - Đầy đủ quyền PRACTITIONER<br>- Xem toàn văn Hán văn, Thoán truyện, Tiểu tượng, độ tin cậy (`confidence`), nguồn trích dẫn (`source_ref`)<br>- Xem vết suy luận luật (`rule_trace`)<br>- Đóng góp diễn giải & luật mới (`POST /api/interpretations`, `POST /api/rules`) ở trạng thái `PENDING` |
| **REVIEWER** | Hội đồng kiểm duyệt tri thức | - Đầy đủ quyền EXPERT<br>- Xem hàng đợi duyệt (`GET /api/review/queue`)<br>- Phê duyệt / Từ chối bài đóng góp (`PUT /api/interpretations/{id}/review`)<br>- Đánh dấu ca gieo quẻ mẫu (Best Practice)<br>- **Ràng buộc**: Tuyệt đối không được duyệt bài do chính mình đóng góp |
| **ADMIN** | Quản trị viên hệ thống | - Xem toàn bộ báo cáo KMS (`GET /api/governance/stats`)<br>- Giám sát sức khỏe hệ thống (`GET /api/health`) |

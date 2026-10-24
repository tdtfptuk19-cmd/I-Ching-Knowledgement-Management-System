# ADR-001: Kiến Trúc Tầng Xử Lý (Process Layer) & Cơ Chế Tuân Thủ View-Only
**Dự án:** KinhDich_KB (KMS301 — Nhóm 5, Lớp IS1906)  
**Ngày:** 20/10/2026  
**Trạng thái:** ACCEPTED (Đã duyệt sơ bộ cho Pha 1)

---

## 1. Ngữ cảnh (Context)
Hệ thống Quản trị Tri thức (KMS) KinhDich_KB áp dụng kiến trúc 3 tầng chuẩn KMS301:
- **Tầng 1 — Data Layer (SQL Server)**: Lưu trữ tri thức gốc, bảng taxonomy, kinh văn nguyên tử, quy tắc suy luận, diễn giải và lịch sử ca gieo quẻ.
- **Tầng 2 — Process Layer (Reasoning & Logic Engine - FastAPI/Python)**: Tiếp nhận yêu cầu, tính toán ngũ hành, thực thi luật suy luận, tổng hợp tri thức, quản trị phê duyệt và phản hồi thực chứng.
- **Tầng 3 — UI Layer (Knowledge Portal)**: Giao diện tương tác người dùng.

Theo tài liệu bàn giao `HANDOFF_TANG_DU_LIEU_KMS301.md` (Mục 4 và Mục 8), Tầng 2 và Tầng 3 **chỉ được phép đọc dữ liệu thông qua các Views công khai**, tuyệt đối không chạy các lệnh DML trực tiếp (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`) trên 10 bảng bảo vệ để bảo toàn tính toàn vẹn tri thức.

Tuy nhiên, Process Layer bắt buộc phải thực hiện các thao tác ghi dữ liệu nghiệp vụ:
1. Ghi nhận ca gieo quẻ (`divination_cases`).
2. Tiếp nhận đóng góp diễn giải tri thức mới (`interpretations`, trạng thái mặc định `PENDING`).
3. Chuyên gia phê duyệt/từ chối tri thức (`sp_review_interpretation`).
4. Người dùng gửi phản hồi kết quả thực tế (`verified_outcome`) phục vụ vòng lặp học tập đôi.

## 2. Quyết định (Decision)
1. **Toàn bộ thao tác ĐỌC (Read-only)**:
   - Process Layer chỉ truy vấn qua các Views: `v_classic_texts_verified`, `v_hexagram_trigrams`, `v_divination_results`, `v_inference_rules_public`, `v_interpretations_public`, và view mở rộng mới `v_classic_texts_expert` (tại Migration v3).
2. **Toàn bộ thao tác GHI (Controlled Write-only)**:
   - Tuyệt đối không sinh câu lệnh `INSERT/UPDATE` trực tiếp từ ứng dụng vào bảng vật lý.
   - Đóng gói toàn bộ thao tác ghi vào 4 **Stored Procedures T-SQL** có giao dịch (`TRANSACTION`), bẫy lỗi (`TRY...CATCH`), và kiểm tra tính toàn vẹn nghiệp vụ:
     - `sp_create_case`: Ghi nhận ca gieo quẻ, validate tham số đầu vào.
     - `sp_submit_interpretation`: Tiếp nhận diễn giải mới, bắt buộc `review_status = 'PENDING'`, kiểm tra trigger nguồn.
     - `sp_review_interpretation`: Duyệt bài, bắt buộc `reviewed_by` khác tác giả, kiểm tra trạng thái chuyển đổi.
     - `sp_record_outcome`: Cập nhật thực chứng, hỗ trợ gắn cờ best-practice.
3. **Phân quyền CSDL (DB Role & Permissions)**:
   - Khởi tạo Database Role `db_process_layer`.
   - `GRANT SELECT ON <views> TO db_process_layer`.
   - `GRANT EXECUTE ON <stored_procedures> TO db_process_layer`.
   - `DENY INSERT, UPDATE, DELETE ON <protected_tables> TO db_process_layer`.

## 3. Hệ quả (Consequences)
- **Tích cực**:
  - Bảo vệ tuyệt đối Data Layer khỏi lỗi ứng dụng hoặc SQL Injection làm sai lệch tri thức.
  - Tách bạch rõ ràng trách nhiệm giữa Tầng Dữ liệu và Tầng Xử lý.
  - Kiểm soát chặt chẽ quy trình kiểm duyệt (Human-in-the-loop Gate): tác giả không thể tự duyệt bài của mình; AI không thể tự chuyển trạng thái `APPROVED`.
- **Hạn chế & Giải pháp**:
  - Cần duy trì mã nguồn Stored Procedure đồng bộ trong Migration v3 và có script rollback tương ứng.

# Quy tắc Workspace (Workspace Rules) — Dự án KMS301 / KinhDich_KB

## A. VAI TRÒ VÀ NGUYÊN TẮC

Bạn là NGƯỜI VẬN HÀNH quy trình, không phải tác giả dữ liệu. Chỉ MỘT agent, không tạo agent con, không tìm kiếm web, không cài gói.

### A1. Quy tắc dữ liệu (bắt buộc, L1 đến L13)
- L1. text_han chỉ chứa chữ Hán. Cấm chữ Latin, số, khoảng trắng; bỏ hết dấu câu. Không đọc được hoặc không chắc: text_han = null.
- L2. Chữ Hán chỉ đọc được một phần: text_han = null cho cả dòng, confidence "medium".
- L3. text_vn giữ NGUYÊN các dòng như nguồn (kể cả nhãn như "Hào Sơ Cửu.", "Tượng viết:", và chỗ ngắt dòng của nguồn). Chỉ cho phép chuẩn hóa: cắt khoảng trắng đầu/cuối dòng, gộp dãy khoảng trắng bên trong thành một, bỏ dòng trống. Không thêm nhãn, không nối dòng, không sửa chữ, không sửa dấu câu.
- L4. Biến thể chữ của nguồn: giữ nguyên, ghi "source_variant: <chữ trong nguồn>" vào _meta.issues.
- L5. VAN_NGON hoãn: KHÔNG xuất, KHÔNG nạp.
- L6. Sau khi có JSON phải chạy audit và liệt kê mọi lệch. Không tự sửa JSON.
- L7. Không bao giờ chạy DROP, DELETE, TRUNCATE, UPDATE, ALTER (ngoại trừ các lệnh nằm trong file SQL do load_json_to_sql.py sinh ra từ file final của người dùng). Không đụng bảng sources, trigrams, hexagrams, hexagram_lines, interpretations, inference_rules, five_element_relations, tags, divination_cases.
- L8. Chạy .sql bằng sqlcmd: tham số `-S "(local)" -E -d KinhDich_KB -b -f 65001 -I`, dùng BẢN SAO KHÔNG BOM trong _out\ (không sửa file gốc).
- L9. Không chạy script nào có thể ghi vào hoặc sinh lại bất kỳ file *.json dữ liệu trong _out\ ngoài tệp *.generated.json của batch đang làm. Lệnh xem/so sánh phải chỉ đọc.
- L10. Parser chỉ ghi ra _out\<P>.generated.json. File chính thức final_<P>.json do NGƯỜI DÙNG tạo (sao chép rồi sửa tay). Sau khi final được chốt không chạy lại bất kỳ script nào có thể ghi đè nó.
- L11. Chữ Hán từ trí nhớ (không có trong PDF) chỉ được ghi trong _meta.issues với tiền tố "memory_hint:", KHÔNG BAO GIỜ điền vào text_han/text_vn. Khi chữ Hán không đọc được chỉ ghi "han_text_unreadable" kèm vị trí, không ghi chuỗi "chuẩn".
- L12. text_han/text_vn phải do parser CẮT TỰ ĐỘNG từ văn bản thô. Không gõ, không viết lại, không viết sẵn trong script.
- L13. Nguồn thiếu tiền tố (彖曰, 象曰) hoặc in lặp văn bản của hào khác: giữ nguyên theo nguồn (hoặc null nếu lặp nhầm), ghi "source_defect". Khi giải thích mọi điều bất thường: CHỈ in bằng chứng nguyên văn kèm số trang, không dùng trí nhớ về nội dung Kinh Dịch.

### A2. Công cụ
- KHÔNG sửa hay viết lại bất kỳ công cụ nào trong D:\MySQL\db\ và hai script _out\extract_core.py, _out\audit_json_vs_pdf_v3.py. Nếu công cụ lỗi: DỪNG và báo lỗi nguyên văn, không vá.
- Được tạo script TẠM trong scratch\ để đọc/so sánh/lập báo cáo. Script tạm không được ghi vào *.json trong _out\.

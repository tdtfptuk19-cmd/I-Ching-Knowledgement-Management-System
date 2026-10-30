/* =====================================================================
   KinhDich_KB — Seed Data: inference_rules (Hệ Luật Suy Luận Mai Hoa Dịch Số)
   Dự án: KMS301 — Nhóm 5, Lớp IS1906
   
   Nguyên tắc:
     - Tuân thủ cấu trúc Rule DSL v1 (process_layer/schemas/rule_dsl.schema.json).
     - Mỗi luật có nguồn thật (source_id = 15: Mai Hoa Dịch Số - Thiệu Ung).
     - Bao phủ toàn diện 5 chuyên đề thực tế: CAREER, FINANCE, RELATIONSHIP, HEALTH, ACADEMIC
       trên 5 mối quan hệ Thể Dụng cốt lõi (SINH_NHAP, TY_HOA, KHAC_XUAT, SINH_XUAT, KHAC_NHAP).
     - Toàn bộ bản ghi thiết lập review_status = 'APPROVED' cho môi trường phát triển & kiểm thử.
   ===================================================================== */

USE KinhDich_KB_dev;
GO

SET NOCOUNT ON;
PRINT N'=== Nap Seed He Luat Suy Luan Mai Hoa Chuyen Gia (inference_rules) ===';

-- Guard an toàn: Chặn đứng nếu đang chạy trên DB Production
IF DB_NAME() = N'KinhDich_KB'
BEGIN
    RAISERROR(N'GUARD VIOLATION: Khong duoc nap seed truc tiep vao KinhDich_KB! Chi nap vao KinhDich_KB_dev.', 16, 1);
    RETURN;
END;
GO

-- =====================================================================
-- I. CÁC QUY TẮC CỐT LÕI (CORE THE DUNG RULES - DÙNG CHO MỌI CHỦ ĐỀ)
-- =====================================================================

-- 1. Dụng Sinh Thể (Đại Cát)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_SINH_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Thể Dụng Tổng Quyết: "Dụng sinh Thể hữu tấn ích chi hỷ". Ngoại cảnh bồi đắp chủ thể, trăm sự khởi sắc, mưu sự đại cát.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}}',
    N'Dụng ({dung_element}) sinh Thể ({the_element}): Điềm Đại Cát. Ngoại cảnh thuận lợi, nhân hòa tương trợ, mưu sự dễ thành.',
    100, 15, 1, 'APPROVED'
);

-- 2. Thể Dụng Tỷ Hòa (Cát)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_TY_HOA', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Thể Dụng Tổng Quyết: "Thể Dụng tỷ hòa, bách sự thuận toại". Đồng khí tương cầu, thế cục bình ổn hòa hợp.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "TY_HOA"}}',
    N'Thể ({the_element}) và Dụng ({dung_element}) Tỷ Hòa: Điềm Cát. Nội ngoại tương đồng, hợp tác thuận lợi, thế sự an định.',
    90, 15, 1, 'APPROVED'
);

-- 3. Thể Khắc Dụng (Bình Hòa / Sự Trì)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_KHAC_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Thể Dụng Tổng Quyết: "Thể khắc Dụng chu tri sự trì". Bản thân chế ngự được trở ngại nhưng hao sức, sự việc thành nhưng chậm trễ.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}}',
    N'Thể ({the_element}) khắc Dụng ({dung_element}): Điềm Bình Hòa. Chủ thể khống chế được ngoại cảnh nhưng tốn hao công sức, công việc thành nhưng có độ trễ.',
    85, 15, 1, 'APPROVED'
);

-- 4. Thể Sinh Dụng (Tiểu Hung / Hao Tổn)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_SINH_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Thể Dụng Tổng Quyết: "Thể sinh Dụng hữu táng thất chi bi". Chủ thể tiết khí vì ngoại cảnh, cẩn trọng hao tài tổn sức.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}}',
    N'Thể ({the_element}) sinh Dụng ({dung_element}): Điềm Tiểu Hung. Chủ thể bị tiết khí, tổn hao nguyên khí hoặc tài lực vì việc bên ngoài, nên giữ mình thận trọng.',
    80, 15, 1, 'APPROVED'
);

-- 5. Dụng Khắc Thể (Đại Hung / Tai Họa)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_KHAC_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Thể Dụng Tổng Quyết: "Dụng khắc Thể quyết đoạn sự bại". Ngoại cảnh đè nén, hiểm họa tứ bề, chớ nên manh động.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}}',
    N'Dụng ({dung_element}) khắc Thể ({the_element}): Điềm Đại Hung. Nghịch cảnh đè nén, có nguy cơ thất bại hoặc gặp tai ương nếu tiến bước phiêu lưu.',
    95, 15, 1, 'APPROVED'
);

-- 6. Hào động nội quái (moving_line <= 3)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_MOVING_INTERNAL')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_MOVING_INTERNAL', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Động Tĩnh Chiêm: Hào động ở quẻ Hạ (hào 1-3) chủ về nội tâm, gia đạo hoặc nguyên nhân sâu xa từ nội bộ.',
    N'{"dsl_version": 1, "condition": {"field": "moving_line", "op": "lte", "value": 3}}',
    N'Hào động {moving_line} nằm tại Hạ quái: Biến động phát khởi từ nội bộ. Cần chấn chỉnh nền tảng bên trong trước khi mở rộng ra ngoài.',
    60, 15, 1, 'APPROVED'
);

-- 7. Hào động ngoại quái (moving_line >= 4)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_MOVING_EXTERNAL')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_MOVING_EXTERNAL', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số (Thiệu Ung) - Động Tĩnh Chiêm: Hào động ở quẻ Thượng (hào 4-6) chủ về xã hội, đối tác hoặc thời cuộc tác động từ bên ngoài.',
    N'{"dsl_version": 1, "condition": {"field": "moving_line", "op": "gte", "value": 4}}',
    N'Hào động {moving_line} nằm tại Thượng quái: Biến động đến từ môi trường khách quan bên ngoài. Cần thích ứng linh hoạt với chuyển dịch của thời cuộc.',
    60, 15, 1, 'APPROVED'
);

-- =====================================================================
-- II. CHUYÊN ĐỀ SỰ NGHIỆP / CÔNG DANH (CAREER)
-- =====================================================================

-- 8. CAREER + SINH_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CAREER_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CAREER_SINH_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Chiêm Cầu danh: Dụng sinh Thể là được quý nhân tiến cử, cấp trên nâng đỡ, thời cơ thăng tiến hanh thông.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}, {"field": "topic", "op": "eq", "value": "CAREER"}]}}',
    N'Sự nghiệp (CAREER): Thời vận hanh thông, cấp trên nâng đỡ, quý nhân trợ lực, cơ hội thăng tiến mở rộng, mưu sự đại cát.',
    120, 15, 1, 'APPROVED'
);

-- 9. CAREER + TY_HOA
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CAREER_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CAREER_TY_HOA', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể Dụng tỷ hòa trong công danh: Đồng liêu tương trợ, quan hệ đối tác bình đẳng hòa thuận, vị thế củng cố.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "TY_HOA"}, {"field": "topic", "op": "eq", "value": "CAREER"}]}}',
    N'Sự nghiệp (CAREER): Nội bộ đồng tâm hiệp lực, đối tác cùng chí hướng, vị thế vững chắc, phát triển trong thế an định.',
    115, 15, 1, 'APPROVED'
);

-- 10. CAREER + KHAC_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CAREER_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CAREER_KHAC_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể khắc Dụng trong sự nghiệp: Cạnh tranh quyết liệt, bản thân làm chủ cục diện nhưng phải dụng nhiều công phu.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}, {"field": "topic", "op": "eq", "value": "CAREER"}]}}',
    N'Sự nghiệp (CAREER): Cạnh tranh quyết liệt; bản thân làm chủ tình thế nhưng cần kiên trì, công việc thành nhưng có độ trễ.',
    110, 15, 1, 'APPROVED'
);

-- 11. CAREER + SINH_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CAREER_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CAREER_SINH_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể sinh Dụng trong sự nghiệp: Tiết khí hao tổn, cống hiến nhiều nhưng đãi ngộ chưa tương xứng, tránh ôm đồm.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}, {"field": "topic", "op": "eq", "value": "CAREER"}]}}',
    N'Sự nghiệp (CAREER): Hao tâm tổn trí, gánh vác việc chung nhưng quyền lợi chưa tương xứng; cần tránh ôm đồm quá sức.',
    110, 15, 1, 'APPROVED'
);

-- 12. CAREER + KHAC_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CAREER_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CAREER_KHAC_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Dụng khắc Thể trong công danh: Bị thị phi gièm pha, môi trường làm việc gây sức ép, nên thủ thế kiên nhẫn.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}, {"field": "topic", "op": "eq", "value": "CAREER"}]}}',
    N'Sự nghiệp (CAREER): Áp lực thị phi, cấp trên hoặc môi trường gây trở ngại; cần thủ thế kiên nhẫn, tránh tranh chấp trực diện.',
    120, 15, 1, 'APPROVED'
);

-- =====================================================================
-- III. CHUYÊN ĐỀ TÀI CHÍNH / KINH DOANH (FINANCE)
-- =====================================================================

-- 13. FINANCE + SINH_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_FINANCE_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_FINANCE_SINH_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Chiêm Cầu tài: Dụng sinh Thể là tiền tài tự quy tụ, buôn bán sinh lời nhanh chóng, đối tác rót vốn thuận lợi.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}, {"field": "topic", "op": "eq", "value": "FINANCE"}]}}',
    N'Tài chính (FINANCE): Tài nguyên dồi dào, dòng tiền lưu chuyển hanh thông, đối tác mang lại lợi nhuận, mưu tài đại cát.',
    120, 15, 1, 'APPROVED'
);

-- 14. FINANCE + TY_HOA
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_FINANCE_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_FINANCE_TY_HOA', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể Dụng tỷ hòa trong cầu tài: Mua bán thuận mua vừa bán, khế ước phân minh, tài chính cân bằng ổn định.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "TY_HOA"}, {"field": "topic", "op": "eq", "value": "FINANCE"}]}}',
    N'Tài chính (FINANCE): Giao dịch công bằng minh bạch, tài chính bình ổn, đôi bên cùng có lợi, tích lũy đều đặn bền vững.',
    115, 15, 1, 'APPROVED'
);

-- 15. FINANCE + KHAC_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_FINANCE_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_FINANCE_KHAC_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể khắc Dụng trong tài vụ: Cầu tài có đắc nhưng phải trải qua đàm phán gian nan, thu hồi công nợ chậm hơn dự tính.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}, {"field": "topic", "op": "eq", "value": "FINANCE"}]}}',
    N'Tài chính (FINANCE): Có lợi nhuận thu về nhưng phải qua đàm phán gian nan; tiền về chậm hơn dự tính ban đầu.',
    110, 15, 1, 'APPROVED'
);

-- 16. FINANCE + SINH_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_FINANCE_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_FINANCE_SINH_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể sinh Dụng trong tài vụ: Tổn tài tiết khí, chi vượt thu, cẩn trọng rủi ro thanh khoản, tránh vay mượn mở rộng.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}, {"field": "topic", "op": "eq", "value": "FINANCE"}]}}',
    N'Tài chính (FINANCE): Chi phí phát sinh lớn, đầu tư tốn kém; cẩn trọng rủi ro thanh khoản, không nên vay mượn mạo hiểm.',
    110, 15, 1, 'APPROVED'
);

-- 17. FINANCE + KHAC_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_FINANCE_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_FINANCE_KHAC_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Dụng khắc Thể trong cầu tài: Thất thoát tài chính, đối tác bội tín hoặc thị trường đảo chiều bất lợi, tuyệt đối tránh đầu cơ.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}, {"field": "topic", "op": "eq", "value": "FINANCE"}]}}',
    N'Tài chính (FINANCE): Nguy cơ thâm hụt tài chính, thị trường đảo chiều hoặc đối tác bội tín; tuyệt đối tránh đầu cơ phiêu lưu.',
    120, 15, 1, 'APPROVED'
);

-- =====================================================================
-- IV. CHUYÊN ĐỀ QUAN HỆ / GIA ĐẠO (RELATIONSHIP)
-- =====================================================================

-- 18. RELATIONSHIP + SINH_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_RELATIONSHIP_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_RELATIONSHIP_SINH_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Chiêm Hôn nhân / Giao tế: Dụng sinh Thể là nhân duyên tốt đẹp, đối phương chân thành yêu thương và bao bọc.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}, {"field": "topic", "op": "eq", "value": "RELATIONSHIP"}]}}',
    N'Quan hệ (RELATIONSHIP): Đối phương chân thành vun đắp, tình cảm gắn kết sâu sắc, có quý nhân kết nối hòa hợp.',
    120, 15, 1, 'APPROVED'
);

-- 19. RELATIONSHIP + TY_HOA
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_RELATIONSHIP_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_RELATIONSHIP_TY_HOA', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể Dụng tỷ hòa trong tình cảm: Đôi bên môn đăng hộ đối, tính tình tương hợp, gia đạo thuận hòa an vui.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "TY_HOA"}, {"field": "topic", "op": "eq", "value": "RELATIONSHIP"}]}}',
    N'Quan hệ (RELATIONSHIP): Đôi bên đồng điệu tâm hồn, tôn trọng bình đẳng, thấu hiểu lẫn nhau, nền tảng gắn bó bền chặt.',
    115, 15, 1, 'APPROVED'
);

-- 20. RELATIONSHIP + KHAC_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_RELATIONSHIP_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_RELATIONSHIP_KHAC_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể khắc Dụng trong nhân duyên: Khắc chế đối phương, tuy nắm thế chủ động nhưng dễ sinh rạn nứt ngầm nếu thiếu lắng nghe.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}, {"field": "topic", "op": "eq", "value": "RELATIONSHIP"}]}}',
    N'Quan hệ (RELATIONSHIP): Tình thế áp đặt một chiều; cần học cách lắng nghe, hạ bớt cái tôi cá nhân để duy trì hòa khí.',
    110, 15, 1, 'APPROVED'
);

-- 21. RELATIONSHIP + SINH_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_RELATIONSHIP_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_RELATIONSHIP_SINH_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể sinh Dụng trong giao tế: Vì người lụy mình, chịu nhiều thiệt thòi tình cảm, cần thiết lập ranh giới rõ ràng.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}, {"field": "topic", "op": "eq", "value": "RELATIONSHIP"}]}}',
    N'Quan hệ (RELATIONSHIP): Cho đi nhiều hơn nhận lại, chịu nhiều thiệt thòi vì người khác; cần xây dựng ranh giới lành mạnh.',
    110, 15, 1, 'APPROVED'
);

-- 22. RELATIONSHIP + KHAC_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_RELATIONSHIP_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_RELATIONSHIP_KHAC_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Dụng khắc Thể trong tình cảm: Bất hòa gay gắt, khắc khẩu tổn thương, ngoại cảnh can thiệp gây chia rẽ.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}, {"field": "topic", "op": "eq", "value": "RELATIONSHIP"}]}}',
    N'Quan hệ (RELATIONSHIP): Bất đồng sâu sắc, xung khắc đối kháng; cần nhẫn nại dĩ hòa vi quý, tránh đẩy mâu thuẫn lên cao trào.',
    120, 15, 1, 'APPROVED'
);

-- =====================================================================
-- V. CHUYÊN ĐỀ SỨC KHỎE / THỂ CHẤT (HEALTH)
-- =====================================================================

-- 23. HEALTH + SINH_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_HEALTH_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_HEALTH_SINH_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Chiêm Tật bệnh: Dụng sinh Thể là chính khí vượng, gặp thầy gặp thuốc, thể trạng phục hồi nhanh chóng.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}, {"field": "topic", "op": "eq", "value": "HEALTH"}]}}',
    N'Sức khỏe (HEALTH): Chính khí dồi dào, cơ thể phục hồi tốt, gặp thầy gặp thuốc, thể trạng khởi sắc nhanh chóng.',
    120, 15, 1, 'APPROVED'
);

-- 24. HEALTH + TY_HOA
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_HEALTH_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_HEALTH_TY_HOA', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể Dụng tỷ hòa trong tật bệnh: Âm dương quân bình, khí huyết điều hòa, bệnh không phát tác nghiêm trọng.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "TY_HOA"}, {"field": "topic", "op": "eq", "value": "HEALTH"}]}}',
    N'Sức khỏe (HEALTH): Khí huyết điều hòa, âm dương cân bằng; cần duy trì chế độ sinh hoạt và rèn luyện thể chất ổn định.',
    115, 15, 1, 'APPROVED'
);

-- 25. HEALTH + KHAC_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_HEALTH_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_HEALTH_KHAC_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể khắc Dụng trong tật bệnh: Chính khí thắng tà khí, bệnh lui dần nhưng còn suy nhược, cần bồi dưỡng khí lực.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}, {"field": "topic", "op": "eq", "value": "HEALTH"}]}}',
    N'Sức khỏe (HEALTH): Thể trạng kháng cự tốt, bệnh lui dần nhưng còn suy nhược; cần chú trọng bồi bổ dinh dưỡng và nghỉ ngơi.',
    110, 15, 1, 'APPROVED'
);

-- 26. HEALTH + SINH_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_HEALTH_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_HEALTH_SINH_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể sinh Dụng trong tật bệnh: Tiết khí tổn thương nguyên khí, suy nhược vì lao lực, cần nghỉ ngơi tĩnh dưỡng.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}, {"field": "topic", "op": "eq", "value": "HEALTH"}]}}',
    N'Sức khỏe (HEALTH): Lao lực quá độ, khí lực hao tán, căng thẳng kéo dài; cần nghỉ ngơi phục hồi và giảm tải công việc.',
    110, 15, 1, 'APPROVED'
);

-- 27. HEALTH + KHAC_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_HEALTH_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_HEALTH_KHAC_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Dụng khắc Thể trong tật bệnh: Tà khí áp chế chính khí, ngũ hành tương xung, bệnh có nguy cơ trở nặng.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}, {"field": "topic", "op": "eq", "value": "HEALTH"}]}}',
    N'Sức khỏe (HEALTH): Khí huyết tương xung, chính khí suy thoái; cần sớm tham vấn y tế chuyên khoa và tuân thủ phác đồ điều trị.',
    120, 15, 1, 'APPROVED'
);

-- =====================================================================
-- VI. CHUYÊN ĐỀ HỌC VẤN / THI CỬ (ACADEMIC)
-- =====================================================================

-- 28. ACADEMIC + SINH_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_ACADEMIC_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_ACADEMIC_SINH_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Chiêm Cầu danh / Khoa cử: Dụng sinh Thể là thi cử đỗ đạt, đề thi đúng sở trường, thầy cô chỉ bảo mở mang trí tuệ.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}, {"field": "topic", "op": "eq", "value": "ACADEMIC"}]}}',
    N'Học vấn (ACADEMIC): Trí tuệ hanh thông, bài thi đúng sở trường, được thầy cô chỉ điểm, kết quả thi cử xuất sắc đạt chuẩn.',
    120, 15, 1, 'APPROVED'
);

-- 29. ACADEMIC + TY_HOA
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_ACADEMIC_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_ACADEMIC_TY_HOA', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể Dụng tỷ hòa trong thi cử: Học lực tương xứng với kết quả, phong độ thi cử ổn định, bạn bè tương trợ.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "TY_HOA"}, {"field": "topic", "op": "eq", "value": "ACADEMIC"}]}}',
    N'Học vấn (ACADEMIC): Năng lực học tập vững vàng, phong độ ổn định, bạn bè đồng môn tương trợ, tự tin bước vào kỳ thi.',
    115, 15, 1, 'APPROVED'
);

-- 30. ACADEMIC + KHAC_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_ACADEMIC_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_ACADEMIC_KHAC_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể khắc Dụng trong khoa cử: Đề thi hóc búa, cần khổ luyện kiên trì và tập trung cao độ mới đạt được kết quả.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}, {"field": "topic", "op": "eq", "value": "ACADEMIC"}]}}',
    N'Học vấn (ACADEMIC): Đề thi nhiều thách thức hóc búa; đạt điểm nhờ công phu rèn luyện bền bỉ và bản lĩnh vượt khó.',
    110, 15, 1, 'APPROVED'
);

-- 31. ACADEMIC + SINH_XUAT
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_ACADEMIC_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_ACADEMIC_SINH_XUAT', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Thể sinh Dụng trong học thuật: Phân tán tâm trí, học nhiều nhưng hiệu quả chưa cao, cần siết lại kỷ luật.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}, {"field": "topic", "op": "eq", "value": "ACADEMIC"}]}}',
    N'Học vấn (ACADEMIC): Phân tán tâm trí, học nhiều nhưng hiệu quả chưa cao; cần siết lại kỷ luật và tập trung vào trọng tâm.',
    110, 15, 1, 'APPROVED'
);

-- 32. ACADEMIC + KHAC_NHAP
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_ACADEMIC_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_ACADEMIC_KHAC_NHAP', 'PLUM_BLOSSOM',
    N'Mai Hoa Dịch Số - Dụng khắc Thể trong thi cử: Áp lực tâm lý đè nặng, đề thi bất lợi, cần bình tĩnh rà soát lại phương pháp ôn tập.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}, {"field": "topic", "op": "eq", "value": "ACADEMIC"}]}}',
    N'Học vấn (ACADEMIC): Áp lực thi cử nặng nề, kết quả chưa như kỳ vọng; cần bình tĩnh rà soát lại phương pháp ôn tập.',
    120, 15, 1, 'APPROVED'
);

PRINT N'Da nap xong toan bo 32 luat suy luan Mai Hoa (Bao gom 7 luat cot loi va 25 luat chuyen de) voi trang thai APPROVED.';

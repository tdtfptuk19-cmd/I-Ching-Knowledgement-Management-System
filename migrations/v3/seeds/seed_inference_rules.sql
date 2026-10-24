/* =====================================================================
   KinhDich_KB — Seed Data: inference_rules (Hệ Luật Suy Luận Mai Hoa Dịch Số)
   Dự án: KMS301 — Nhóm 5, Lớp IS1906
   
   Nguyên tắc:
     - Tuân thủ cấu trúc Rule DSL v1 (process_layer/schemas/rule_dsl.schema.json).
     - Mỗi luật có nguồn thật (source_id = 15: Mai Hoa Dịch Số - Thiệu Ung)
       hoặc gắn nhãn [UNVERIFIED] nếu là quy tắc suy rộng cần thẩm định.
     - Toàn bộ bản ghi ban đầu ở trạng thái review_status = 'PENDING'.
     - Tuyệt đối không tự gán 'APPROVED' (AI không tự phê duyệt).
     - CHỈ nạp vào môi trường phát triển KinhDich_KB_dev.
   ===================================================================== */

USE KinhDich_KB_dev;
GO

SET NOCOUNT ON;
PRINT N'=== Nap Seed He Luat Suy Luan Mai Hoa (inference_rules) ===';

-- Guard an toàn: Chặn đứng nếu đang chạy trên DB Production
IF DB_NAME() = N'KinhDich_KB'
BEGIN
    RAISERROR(N'GUARD VIOLATION: Khong duoc nap seed truc tiep vao KinhDich_KB! Chi nap vao KinhDich_KB_dev.', 16, 1);
    RETURN;
END;
GO

-- 1. Luật cốt lõi: Dụng Sinh Thể (Đại Cát)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_SINH_NHAP',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Thể Dụng Tổng Quyết: "Dụng sinh Thể hữu tấn ích chi hỷ". Ngoại cảnh bồi đắp chủ thể, trăm sự khởi sắc, mưu sự đại cát.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}}',
    N'Dụng ({dung_element}) sinh Thể ({the_element}): Điềm Đại Cát. Ngoại cảnh thuận lợi, nhân hòa tương trợ, mưu sự dễ thành.',
    100,
    15,
    1,
    'PENDING'
);

-- 2. Luật cốt lõi: Thể Dụng Tỷ Hòa (Cát)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_TY_HOA')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_TY_HOA',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Thể Dụng Tổng Quyết: "Thể Dụng tỷ hòa, bách sự thuận toại". Đồng khí tương cầu, thế cục bình ổn hòa hợp.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "TY_HOA"}}',
    N'Thể ({the_element}) và Dụng ({dung_element}) Tỷ Hòa: Điềm Cát. Nội ngoại tương đồng, hợp tác thuận lợi, thế sự an định.',
    90,
    15,
    1,
    'PENDING'
);

-- 3. Luật cốt lõi: Thể Khắc Dụng (Bình Hòa / Sự Trì)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_KHAC_XUAT',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Thể Dụng Tổng Quyết: "Thể khắc Dụng chu tri sự trì". Bản thân chế ngự được trở ngại nhưng hao sức, sự việc thành nhưng chậm trễ.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}}',
    N'Thể ({the_element}) khắc Dụng ({dung_element}): Điềm Bình Hòa. Chủ thể khống chế được ngoại cảnh nhưng tốn hao công sức, công việc thành nhưng có độ trễ.',
    85,
    15,
    1,
    'PENDING'
);

-- 4. Luật cốt lõi: Thể Sinh Dụng (Tiểu Hung / Hao Tổn)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_SINH_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_SINH_XUAT',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Thể Dụng Tổng Quyết: "Thể sinh Dụng hữu táng thất chi bi". Chủ thể tiết khí vì ngoại cảnh, cẩn trọng hao tài tổn sức.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "SINH_XUAT"}}',
    N'Thể ({the_element}) sinh Dụng ({dung_element}): Điềm Tiểu Hung. Chủ thể bị tiết khí, tổn hao nguyên khí hoặc tài lực vì việc bên ngoài, nên giữ mình thận trọng.',
    80,
    15,
    1,
    'PENDING'
);

-- 5. Luật cốt lõi: Dụng Khắc Thể (Đại Hung / Tai Họa)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CORE_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CORE_KHAC_NHAP',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Thể Dụng Tổng Quyết: "Dụng khắc Thể quyết đoạn sự bại". Ngoại cảnh đè nén, hiểm họa tứ bề, chớ nên manh động.',
    N'{"dsl_version": 1, "condition": {"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}}',
    N'Dụng ({dung_element}) khắc Thể ({the_element}): Điềm Đại Hung. Nghịch cảnh đè nén, có nguy cơ thất bại hoặc gặp tai ương nếu tiến bước phiêu lưu.',
    95,
    15,
    1,
    'PENDING'
);

-- 6. Luật ngữ cảnh: Hào động nội quái (moving_line <= 3) - Sự việc khởi phát từ bên trong
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_MOVING_INTERNAL')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_MOVING_INTERNAL',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Động Tĩnh Chiêm: Hào động ở quẻ Hạ (hào 1-3) chủ về nội tâm, gia đạo hoặc nguyên nhân sâu xa từ nội bộ.',
    N'{"dsl_version": 1, "condition": {"field": "moving_line", "op": "lte", "value": 3}}',
    N'Hào động {moving_line} nằm tại Hạ quái: Biến động phát khởi từ nội bộ. Cần chấn chỉnh nền tảng bên trong trước khi mở rộng ra ngoài.',
    60,
    15,
    1,
    'PENDING'
);

-- 7. Luật ngữ cảnh: Hào động ngoại quái (moving_line >= 4) - Tác động từ ngoại cảnh
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_MOVING_EXTERNAL')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_MOVING_EXTERNAL',
    'PLUM_BLOSSOM',
    N'Nguồn thật: Mai Hoa Dịch Số (Thiệu Ung, source_id=15) - Động Tĩnh Chiêm: Hào động ở quẻ Thượng (hào 4-6) chủ về xã hội, đối tác hoặc thời cuộc tác động từ bên ngoài.',
    N'{"dsl_version": 1, "condition": {"field": "moving_line", "op": "gte", "value": 4}}',
    N'Hào động {moving_line} nằm tại Thượng quái: Biến động đến từ môi trường khách quan bên ngoài. Cần thích ứng linh hoạt với chuyển dịch của thời cuộc.',
    60,
    15,
    1,
    'PENDING'
);

-- 8. Luật chuyên đề: Nghề nghiệp / Thăng tiến khi Sinh Nhập
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_CAREER_SINH_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_CAREER_SINH_NHAP',
    'PLUM_BLOSSOM',
    N'[UNVERIFIED - Giả thuyết quy tắc cần chuyên gia thẩm định]: Ứng dụng Mai Hoa vào chủ đề CAREER khi quan hệ là SINH_NHAP. Được cấp trên cất nhắc hoặc đối tác mang cơ hội đến.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "SINH_NHAP"}, {"field": "topic", "op": "eq", "value": "CAREER"}]}}',
    N'Sự nghiệp (CAREER): Thời vận hanh thông, cấp trên nâng đỡ, quý nhân trợ lực, cơ hội thăng tiến mở rộng.',
    110,
    15,
    1,
    'PENDING'
);

-- 9. Luật chuyên đề: Tài chính khi Khắc Xuất (Thể khắc Dụng)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_FINANCE_KHAC_XUAT')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_FINANCE_KHAC_XUAT',
    'PLUM_BLOSSOM',
    N'[UNVERIFIED - Giả thuyết quy tắc cần chuyên gia thẩm định]: Ứng dụng Mai Hoa vào FINANCE khi quan hệ là KHAC_XUAT. Thể khắc Dụng là cầu tài có đắc nhưng phải trải qua đàm phán gian nan.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_XUAT"}, {"field": "topic", "op": "eq", "value": "FINANCE"}]}}',
    N'Tài chính (FINANCE): Có lợi nhuận thu về nhưng cần dụng tâm kiên trì; thành quả đến chậm hơn dự tính ban đầu.',
    110,
    15,
    1,
    'PENDING'
);

-- 10. Luật chuyên đề: Sức khỏe khi Khắc Nhập (Dụng khắc Thể)
IF NOT EXISTS (SELECT 1 FROM inference_rules WHERE rule_code = 'PB_HEALTH_KHAC_NHAP')
INSERT INTO inference_rules (
    rule_code, school, condition_description, condition_expression,
    conclusion_template, priority, source_id, version, review_status
) VALUES (
    'PB_HEALTH_KHAC_NHAP',
    'PLUM_BLOSSOM',
    N'[UNVERIFIED - Giả thuyết quy tắc cần chuyên gia thẩm định]: Ứng dụng Mai Hoa vào HEALTH khi Dụng khắc Thể. Thể chất mất cân bằng âm dương ngũ hành, khí suy cần điều dưỡng và y tế can thiệp.',
    N'{"dsl_version": 1, "condition": {"all": [{"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"}, {"field": "topic", "op": "eq", "value": "HEALTH"}]}}',
    N'Sức khỏe (HEALTH): Khí huyết ngũ hành tương xung, chính khí tổn thương. Cần nghỉ ngơi, điều hòa dinh dưỡng và sớm tham vấn ý kiến bác sĩ chuyên khoa.',
    120,
    15,
    1,
    'PENDING'
);

PRINT N'Da nap xong 10 luat suy luan Mai Hoa (trang thai PENDING).';

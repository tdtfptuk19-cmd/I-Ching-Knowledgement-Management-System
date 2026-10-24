/* =====================================================================
   KinhDich_KB — Seed Data: five_element_relations (25 quan hệ Ngũ hành Mai Hoa)
   Dự án: KMS301 — Nhóm 5, Lớp IS1906
   
   Nguồn trích dẫn:
     - source_id = 15: "Mai Hoa Dịch Số" (Thiệu Ung, Tống triều)
     - Thiên "Thể Dụng Tổng Quyết" (Phép xem Thể Dụng biến hóa ngũ hành)
   
   Nguyên tắc:
     - primary_element: Hành của quẻ THỂ (Chủ thể chiêm nghiệm)
     - target_element:  Hành của quẻ DỤNG (Ngoại cảnh, đối tượng tương tác)
     - Điểm phân cực (polarity_weight) theo Quyết định 4 đã chốt:
         * SINH_NHAP (+2): Dụng sinh Thể (Đại cát, ngoại cảnh trợ giúp)
         * TY_HOA   (+1): Thể Dụng đồng hành (Cát, hòa hợp, tương trợ)
         * KHAC_XUAT (0): Thể khắc Dụng (Bình hòa, chế ngự được trở lực nhưng tổn sức)
         * SINH_XUAT (-1): Thể sinh Dụng (Tiểu hung, hao tổn nguyên khí/tài lực)
         * KHAC_NHAP (-2): Dụng khắc Thể (Đại hung, bị hoàn cảnh xâm hại, tai họa)
     - Toàn bộ bản ghi ban đầu có review_status = 'PENDING' (Tuân thủ Nguyên tắc AI không tự duyệt).
   ===================================================================== */

USE KinhDich_KB_dev;
GO

SET NOCOUNT ON;
PRINT N'=== Nap Seed 25 quan he Ngu hanh Mai Hoa (five_element_relations) ===';

-- Guard an toan: Chan dung neu dang chay tren DB Production
IF DB_NAME() = N'KinhDich_KB'
BEGIN
    RAISERROR(N'GUARD VIOLATION: Khong duoc nap seed truc tiep vao KinhDich_KB! Chi nap vao KinhDich_KB_dev.', 16, 1);
    RETURN;
END;
GO

-- 1. KIM (Thể)
IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='KIM' AND target_element='KIM' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'KIM', 'KIM', 'TY_HOA', 1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='KIM' AND target_element='THO' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'KIM', 'THO', 'SINH_NHAP', 2, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='KIM' AND target_element='MOC' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'KIM', 'MOC', 'KHAC_XUAT', 0, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='KIM' AND target_element='THUY' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'KIM', 'THUY', 'SINH_XUAT', -1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='KIM' AND target_element='HOA' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'KIM', 'HOA', 'KHAC_NHAP', -2, 15, 'PENDING');

-- 2. MOC (Thể)
IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='MOC' AND target_element='THUY' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'MOC', 'THUY', 'SINH_NHAP', 2, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='MOC' AND target_element='MOC' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'MOC', 'MOC', 'TY_HOA', 1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='MOC' AND target_element='THO' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'MOC', 'THO', 'KHAC_XUAT', 0, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='MOC' AND target_element='HOA' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'MOC', 'HOA', 'SINH_XUAT', -1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='MOC' AND target_element='KIM' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'MOC', 'KIM', 'KHAC_NHAP', -2, 15, 'PENDING');

-- 3. THUY (Thể)
IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THUY' AND target_element='KIM' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THUY', 'KIM', 'SINH_NHAP', 2, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THUY' AND target_element='THUY' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THUY', 'THUY', 'TY_HOA', 1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THUY' AND target_element='HOA' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THUY', 'HOA', 'KHAC_XUAT', 0, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THUY' AND target_element='MOC' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THUY', 'MOC', 'SINH_XUAT', -1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THUY' AND target_element='THO' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THUY', 'THO', 'KHAC_NHAP', -2, 15, 'PENDING');

-- 4. HOA (Thể)
IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='HOA' AND target_element='MOC' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'HOA', 'MOC', 'SINH_NHAP', 2, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='HOA' AND target_element='HOA' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'HOA', 'HOA', 'TY_HOA', 1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='HOA' AND target_element='KIM' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'HOA', 'KIM', 'KHAC_XUAT', 0, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='HOA' AND target_element='THO' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'HOA', 'THO', 'SINH_XUAT', -1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='HOA' AND target_element='THUY' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'HOA', 'THUY', 'KHAC_NHAP', -2, 15, 'PENDING');

-- 5. THO (Thể)
IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THO' AND target_element='HOA' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THO', 'HOA', 'SINH_NHAP', 2, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THO' AND target_element='THO' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THO', 'THO', 'TY_HOA', 1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THO' AND target_element='THUY' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THO', 'THUY', 'KHAC_XUAT', 0, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THO' AND target_element='KIM' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THO', 'KIM', 'SINH_XUAT', -1, 15, 'PENDING');

IF NOT EXISTS (SELECT 1 FROM five_element_relations WHERE school='PLUM_BLOSSOM' AND primary_element='THO' AND target_element='MOC' AND source_id=15)
    INSERT INTO five_element_relations (school, primary_element, target_element, relation_type, polarity_weight, source_id, review_status)
    VALUES ('PLUM_BLOSSOM', 'THO', 'MOC', 'KHAC_NHAP', -2, 15, 'PENDING');

PRINT N'Da nap xong 25 quan he Ngu hanh Mai Hoa (trang thai PENDING).';

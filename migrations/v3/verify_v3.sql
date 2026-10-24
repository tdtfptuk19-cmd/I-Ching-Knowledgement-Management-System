/* =====================================================================
   KinhDich_KB — verify_v3.sql
   Bộ query kiểm tra "kỳ vọng 0 dòng" sau khi áp dụng migration_v3.sql.
   
   MỌI SECTION PHẢI TRẢ VỀ 0 DÒNG KHI DB Ở TRẠNG THÁI HỢP LỆ.
   
   CÁCH CHẠY:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i verify_v3.sql
   ===================================================================== */

USE KinhDich_KB;
GO

PRINT N'=== verify_v3.sql: Bat dau kiem tra Migration v3 ===';
PRINT N'Ky vong: Moi section tra ve 0 dong (khong co loi).';
GO

-- V1: Kiểm tra sự tồn tại của các View mở rộng (phải = 0 dòng lỗi)
PRINT N'V1: Thieu View mo rong (phai = 0):';
SELECT expected_view
FROM (VALUES ('v_classic_texts_expert'), ('v_divination_details_extended')) AS T(expected_view)
WHERE OBJECT_ID('dbo.' + expected_view, 'V') IS NULL;
GO

-- V2: Kiểm tra sự tồn tại của các Stored Procedures (phải = 0 dòng lỗi)
PRINT N'V2: Thieu Stored Procedure (phai = 0):';
SELECT expected_proc
FROM (VALUES 
    ('sp_create_case'),
    ('sp_submit_interpretation'),
    ('sp_review_interpretation'),
    ('sp_record_outcome')
) AS T(expected_proc)
WHERE OBJECT_ID('dbo.' + expected_proc, 'P') IS NULL;
GO

-- V3: Kiểm tra sự tồn tại của Role db_process_layer (phai = 0 dòng lỗi)
PRINT N'V3: Thieu Database Role db_process_layer (phai = 0):';
SELECT 'db_process_layer' AS missing_role
WHERE NOT EXISTS (
    SELECT 1 FROM sys.database_principals WHERE name = 'db_process_layer' AND type = 'R'
);
GO

-- V4: Kiểm tra tính toàn vẹn của View v_classic_texts_expert (phai = 0 dòng lỗi)
PRINT N'V4: View v_classic_texts_expert loi du lieu hoac thieu cot (phai = 0):';
SELECT TOP 1 text_id
FROM dbo.v_classic_texts_expert
WHERE text_id IS NULL OR hexagram_id IS NULL OR review_status <> 'APPROVED';
GO

PRINT N'=== verify_v3.sql: HOAN THANH KIEM TRA ===';
GO

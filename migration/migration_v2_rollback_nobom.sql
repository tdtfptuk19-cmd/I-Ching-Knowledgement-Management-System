/* =====================================================================
   KinhDich_KB — Migration v2 ROLLBACK
   Hoan nguyen trang thai truoc khi chay migration_v2.sql
   
   CANH BAO: Script nay xoa cac cot da them va hoan lai cac gia tri cu.
   Chi chay khi can thiet. Khong co cach hoan lai neu du lieu da bi ghi de.
   
   CACH CHAY:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i migration_v2_rollback_nobom.sql
   ===================================================================== */

USE KinhDich_KB;
GO

PRINT N'=== Migration v2 ROLLBACK bat dau ===';

-- =====================================================================
-- ROLLBACK Section 2: Hoan lai noi dung kinh van
-- =====================================================================
BEGIN TRANSACTION;

-- R2.1 Que 45 hao 2 HAO_TU: xoa lai chu 禴 neu da them
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 45 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'六二引吉無咎孚乃利用禴'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_han = N'六二引吉無咎孚乃利用',
        updated_at = SYSUTCDATETIME()
    WHERE hexagram_id = 45 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'六二引吉無咎孚乃利用禴';
    PRINT N'  [R2.1] Que 45 hao 2 HAO_TU: da hoan lai (xoa 禴)';
END

-- R2.2 Que 46 hao 2 HAO_TU: xoa lai chu 禴
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 46 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'九二孚乃利用禴無咎'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_han = N'九二孚乃利用無咎',
        updated_at = SYSUTCDATETIME()
    WHERE hexagram_id = 46 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'九二孚乃利用禴無咎';
    PRINT N'  [R2.2] Que 46 hao 2 HAO_TU: da hoan lai (xoa 禴)';
END

-- R2.3 Que 44 THOAN_TRUYEN: them lai nhan thua
-- NOTE: khong the hoan lai chinh xac neu text_vn da bi thay doi bo sung khac
PRINT N'  [R2.3] Que 44 THOAN_TRUYEN: KHONG THE HOAN LAI TU DONG - can them thu cong nhan "Thoán Truyện:" vao cuoi';

-- R2.4 Que 46 THOAN_TRUYEN: them lai dau cham dau
PRINT N'  [R2.4] Que 46 THOAN_TRUYEN: KHONG THE HOAN LAI TU DONG - can them thu cong dau "." vao dau';

-- R2.5 Que 45 TIEU_TUONG hao 4: them lai dong lap
PRINT N'  [R2.5] Que 45 TIEU_TUONG hao 4: KHONG THE HOAN LAI TU DONG - can them thu cong dong lap';

-- R2.6 Que 45 THOAN_TU: hoan lai cut dau
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 45 AND line_position IS NULL
    AND text_type = 'THOAN_TU' AND source_id = 8
    AND text_vn LIKE N'Thoán từ. Tụy. Hanh. Vương cách hữu miếu. Lợi kiến đại nhân. Hanh. Lợi trinh. Dụng đại sinh cát. Lợi hữu du vãng.%'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_vn = SUBSTRING(text_vn, LEN(N'Thoán từ. Tụy. Hanh. Vương cách hữu miếu. Lợi kiến đại nhân. Hanh. Lợi trinh. Dụng đại sinh cát. Lợi ') + 1, LEN(text_vn)),
        updated_at = SYSUTCDATETIME()
    WHERE hexagram_id = 45 AND line_position IS NULL
    AND text_type = 'THOAN_TU' AND source_id = 8;
    PRINT N'  [R2.6] Que 45 THOAN_TU: da hoan lai (ve trang thai cut dau)';
END

COMMIT TRANSACTION;

-- =====================================================================
-- ROLLBACK Section 3: Hoan lai sources
-- =====================================================================
BEGIN TRANSACTION;

UPDATE dbo.sources SET publication_year = NULL WHERE source_id IN (1, 3, 4, 5, 11, 16);
PRINT N'  [R3] publication_year da xoa cho source 1,3,4,5,11,16';

COMMIT TRANSACTION;

-- =====================================================================
-- ROLLBACK Section 1: Xoa cot moi
-- Phai xoa constraint truoc, sau do xoa cot
-- =====================================================================
BEGIN TRANSACTION;

-- Xoa constraint
IF EXISTS (SELECT 1 FROM sys.check_constraints 
           WHERE parent_object_id = OBJECT_ID('dbo.classic_texts') 
           AND name = 'chk_ct_approval_audit')
BEGIN
    ALTER TABLE dbo.classic_texts DROP CONSTRAINT chk_ct_approval_audit;
    PRINT N'  [R1] chk_ct_approval_audit da xoa';
END

IF EXISTS (SELECT 1 FROM sys.check_constraints 
           WHERE parent_object_id = OBJECT_ID('dbo.classic_texts') 
           AND name = 'chk_ct_review_status')
BEGIN
    ALTER TABLE dbo.classic_texts DROP CONSTRAINT chk_ct_review_status;
    PRINT N'  [R1] chk_ct_review_status da xoa';
END

IF EXISTS (SELECT 1 FROM sys.check_constraints 
           WHERE parent_object_id = OBJECT_ID('dbo.classic_texts') 
           AND name = 'chk_ct_confidence')
BEGIN
    ALTER TABLE dbo.classic_texts DROP CONSTRAINT chk_ct_confidence;
    PRINT N'  [R1] chk_ct_confidence da xoa';
END

-- Xoa cac cot moi
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'review_status')
BEGIN
    ALTER TABLE dbo.classic_texts DROP COLUMN review_status;
    PRINT N'  [R1] review_status da xoa';
END
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'confidence')
BEGIN
    ALTER TABLE dbo.classic_texts DROP COLUMN confidence;
    PRINT N'  [R1] confidence da xoa';
END
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'source_ref')
BEGIN
    ALTER TABLE dbo.classic_texts DROP COLUMN source_ref;
    PRINT N'  [R1] source_ref da xoa';
END
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'issues')
BEGIN
    ALTER TABLE dbo.classic_texts DROP COLUMN issues;
    PRINT N'  [R1] issues da xoa';
END
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'created_at')
BEGIN
    ALTER TABLE dbo.classic_texts DROP COLUMN created_at;
    PRINT N'  [R1] created_at da xoa';
END
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'updated_at')
BEGIN
    ALTER TABLE dbo.classic_texts DROP COLUMN updated_at;
    PRINT N'  [R1] updated_at da xoa';
END

COMMIT TRANSACTION;

PRINT N'=== Migration v2 ROLLBACK HOAN THANH ===';
PRINT N'CANH BAO: Mot so thay doi text_vn (Section 2.3, 2.4, 2.5) khong the hoan lai tu dong.';
GO

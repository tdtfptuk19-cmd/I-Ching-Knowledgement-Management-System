/* =====================================================================
   KinhDich_KB — Migration v2 (SỬA ĐỔI CHUẨN T-SQL BATCH SEPARATION)
   
   NGUYÊN NHÂN LỖI TRƯỚC:
     Trong T-SQL, khi thêm cột bằng ALTER TABLE ADD COLUMN và thêm CONSTRAINT
     hoặc UPDATE tham chiếu đến cột đó trong CÙNG MỘT BATCH (không có GO),
     SQL Server sẽ báo lỗi biên dịch: Msg 207 "Invalid column name 'review_status'".
   
   GIẢI PHÁP:
     Tách các lệnh ALTER TABLE ADD COLUMN thành từng batch riêng bằng GO.
     Sau khi các cột đã tồn tại trong schema catalog, các batch tiếp theo
     mới thêm CONSTRAINT và thực hiện UPDATE.
   
   CÁCH CHẠY:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i migration_v2_nobom.sql
   ===================================================================== */

USE KinhDich_KB;
GO

SET NOCOUNT ON;
PRINT N'=== Migration v2: Kiem tra dieu kien ===';

IF OBJECT_ID('dbo.classic_texts', 'U') IS NULL
BEGIN
    RAISERROR(N'LOI: Bang classic_texts khong ton tai. Chay schema v1 truoc.', 16, 1);
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM dbo.hexagrams WHERE hexagram_id = 44)
BEGIN
    RAISERROR(N'LOI: hexagram_id=44 khong co trong hexagrams. Chay kinhdich_64_que.sql truoc.', 16, 1);
    RETURN;
END

PRINT N'Dieu kien OK.';
GO

-- =====================================================================
-- SECTION 1: THEM CAC COT MOI (Mỗi cột 1 batch riêng bằng GO)
-- =====================================================================
PRINT N'=== Section 1: Them cot moi vao classic_texts ===';
GO

-- 1a. review_status
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'review_status')
BEGIN
    ALTER TABLE dbo.classic_texts 
    ADD review_status VARCHAR(10) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_ct_review_status CHECK (review_status IN ('PENDING','APPROVED','REJECTED'));
    PRINT N'  + cot review_status da them';
END
ELSE
    PRINT N'  ~ cot review_status da ton tai, bo qua';
GO

-- 1b. confidence
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'confidence')
BEGIN
    ALTER TABLE dbo.classic_texts 
    ADD confidence VARCHAR(10) NULL
        CONSTRAINT chk_ct_confidence CHECK (confidence IN ('high','medium','low'));
    PRINT N'  + cot confidence da them';
END
ELSE
    PRINT N'  ~ cot confidence da ton tai, bo qua';
GO

-- 1c. source_ref
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'source_ref')
BEGIN
    ALTER TABLE dbo.classic_texts 
    ADD source_ref NVARCHAR(500) NULL;
    PRINT N'  + cot source_ref da them';
END
ELSE
    PRINT N'  ~ cot source_ref da ton tai, bo qua';
GO

-- 1d. issues
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'issues')
BEGIN
    ALTER TABLE dbo.classic_texts 
    ADD issues NVARCHAR(MAX) NULL;
    PRINT N'  + cot issues da them';
END
ELSE
    PRINT N'  ~ cot issues da ton tai, bo qua';
GO

-- 1e. created_at
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'created_at')
BEGIN
    ALTER TABLE dbo.classic_texts 
    ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
    PRINT N'  + cot created_at da them';
END
ELSE
    PRINT N'  ~ cot created_at da ton tai, bo qua';
GO

-- 1f. updated_at
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'updated_at')
BEGIN
    ALTER TABLE dbo.classic_texts 
    ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
    PRINT N'  + cot updated_at da them';
END
ELSE
    PRINT N'  ~ cot updated_at da ton tai, bo qua';
GO

-- 1g. Constraint audit (Thực hiện trong batch riêng SAU KHI cột đã được tạo)
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints 
               WHERE parent_object_id = OBJECT_ID('dbo.classic_texts') 
               AND name = 'chk_ct_approval_audit')
BEGIN
    ALTER TABLE dbo.classic_texts
    ADD CONSTRAINT chk_ct_approval_audit 
        CHECK (review_status <> 'APPROVED' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL));
    PRINT N'  + constraint chk_ct_approval_audit da them';
END
ELSE
    PRINT N'  ~ constraint chk_ct_approval_audit da ton tai, bo qua';
GO

PRINT N'Section 1: HOAN THANH';
GO

-- =====================================================================
-- SECTION 2: SUA LOI NOI DUNG KINH VAN (que 44, 45, 46)
-- Các cột updated_at, issues đã tồn tại từ Section 1 nên biên dịch an toàn
-- =====================================================================
PRINT N'=== Section 2: Sua loi noi dung kinh van ===';
GO

BEGIN TRANSACTION;

-- 2.1 Que 45 hao 2 HAO_TU: them chu 禴 (U+7974) vao cuoi text_han
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 45 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'六二引吉無咎孚乃利用'
    AND text_han NOT LIKE N'%禴%'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_han = N'六二引吉無咎孚乃利用禴',
        updated_at = SYSUTCDATETIME(),
        issues = ISNULL(issues + N'; ', N'') + N'migration_v2: them chu 禴 (can PDF xac nhan - confidence medium)'
    WHERE hexagram_id = 45 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'六二引吉無咎孚乃利用';
    PRINT N'  [2.1] Que 45 hao 2 HAO_TU: da them chu 禴';
END
ELSE
    PRINT N'  [2.1] Que 45 hao 2 HAO_TU: khong khop gia tri cu hoac da co 禴, bo qua';

-- 2.2 Que 46 hao 2 HAO_TU: them chu 禴
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 46 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'九二孚乃利用無咎'
    AND text_han NOT LIKE N'%禴%'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_han = N'九二孚乃利用禴無咎',
        updated_at = SYSUTCDATETIME(),
        issues = ISNULL(issues + N'; ', N'') + N'migration_v2: them chu 禴 (can PDF xac nhan - confidence medium)'
    WHERE hexagram_id = 46 AND line_position = 2 
    AND text_type = 'HAO_TU' AND source_id = 8
    AND text_han = N'九二孚乃利用無咎';
    PRINT N'  [2.2] Que 46 hao 2 HAO_TU: da them chu 禴';
END
ELSE
    PRINT N'  [2.2] Que 46 hao 2 HAO_TU: khong khop gia tri cu hoac da co 禴, bo qua';

-- 2.3 Que 44 THOAN_TRUYEN: xoa nhan thua "Thoán Truyện:" o cuoi text_vn
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 44 AND line_position IS NULL
    AND text_type = 'THOAN_TRUYEN' AND source_id = 8
    AND text_vn LIKE N'%' + NCHAR(10) + N'Thoán Truyện:'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_vn = LEFT(text_vn, LEN(text_vn) - LEN(NCHAR(10) + N'Thoán Truyện:')),
        updated_at = SYSUTCDATETIME(),
        issues = ISNULL(issues + N'; ', N'') + N'migration_v2: xoa nhan thua "Thoán Truyện:" cuoi text_vn'
    WHERE hexagram_id = 44 AND line_position IS NULL
    AND text_type = 'THOAN_TRUYEN' AND source_id = 8
    AND text_vn LIKE N'%' + NCHAR(10) + N'Thoán Truyện:';
    PRINT N'  [2.3] Que 44 THOAN_TRUYEN: da xoa nhan thua';
END
ELSE
    PRINT N'  [2.3] Que 44 THOAN_TRUYEN: khong tim thay pattern nhan thua, bo qua';

-- 2.4 Que 46 THOAN_TRUYEN: xoa dau cham va newline dau text_vn
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 46 AND line_position IS NULL
    AND text_type = 'THOAN_TRUYEN' AND source_id = 8
    AND text_vn LIKE N'.' + NCHAR(10) + N'%'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_vn = SUBSTRING(text_vn, 3, LEN(text_vn) - 2),
        updated_at = SYSUTCDATETIME(),
        issues = ISNULL(issues + N'; ', N'') + N'migration_v2: xoa dau cham le dau text_vn'
    WHERE hexagram_id = 46 AND line_position IS NULL
    AND text_type = 'THOAN_TRUYEN' AND source_id = 8
    AND text_vn LIKE N'.' + NCHAR(10) + N'%';
    PRINT N'  [2.4] Que 46 THOAN_TRUYEN: da xoa dau cham dau';
END
ELSE
    PRINT N'  [2.4] Que 46 THOAN_TRUYEN: khong tim thay dau cham dau, bo qua';

-- 2.5 Que 45 TIEU_TUONG hao 4: xoa dong lap
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 45 AND line_position = 4
    AND text_type = 'TIEU_TUONG' AND source_id = 8
    AND text_vn LIKE N'%Tượng rằng: Qui mô cho rộng, cho to.' + NCHAR(10) + N'%'
    AND text_vn LIKE N'%Tượng rằng: Qui mô cho rộng, cho to,' + NCHAR(10) + N'%'
)
BEGIN
    DECLARE @old45 NVARCHAR(MAX), @new45 NVARCHAR(MAX);
    DECLARE @dupPattern NVARCHAR(200);
    SET @dupPattern = NCHAR(10) + N'Tượng rằng: Qui mô cho rộng, cho to,' + NCHAR(10) + N'Hành vi tốt đẹp, hết lo lỗi lầm.';
    
    SELECT @old45 = text_vn FROM dbo.classic_texts
    WHERE hexagram_id = 45 AND line_position = 4
    AND text_type = 'TIEU_TUONG' AND source_id = 8;
    
    DECLARE @pos INT = CHARINDEX(@dupPattern, @old45);
    IF @pos > 0
    BEGIN
        SET @new45 = LEFT(@old45, @pos) + SUBSTRING(@old45, @pos + LEN(@dupPattern) + 1, LEN(@old45));
        UPDATE dbo.classic_texts
        SET text_vn = @new45,
            updated_at = SYSUTCDATETIME(),
            issues = ISNULL(issues + N'; ', N'') + N'migration_v2: xoa dong lap trong TIEU_TUONG hao 4'
        WHERE hexagram_id = 45 AND line_position = 4
        AND text_type = 'TIEU_TUONG' AND source_id = 8;
        PRINT N'  [2.5] Que 45 TIEU_TUONG hao 4: da xoa dong lap';
    END
    ELSE
        PRINT N'  [2.5] Que 45 TIEU_TUONG hao 4: khong tim thay vi tri lap, kiem tra thu cong';
END
ELSE
    PRINT N'  [2.5] Que 45 TIEU_TUONG hao 4: khong khop pattern, bo qua';

-- 2.6 Que 45 THOAN_TU: Khoi phuc phan phien am bi cut dau theo anh chup sach nguon trang 113
IF EXISTS (
    SELECT 1 FROM dbo.classic_texts
    WHERE hexagram_id = 45 AND line_position IS NULL
    AND text_type = 'THOAN_TU' AND source_id = 8
    AND text_vn LIKE N'hữu du vãng.' + NCHAR(10) + N'%'
)
BEGIN
    UPDATE dbo.classic_texts
    SET text_vn = N'Thoán từ. Tụy. Hanh. Vương cách hữu miếu. Lợi kiến đại nhân. Hanh. Lợi trinh. Dụng đại sinh cát. Lợi ' + text_vn,
        updated_at = SYSUTCDATETIME(),
        issues = ISNULL(issues + N'; ', N'') + N'migration_v2: khoi phuc cau phien am day du theo anh chup sach nguon trang 113'
    WHERE hexagram_id = 45 AND line_position IS NULL
    AND text_type = 'THOAN_TU' AND source_id = 8
    AND text_vn LIKE N'hữu du vãng.' + NCHAR(10) + N'%';
    PRINT N'  [2.6] Que 45 THOAN_TU: da khoi phuc phan phien am bi cut dau';
END
ELSE
    PRINT N'  [2.6] Que 45 THOAN_TU: khong khop pattern cut dau hoac da duoc sua, bo qua';

COMMIT TRANSACTION;
PRINT N'Section 2: HOAN THANH';
GO

-- =====================================================================
-- SECTION 3: UPDATE sources tu source_map.csv
-- =====================================================================
PRINT N'=== Section 3: UPDATE sources ===';
GO

BEGIN TRANSACTION;

UPDATE dbo.sources SET publication_year = 2026 WHERE source_id = 1 AND publication_year IS NULL;
UPDATE dbo.sources SET publication_year = 2006, author = N'Kiều Xuân Dũng' WHERE source_id = 3 AND publication_year IS NULL;
UPDATE dbo.sources SET publication_year = 1992, author = N'Nguyễn Duy Cần' WHERE source_id = 4 AND publication_year IS NULL;
UPDATE dbo.sources SET publication_year = 2003, author = N'Dương Kiện Toàn' WHERE source_id = 5 AND publication_year IS NULL;
UPDATE dbo.sources SET publication_year = 2015, author = N'Nguyên K' WHERE source_id = 11 AND publication_year IS NULL;
UPDATE dbo.sources SET publication_year = 2026 WHERE source_id = 16 AND publication_year IS NULL;

PRINT N'  publication_year da cap nhat cho source 1,3,4,5,11,16';

COMMIT TRANSACTION;
PRINT N'Section 3: HOAN THANH';
GO

-- =====================================================================
-- SECTION 4: KIEM TRA KET QUA
-- =====================================================================
PRINT N'=== Section 4: Kiem tra ket qua ===';
GO

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'review_status')
         THEN N'OK: review_status ton tai' ELSE N'FAIL: review_status thieu' END AS check_1,
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'confidence')
         THEN N'OK: confidence ton tai' ELSE N'FAIL: confidence thieu' END AS check_2,
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'created_at')
         THEN N'OK: created_at ton tai' ELSE N'FAIL: created_at thieu' END AS check_3;

SELECT hexagram_id, line_position, text_type, 
    LEFT(text_han, 30) AS text_han_preview,
    CASE WHEN text_han LIKE N'%禴%' THEN N'OK: co 禴' ELSE N'WARNING: khong co 禴' END AS cha_check
FROM dbo.classic_texts
WHERE (hexagram_id = 45 AND line_position = 2 AND text_type = 'HAO_TU')
   OR (hexagram_id = 46 AND line_position = 2 AND text_type = 'HAO_TU');

SELECT review_status, COUNT(*) AS cnt FROM dbo.classic_texts GROUP BY review_status;
GO

PRINT N'=== Migration v2: HOAN THANH ===';
GO

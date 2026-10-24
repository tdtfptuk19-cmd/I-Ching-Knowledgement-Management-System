/* =====================================================================
   KinhDich_KB — Phê duyệt Kinh văn (PENDING -> APPROVED)
   Dành cho: Trưởng nhóm / Chuyên gia kiểm duyệt (Human-in-the-loop Gate)
   
   CÁCH CHẠY BẰNG SQLCMD:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i approve_verified_nobom.sql
   ===================================================================== */

USE KinhDich_KB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

PRINT N'=====================================================================';
PRINT N'   KinhDich_KB — THỰC HIỆN PHÊ DUYỆT CHÍNH THỨC (EXPERT GATE)';
PRINT N'=====================================================================';

-- 1. KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT: Cột review_status phải tồn tại
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'review_status')
BEGIN
    RAISERROR(N'LỖI: Cột review_status chưa tồn tại trong bảng classic_texts! Vui lòng chạy migration_v2_nobom.sql trước.', 16, 1);
    RETURN;
END
GO

-- 2. THỰC HIỆN PHÊ DUYỆT (Chạy trong batch riêng sau khi kiểm tra schema)
DECLARE @Reviewer NVARCHAR(100) = N'TruongNhom_IS1906'; -- Tên chuyên gia / Trưởng nhóm phê duyệt
DECLARE @ApprovalScope VARCHAR(20) = 'ALL_VALID';      -- 'ALL_VALID' (toàn bộ dòng hợp lệ) hoặc 'BATCH_11' (Quẻ 43-46)
DECLARE @Now DATETIME2 = SYSUTCDATETIME();

PRINT N'Người phê duyệt : ' + @Reviewer;
PRINT N'Thời điểm duyệt : ' + CONVERT(NVARCHAR(30), @Now, 126);
PRINT N'Phạm vi duyệt   : ' + @ApprovalScope;
PRINT N'';

-- Thực thi logic phê duyệt an toàn
DECLARE @sql NVARCHAR(MAX);
SET @sql = N'
DECLARE @TotalPending INT;
SELECT @TotalPending = COUNT(*) FROM dbo.classic_texts WHERE review_status = ''PENDING'';
PRINT N''Số dòng đang ở trạng thái PENDING: '' + CAST(@TotalPending AS NVARCHAR(10));

IF @TotalPending = 0
BEGIN
    PRINT N''Không có dòng nào ở trạng thái PENDING cần duyệt.'';
    RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @UpdatedCount INT = 0;

    IF @Scope = ''BATCH_11''
    BEGIN
        UPDATE dbo.classic_texts
        SET review_status = ''APPROVED'',
            verified_by   = @Rev,
            verified_at   = @Dt,
            updated_at    = @Dt,
            issues        = ISNULL(issues + N''; '', N'''') + N''approved_by_team_lead: '' + @Rev
        WHERE hexagram_id BETWEEN 43 AND 46
          AND review_status = ''PENDING''
          AND (text_han IS NOT NULL OR text_vn IS NOT NULL);

        SET @UpdatedCount = @@ROWCOUNT;
    END
    ELSE IF @Scope = ''ALL_VALID''
    BEGIN
        UPDATE dbo.classic_texts
        SET review_status = ''APPROVED'',
            verified_by   = @Rev,
            verified_at   = @Dt,
            updated_at    = @Dt,
            issues        = ISNULL(issues + N''; '', N'''') + N''approved_by_team_lead: '' + @Rev
        WHERE review_status = ''PENDING''
          AND (text_han IS NOT NULL OR text_vn IS NOT NULL);

        SET @UpdatedCount = @@ROWCOUNT;
    END

    PRINT N''-> Đã chuyển '' + CAST(@UpdatedCount AS NVARCHAR(10)) + N'' dòng sang trạng thái APPROVED.'';

    -- HẬU KIỂM TOÀN VẸN RÀNG BUỘC
    IF EXISTS (
        SELECT 1 FROM dbo.classic_texts
        WHERE review_status = ''APPROVED''
          AND (verified_by IS NULL OR verified_at IS NULL)
    )
    BEGIN
        RAISERROR(N''LỖI TOÀN VẸN: Tồn tại dòng APPROVED nhưng verified_by / verified_at bị NULL!'', 16, 1);
    END

    COMMIT TRANSACTION;
    PRINT N''-> TRANSACTION ĐÃ COMMIT THÀNH CÔNG.'';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT N''LỖI XẢY RA TRONG QUÁ TRÌNH DUYỆT. ĐÃ ROLLBACK TOÀN BỘ.'';
    THROW;
END CATCH;
';

EXEC sp_executesql @sql, 
     N'@Rev NVARCHAR(100), @Dt DATETIME2, @Scope VARCHAR(20)', 
     @Rev = @Reviewer, @Dt = @Now, @Scope = @ApprovalScope;
GO

-- 3. XÁC MINH TRẠNG THÁI HIỂN THỊ TRONG VIEW CÔNG KHAI
PRINT N'';
PRINT N'=== KẾT QUẢ SAU PHÊ DUYỆT ===';

-- Thống kê theo trạng thái
SELECT review_status, COUNT(*) AS so_luong,
       COUNT(verified_by) AS so_dong_co_nguoi_duyet
FROM dbo.classic_texts
GROUP BY review_status;

-- Đếm số dòng xuất hiện trong view công khai v_classic_texts_verified
SELECT COUNT(*) AS so_dong_trong_view_verified
FROM dbo.v_classic_texts_verified;

-- Mẫu 5 dòng đầu tiên trong view công khai
SELECT TOP 5 text_id, hexagram_id, line_position, text_type, LEFT(text_han, 30) AS text_han_preview
FROM dbo.v_classic_texts_verified
ORDER BY hexagram_id, line_position, text_type;
GO

PRINT N'=====================================================================';
PRINT N'   PHÊ DUYỆT HOÀN TẤT — VIEW v_classic_texts_verified ĐÃ CÓ DỮ LIỆU';
PRINT N'=====================================================================';
GO

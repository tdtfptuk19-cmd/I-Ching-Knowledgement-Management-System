/* =====================================================================
   KinhDich_KB — Phê duyệt Quy Tắc & Diễn Giải Chuyên Gia (PENDING -> APPROVED)
   Dành cho: Chuyên gia kiểm duyệt / Human-in-the-loop Approval Gate
   
   Mục đích:
     - Phê duyệt toàn bộ các quy tắc suy luận (inference_rules) hợp lệ
       để nạp vào View dbo.v_inference_rules_public.
     - Phê duyệt các bài diễn giải chuyên gia (interpretations) hợp lệ
       để nạp vào View dbo.v_interpretations_public.
   
   Cách chạy bằng sqlcmd:
     sqlcmd -S "(local)" -E -d KinhDich_KB_dev -b -f 65001 -I -i approve_expert_rules_nobom.sql
   ===================================================================== */

USE KinhDich_KB_dev;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

PRINT N'=====================================================================';
PRINT N'   KinhDich_KB — THỰC HIỆN PHÊ DUYỆT QUY TẮC & DIỄN GIẢI CHUYÊN GIA';
PRINT N'=====================================================================';

-- 1. Phê duyệt các quy tắc suy luận (Inference Rules)
IF OBJECT_ID('dbo.inference_rules', 'U') IS NOT NULL
BEGIN
    DECLARE @PendingRulesCount INT;
    SELECT @PendingRulesCount = COUNT(*) FROM dbo.inference_rules WHERE review_status = 'PENDING';
    
    PRINT N'Số lượng quy tắc đang chờ duyệt: ' + CAST(@PendingRulesCount AS NVARCHAR(10));
    
    UPDATE dbo.inference_rules
    SET review_status = 'APPROVED'
    WHERE review_status = 'PENDING';
    
    PRINT N'  + Đã phê duyệt thành công toàn bộ quy tắc suy luận sang APPROVED.';
END
ELSE
BEGIN
    PRINT N'CẢNH BÁO: Bảng dbo.inference_rules không tồn tại.';
END
GO

-- 2. Phê duyệt các diễn giải chuyên gia (Interpretations)
IF OBJECT_ID('dbo.interpretations', 'U') IS NOT NULL
BEGIN
    DECLARE @PendingInterpsCount INT;
    SELECT @PendingInterpsCount = COUNT(*) FROM dbo.interpretations WHERE review_status = 'PENDING';
    
    PRINT N'Số lượng diễn giải đang chờ duyệt: ' + CAST(@PendingInterpsCount AS NVARCHAR(10));
    
    UPDATE dbo.interpretations
    SET review_status = 'APPROVED'
    WHERE review_status = 'PENDING';
    
    PRINT N'  + Đã phê duyệt thành công toàn bộ diễn giải chuyên gia sang APPROVED.';
END
ELSE
BEGIN
    PRINT N'CẢNH BÁO: Bảng dbo.interpretations không tồn tại.';
END
GO

PRINT N'=== HOÀN TẤT PHÊ DUYỆT TRI THỨC CHUYÊN GIA ===';
GO

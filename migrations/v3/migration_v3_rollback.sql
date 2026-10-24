/* =====================================================================
   KinhDich_KB — Migration v3 Rollback Script
   Dự án: KMS301 — Nhóm 5, Lớp IS1906
   
   MỤC ĐÍCH:
     Hoàn nguyên an toàn toàn bộ đối tượng tạo bởi migration_v3.sql:
     1. Thu hồi quyền và xóa Database Role db_process_layer.
     2. Xóa các Stored Procedures nghiệp vụ.
     3. Xóa các View mở rộng.
   
   CÁCH CHẠY BẰNG SQLCMD:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i migration_v3_rollback.sql
   ===================================================================== */

USE KinhDich_KB;
GO

SET NOCOUNT ON;
PRINT N'=== Bat dau Rollback Migration v3 ===';

-- 1. Xóa Database Role db_process_layer
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'db_process_layer' AND type = 'R')
BEGIN
    DROP ROLE db_process_layer;
    PRINT N'  - Da xoa Role db_process_layer.';
END
GO

-- 2. Xóa các Stored Procedures
IF OBJECT_ID('dbo.sp_record_outcome', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_record_outcome;
    PRINT N'  - Da xoa Procedure sp_record_outcome.';
END
GO

IF OBJECT_ID('dbo.sp_review_interpretation', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_review_interpretation;
    PRINT N'  - Da xoa Procedure sp_review_interpretation.';
END
GO

IF OBJECT_ID('dbo.sp_submit_interpretation', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_submit_interpretation;
    PRINT N'  - Da xoa Procedure sp_submit_interpretation.';
END
GO

IF OBJECT_ID('dbo.sp_create_case', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_create_case;
    PRINT N'  - Da xoa Procedure sp_create_case.';
END
GO

-- 3. Xóa các View mở rộng
IF OBJECT_ID('dbo.v_divination_details_extended', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.v_divination_details_extended;
    PRINT N'  - Da xoa View v_divination_details_extended.';
END
GO

IF OBJECT_ID('dbo.v_classic_texts_expert', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.v_classic_texts_expert;
    PRINT N'  - Da xoa View v_classic_texts_expert.';
END
GO

PRINT N'=== Rollback Migration v3: HOAN THANH ===';
GO

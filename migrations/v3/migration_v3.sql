/* =====================================================================
   KinhDich_KB — Migration v3: Process Layer Views, Stored Procedures & Security Role
   Dự án: KMS301 — Nhóm 5, Lớp IS1906
   
   MỤC ĐÍCH:
     1. Tạo các View mở rộng (không sửa view cũ):
        - v_classic_texts_expert: Phục vụ chế độ hiển thị chuyên gia (confidence, source_ref, issues...).
        - v_divination_details_extended: Mở rộng tính ngũ hành quẻ Hỗ và Biến.
     2. Tạo bộ Stored Procedures kiểm soát thao tác ghi tuân thủ quy tắc View-Only:
        - sp_create_case
        - sp_submit_interpretation
        - sp_review_interpretation
        - sp_record_outcome
     3. Tạo Database Role db_process_layer và phân quyền tối thiểu (Least Privilege).
   
   CÁCH CHẠY BẰNG SQLCMD:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i migration_v3.sql
   ===================================================================== */

USE KinhDich_KB;
GO

SET NOCOUNT ON;
PRINT N'=== Migration v3: Bat dau kiem tra dieu kien ===';

IF OBJECT_ID('dbo.classic_texts', 'U') IS NULL OR OBJECT_ID('dbo.divination_cases', 'U') IS NULL
BEGIN
    RAISERROR(N'LOI: Bang classic_texts hoac divination_cases khong ton tai.', 16, 1);
    RETURN;
END;
PRINT N'Dieu kien tien quyet hop le.';
GO

-- =====================================================================
-- SECTION 1: CAC VIEW MỞ RỘNG (Giữ nguyên các view v1)
-- =====================================================================
PRINT N'=== Section 1: Tao cac View mo rong ===';
GO

-- 1.1 View kinh văn cho chế độ Chuyên gia (Expert Mode)
IF OBJECT_ID('dbo.v_classic_texts_expert', 'V') IS NOT NULL
    DROP VIEW dbo.v_classic_texts_expert;
GO

CREATE VIEW dbo.v_classic_texts_expert AS
SELECT 
    ct.text_id,
    ct.hexagram_id,
    h.name_vn AS hexagram_name,
    ct.line_position,
    ct.text_type,
    ct.text_han,
    ct.text_vn,
    ct.source_id,
    s.title AS source_title,
    s.author AS source_author,
    ct.review_status,
    ct.confidence,
    ct.source_ref,
    ct.issues,
    ct.verified_by,
    ct.verified_at,
    ct.created_at,
    ct.updated_at
FROM dbo.classic_texts ct
JOIN dbo.hexagrams h ON h.hexagram_id = ct.hexagram_id
JOIN dbo.sources s ON s.source_id = ct.source_id
WHERE ct.review_status = 'APPROVED';
GO

PRINT N'  + View v_classic_texts_expert da tao.';
GO

-- 1.2 View mở rộng chi tiết gieo quẻ (Tính đầy đủ Thể/Dụng của Chủ, Hỗ, Biến)
IF OBJECT_ID('dbo.v_divination_details_extended', 'V') IS NOT NULL
    DROP VIEW dbo.v_divination_details_extended;
GO

CREATE VIEW dbo.v_divination_details_extended AS
SELECT 
    vr.case_id,
    vr.casting_method,
    vr.topic,
    vr.upper_n,
    vr.lower_n,
    vr.moving_line,
    vr.initial_hexagram_id,
    vr.initial_name,
    hi.binary_code AS initial_binary,
    vr.transformed_hexagram_id,
    vr.transformed_name,
    ht.binary_code AS transformed_binary,
    vr.nuclear_hexagram_id,
    vr.nuclear_name,
    hn.binary_code AS nuclear_binary,
    vr.dung_side,
    vr.the_element,
    vr.dung_element,
    -- Ngũ hành của 2 quẻ đơn trong Quẻ Hỗ:
    tu_nuc.five_element AS upper_nuclear_element,
    tl_nuc.five_element AS lower_nuclear_element,
    -- Ngũ hành của Dụng quái trong Quẻ Biến (quẻ đơn bị động và biến đổi):
    CASE WHEN vr.dung_side = 'LOWER' THEN tl_trans.five_element ELSE tu_trans.five_element END AS transformed_dung_element
FROM dbo.v_divination_results vr
JOIN dbo.hexagrams hi ON hi.hexagram_id = vr.initial_hexagram_id
JOIN dbo.hexagrams ht ON ht.hexagram_id = vr.transformed_hexagram_id
JOIN dbo.hexagrams hn ON hn.hexagram_id = vr.nuclear_hexagram_id
-- Join ngũ hành quẻ Hỗ
JOIN dbo.trigrams tu_nuc ON tu_nuc.binary_code = hn.upper_code
JOIN dbo.trigrams tl_nuc ON tl_nuc.binary_code = hn.lower_code
-- Join ngũ hành quẻ Biến
JOIN dbo.trigrams tu_trans ON tu_trans.binary_code = ht.upper_code
JOIN dbo.trigrams tl_trans ON tl_trans.binary_code = ht.lower_code;
GO

PRINT N'  + View v_divination_details_extended da tao.';
GO

-- =====================================================================
-- SECTION 2: BỘ STORED PROCEDURES KIỂM SOÁT THAO TÁC GHI
-- =====================================================================
PRINT N'=== Section 2: Tao cac Stored Procedures ===';
GO

-- 2.1 Tạo ca gieo quẻ
IF OBJECT_ID('dbo.sp_create_case', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_create_case;
GO

CREATE PROCEDURE dbo.sp_create_case
    @case_id UNIQUEIDENTIFIER OUTPUT,
    @pseudonymized_user_hash VARCHAR(64),
    @topic VARCHAR(20),
    @casting_method VARCHAR(20),
    @session_time DATETIME2 = NULL,
    @year_branch_num TINYINT = NULL,
    @lunar_month TINYINT = NULL,
    @lunar_day TINYINT = NULL,
    @hour_branch_num TINYINT = NULL,
    @number_upper INT = NULL,
    @number_lower INT = NULL,
    @system_output_summary NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @pseudonymized_user_hash IS NULL OR LEN(@pseudonymized_user_hash) <> 64
    BEGIN
        RAISERROR(N'LOI: pseudonymized_user_hash phai la chuoi hex 64 ky tu hop le.', 16, 1);
        RETURN;
    END

    IF @topic NOT IN ('CAREER','RELATIONSHIP','FINANCE','HEALTH','ACADEMIC','GENERAL')
    BEGIN
        RAISERROR(N'LOI: topic khong hop le.', 16, 1);
        RETURN;
    END

    IF @casting_method NOT IN ('MAI_HOA_TIME', 'MAI_HOA_NUMBER')
    BEGIN
        RAISERROR(N'LOI: casting_method phai la MAI_HOA_TIME hoac MAI_HOA_NUMBER.', 16, 1);
        RETURN;
    END

    IF @session_time IS NULL
        SET @session_time = SYSUTCDATETIME();

    SET @case_id = NEWID();

    BEGIN TRY
        BEGIN TRAN;
        INSERT INTO dbo.divination_cases (
            case_id, session_time, pseudonymized_user_hash, topic, casting_method,
            year_branch_num, lunar_month, lunar_day, hour_branch_num,
            number_upper, number_lower, system_output_summary, is_reviewed_for_best_practice
        ) VALUES (
            @case_id, @session_time, @pseudonymized_user_hash, @topic, @casting_method,
            @year_branch_num, @lunar_month, @lunar_day, @hour_branch_num,
            @number_upper, @number_lower, @system_output_summary, 0
        );
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO
PRINT N'  + Procedure sp_create_case da tao.';
GO

-- 2.2 Đóng góp diễn giải tri thức mới (Mặc định PENDING)
IF OBJECT_ID('dbo.sp_submit_interpretation', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_submit_interpretation;
GO

CREATE PROCEDURE dbo.sp_submit_interpretation
    @interpretation_id INT OUTPUT,
    @target_type VARCHAR(20),
    @hexagram_id INT,
    @line_position SMALLINT = NULL,
    @moving_line_position SMALLINT = NULL,
    @to_hexagram_id INT = NULL,
    @topic VARCHAR(20),
    @summary NVARCHAR(MAX),
    @guidance NVARCHAR(MAX),
    @polarity SMALLINT,
    @source_id INT,
    @author_type VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Kiểm tra sơ bộ tính hợp lệ của tác quyền trước khi gọi DB
    IF @author_type NOT IN ('CLASSIC', 'EXPERT', 'AI_DRAFT')
    BEGIN
        RAISERROR(N'LOI: author_type khong hop le.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        -- Tự động tăng version nếu đã có diễn giải trước đó cho cùng đối tượng & nguồn
        DECLARE @next_version INT;
        SELECT @next_version = ISNULL(MAX(version), 0) + 1
        FROM dbo.interpretations
        WHERE target_type = @target_type
          AND hexagram_id = @hexagram_id
          AND ((line_position IS NULL AND @line_position IS NULL) OR line_position = @line_position)
          AND ((moving_line_position IS NULL AND @moving_line_position IS NULL) OR moving_line_position = @moving_line_position)
          AND ((to_hexagram_id IS NULL AND @to_hexagram_id IS NULL) OR to_hexagram_id = @to_hexagram_id)
          AND topic = @topic
          AND source_id = @source_id;

        -- Luôn luôn ép review_status = PENDING, reviewed_by = NULL
        INSERT INTO dbo.interpretations (
            target_type, hexagram_id, line_position, moving_line_position, to_hexagram_id,
            topic, summary, guidance, polarity, source_id, author_type, version,
            review_status, reviewed_by, reviewed_at
        ) VALUES (
            @target_type, @hexagram_id, @line_position, @moving_line_position, @to_hexagram_id,
            @topic, @summary, @guidance, @polarity, @source_id, @author_type, @next_version,
            'PENDING', NULL, NULL
        );
        SET @interpretation_id = SCOPE_IDENTITY();
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO
PRINT N'  + Procedure sp_submit_interpretation da tao.';
GO

-- 2.3 Phê duyệt diễn giải (Chỉ dành cho Reviewer, cấm tự duyệt)
IF OBJECT_ID('dbo.sp_review_interpretation', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_review_interpretation;
GO

CREATE PROCEDURE dbo.sp_review_interpretation
    @interpretation_id INT,
    @reviewer NVARCHAR(100),
    @new_status VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @reviewer IS NULL OR LEN(TRIM(@reviewer)) = 0
    BEGIN
        RAISERROR(N'LOI: reviewed_by khong duoc de trong.', 16, 1);
        RETURN;
    END

    IF @new_status NOT IN ('APPROVED', 'REJECTED')
    BEGIN
        RAISERROR(N'LOI: new_status phai la APPROVED hoac REJECTED.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.interpretations WHERE interpretation_id = @interpretation_id)
    BEGIN
        RAISERROR(N'LOI: interpretation_id khong ton tai.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        UPDATE dbo.interpretations
        SET review_status = @new_status,
            reviewed_by   = @reviewer,
            reviewed_at   = SYSUTCDATETIME(),
            updated_at    = SYSUTCDATETIME()
        WHERE interpretation_id = @interpretation_id
          AND review_status = 'PENDING';

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(N'CANH BAO: Ban ghi khong o trang thai PENDING hoac da duoc xu ly.', 16, 1);
        END
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO
PRINT N'  + Procedure sp_review_interpretation da tao.';
GO

-- 2.4 Cập nhật phản hồi thực chứng (Double-loop Learning)
IF OBJECT_ID('dbo.sp_record_outcome', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_record_outcome;
GO

CREATE PROCEDURE dbo.sp_record_outcome
    @case_id UNIQUEIDENTIFIER,
    @verified_outcome NVARCHAR(MAX),
    @is_reviewed_for_best_practice BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.divination_cases WHERE case_id = @case_id)
    BEGIN
        RAISERROR(N'LOI: case_id khong ton tai.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;
        UPDATE dbo.divination_cases
        SET verified_outcome = @verified_outcome,
            is_reviewed_for_best_practice = @is_reviewed_for_best_practice
        WHERE case_id = @case_id;
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO
PRINT N'  + Procedure sp_record_outcome da tao.';
GO

-- =====================================================================
-- SECTION 3: TẠO DATABASE ROLE & PHÂN QUYỀN TỐI THIỂU
-- =====================================================================
PRINT N'=== Section 3: Tao Database Role va phan quyen ===';
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'db_process_layer' AND type = 'R')
BEGIN
    CREATE ROLE db_process_layer;
    PRINT N'  + Database Role db_process_layer da tao.';
END
ELSE
    PRINT N'  ~ Database Role db_process_layer da ton tai.';
GO

-- Quyền ĐỌC trên Views công khai và mở rộng
GRANT SELECT ON dbo.v_classic_texts_verified TO db_process_layer;
GRANT SELECT ON dbo.v_classic_texts_expert TO db_process_layer;
GRANT SELECT ON dbo.v_hexagram_trigrams TO db_process_layer;
GRANT SELECT ON dbo.v_divination_results TO db_process_layer;
GRANT SELECT ON dbo.v_divination_details_extended TO db_process_layer;
GRANT SELECT ON dbo.v_inference_rules_public TO db_process_layer;
GRANT SELECT ON dbo.v_interpretations_public TO db_process_layer;
GRANT SELECT ON dbo.sources TO db_process_layer;
GRANT SELECT ON dbo.five_element_relations TO db_process_layer;
PRINT N'  + Da cap quyen SELECT tren cac View & bang tham chieu cho db_process_layer.';
GO

-- Quyền THỰC THI trên các Stored Procedures
GRANT EXECUTE ON dbo.sp_create_case TO db_process_layer;
GRANT EXECUTE ON dbo.sp_submit_interpretation TO db_process_layer;
GRANT EXECUTE ON dbo.sp_review_interpretation TO db_process_layer;
GRANT EXECUTE ON dbo.sp_record_outcome TO db_process_layer;
PRINT N'  + Da cap quyen EXECUTE tren Stored Procedures cho db_process_layer.';
GO

-- CẤM TUYỆT ĐỐI các lệnh DML trực tiếp trên các bảng được bảo vệ
DENY INSERT, UPDATE, DELETE ON dbo.sources TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.trigrams TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.hexagrams TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.hexagram_lines TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.classic_texts TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.interpretations TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.inference_rules TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.five_element_relations TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.tags TO db_process_layer;
DENY INSERT, UPDATE, DELETE ON dbo.divination_cases TO db_process_layer;
PRINT N'  + Da thiet lap DENY DML truc tiep tren 10 bang bao ve cho db_process_layer.';
GO

PRINT N'=== Migration v3: HOAN THANH THANH CONG ===';
GO

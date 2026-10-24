/* =====================================================================
   KinhDich_KB - Schema Giai doan 1 (Mai Hoa Dich So), SQL Server 2017+
   CACH CHAY: mo file nay trong SSMS/Azure Data Studio, bam Execute (F5) MOT LAN.
   File tu tao database, tu chuyen sang database do, roi tao bang/trigger/view.
   ===================================================================== */

IF DB_ID('KinhDich_KB') IS NULL
    CREATE DATABASE KinhDich_KB;
GO
USE KinhDich_KB;
GO

-- ===== 1. NGUON =====
CREATE TABLE sources (
    source_id        INT IDENTITY(1,1) PRIMARY KEY,
    source_kind      VARCHAR(20)  NOT NULL CHECK (source_kind IN ('BOOK','EXPERT_PERSON','AI_MODEL')),
    title            NVARCHAR(255) NOT NULL,
    author           NVARCHAR(150) NULL,
    translator       NVARCHAR(150) NULL,
    publication_year INT NULL,
    version          INT NOT NULL DEFAULT 1,
    copyright_status VARCHAR(20) NULL CHECK (copyright_status IN ('PUBLIC_DOMAIN','COPYRIGHTED','INTERNAL')),
    reliability_score DECIMAL(3,2) NULL CHECK (reliability_score BETWEEN 0 AND 1),
    created_at       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE tags (
    tag_id   INT IDENTITY(1,1) PRIMARY KEY,
    tag_name NVARCHAR(50) NOT NULL UNIQUE
);

-- ===== 2. TAXONOMY =====
CREATE TABLE trigrams (
    trigram_id       INT PRIMARY KEY CHECK (trigram_id BETWEEN 1 AND 8),
    name_vn          NVARCHAR(50) NOT NULL,
    name_han         NVARCHAR(10) NULL,
    -- Ky tu TRAI = hao 3 (tren), ky tu PHAI = hao 1 (duoi). Duong=1, Am=0
    binary_code      CHAR(3) NOT NULL UNIQUE CHECK (binary_code LIKE '[01][01][01]'),
    five_element     VARCHAR(10) NOT NULL CHECK (five_element IN ('KIM','MOC','THUY','HOA','THO')),
    nature_symbol    NVARCHAR(50) NOT NULL,
    family_member    NVARCHAR(50) NOT NULL,
    early_heaven_num INT NOT NULL UNIQUE CHECK (early_heaven_num BETWEEN 1 AND 8), -- so Tien Thien, dung de lap que
    later_heaven_num INT NOT NULL,
    cardinal_direction NVARCHAR(30) NULL
);

CREATE TABLE hexagrams (
    hexagram_id  INT PRIMARY KEY CHECK (hexagram_id BETWEEN 1 AND 64),
    -- Ky tu TRAI = hao 6 (tren cung); 3 ky tu dau = que Thuong, 3 ky tu cuoi = que Ha
    binary_code  CHAR(6) NOT NULL UNIQUE CHECK (binary_code LIKE '[01][01][01][01][01][01]'),
    name_vn      NVARCHAR(100) NOT NULL,
    name_han     NVARCHAR(20) NULL,
    name_source  NVARCHAR(100) NULL,   -- ten que theo sach nguon (VD: Kien Vi Thien); name_vn la ten chuan cua nhom
    upper_code   AS LEFT(binary_code, 3)  PERSISTED,
    lower_code   AS RIGHT(binary_code, 3) PERSISTED,
    palace_id    INT NULL REFERENCES trigrams(trigram_id),   -- du phong Giai doan 2
    palace_position NVARCHAR(50) NULL
    -- Da bo FK tren cot tinh toan upper_code/lower_code (de loi). Kiem tra bang view v_hexagram_trigrams:
    -- que nao khong JOIN duoc voi trigrams nghia la ma bit sai.
);

CREATE TABLE hexagram_lines (
    hexagram_id INT NOT NULL REFERENCES hexagrams(hexagram_id),
    position    SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 7),  -- 7 = Dung Cuu / Dung Luc
    yin_yang    SMALLINT NULL CHECK (yin_yang IN (0,1)),             -- 0 Am, 1 Duong; NULL neu hao dac biet
    is_special  BIT NOT NULL DEFAULT 0,
    CONSTRAINT chk_line_validity CHECK (
        (is_special = 1 AND position = 7 AND yin_yang IS NULL AND hexagram_id IN (1,2)) OR
        (is_special = 0 AND position <= 6 AND yin_yang IS NOT NULL)),
    PRIMARY KEY (hexagram_id, position)
);

CREATE TABLE classic_texts (
    text_id       INT IDENTITY(1,1) PRIMARY KEY,
    hexagram_id   INT NOT NULL REFERENCES hexagrams(hexagram_id),
    line_position SMALLINT NULL,   -- NULL = van ban cap que
    text_type     VARCHAR(20) NOT NULL CHECK (text_type IN
                  ('THOAN_TU','THOAN_TRUYEN','DAI_TUONG','HAO_TU','TIEU_TUONG','VAN_NGON')),
    text_han      NVARCHAR(MAX) NULL,
    text_vn       NVARCHAR(MAX) NULL,
    source_id     INT NOT NULL REFERENCES sources(source_id),
    verified_by   NVARCHAR(100) NULL,
    verified_at   DATETIME2 NULL,
    CONSTRAINT fk_ct_line FOREIGN KEY (hexagram_id, line_position)
        REFERENCES hexagram_lines(hexagram_id, position),
    CONSTRAINT chk_ct_content  CHECK (text_han IS NOT NULL OR text_vn IS NOT NULL),
    CONSTRAINT chk_ct_verified CHECK ((verified_by IS NULL AND verified_at IS NULL)
                                   OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)),
    CONSTRAINT uq_classic_text UNIQUE (hexagram_id, line_position, text_type, source_id)
);

-- ===== 3. DIEN GIAI =====
CREATE TABLE interpretations (
    interpretation_id INT IDENTITY(1,1) PRIMARY KEY,
    target_type  VARCHAR(20) NOT NULL CHECK (target_type IN ('HEXAGRAM','LINE','TRANSFORMATION')),
    hexagram_id  INT NOT NULL REFERENCES hexagrams(hexagram_id),
    line_position        SMALLINT NULL CHECK (line_position BETWEEN 1 AND 7),
    moving_line_position SMALLINT NULL CHECK (moving_line_position BETWEEN 1 AND 6),
    to_hexagram_id       INT NULL REFERENCES hexagrams(hexagram_id),
    topic        VARCHAR(20) NOT NULL CHECK (topic IN
                 ('CAREER','RELATIONSHIP','FINANCE','HEALTH','ACADEMIC','GENERAL')),
    summary      NVARCHAR(MAX) NOT NULL,
    guidance     NVARCHAR(MAX) NOT NULL,
    polarity     SMALLINT NOT NULL CHECK (polarity BETWEEN -2 AND 2),
    source_id    INT NOT NULL REFERENCES sources(source_id),
    author_type  VARCHAR(10) NOT NULL CHECK (author_type IN ('CLASSIC','EXPERT','AI_DRAFT')),
    version      INT NOT NULL DEFAULT 1,
    review_status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
    reviewed_by  NVARCHAR(100) NULL,
    reviewed_at  DATETIME2 NULL,
    created_at   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_interp_line   FOREIGN KEY (hexagram_id, line_position)        REFERENCES hexagram_lines(hexagram_id, position),
    CONSTRAINT fk_interp_moving FOREIGN KEY (hexagram_id, moving_line_position) REFERENCES hexagram_lines(hexagram_id, position),
    CONSTRAINT chk_target_logic CHECK (
        (target_type='HEXAGRAM' AND line_position IS NULL AND moving_line_position IS NULL AND to_hexagram_id IS NULL) OR
        (target_type='LINE' AND line_position IS NOT NULL AND moving_line_position IS NULL AND to_hexagram_id IS NULL) OR
        (target_type='TRANSFORMATION' AND line_position IS NULL AND moving_line_position IS NOT NULL AND to_hexagram_id IS NOT NULL)),
    CONSTRAINT chk_approval_audit CHECK (review_status <> 'APPROVED' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
    CONSTRAINT uq_interp UNIQUE (target_type, hexagram_id, line_position, moving_line_position,
                                 to_hexagram_id, topic, source_id, version)
);
GO

CREATE TABLE interpretation_tags (
    interpretation_id INT NOT NULL REFERENCES interpretations(interpretation_id),
    tag_id            INT NOT NULL REFERENCES tags(tag_id),
    PRIMARY KEY (interpretation_id, tag_id)
);
GO

-- Trigger: author_type phai khop source_kind (du 3 nhanh)
CREATE TRIGGER trg_interp_source_kind ON interpretations AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i JOIN sources s ON s.source_id = i.source_id
        WHERE (i.author_type = 'CLASSIC'  AND s.source_kind <> 'BOOK')
           OR (i.author_type = 'EXPERT'   AND s.source_kind <> 'EXPERT_PERSON')
           OR (i.author_type = 'AI_DRAFT' AND s.source_kind <> 'AI_MODEL'))
    BEGIN
        RAISERROR(N'author_type khong khop source_kind.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- ===== 4. RULE BASE =====
CREATE TABLE five_element_relations (
    relation_id     INT IDENTITY(1,1) PRIMARY KEY,
    school          VARCHAR(20) NOT NULL CHECK (school IN ('I_CHING_CLASSIC','PLUM_BLOSSOM','SIX_YAO')),
    primary_element VARCHAR(10) NOT NULL CHECK (primary_element IN ('KIM','MOC','THUY','HOA','THO')),  -- The
    target_element  VARCHAR(10) NOT NULL CHECK (target_element  IN ('KIM','MOC','THUY','HOA','THO')),  -- Dung
    relation_type   VARCHAR(10) NOT NULL CHECK (relation_type IN ('SINH_XUAT','SINH_NHAP','KHAC_XUAT','KHAC_NHAP','TY_HOA')),
    polarity_weight SMALLINT NOT NULL CHECK (polarity_weight BETWEEN -2 AND 2),
    source_id       INT NOT NULL REFERENCES sources(source_id),
    review_status   VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
    reviewed_by     NVARCHAR(100) NULL,
    reviewed_at     DATETIME2 NULL,
    CONSTRAINT chk_fer_audit CHECK (review_status <> 'APPROVED' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
    UNIQUE (school, primary_element, target_element, source_id)
);

CREATE TABLE inference_rules (
    rule_id        INT IDENTITY(1,1) PRIMARY KEY,
    rule_code      VARCHAR(50) NOT NULL UNIQUE,
    school         VARCHAR(20) NOT NULL CHECK (school IN ('I_CHING_CLASSIC','PLUM_BLOSSOM','SIX_YAO')),
    condition_description NVARCHAR(MAX) NOT NULL,
    condition_expression  NVARCHAR(MAX) NOT NULL CHECK (ISJSON(condition_expression) = 1),
    conclusion_template   NVARCHAR(MAX) NOT NULL,
    priority       INT NOT NULL DEFAULT 0,
    source_id      INT NOT NULL REFERENCES sources(source_id),
    version        INT NOT NULL DEFAULT 1,
    review_status  VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
    reviewed_by    NVARCHAR(100) NULL,
    reviewed_at    DATETIME2 NULL,
    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT chk_rule_audit CHECK (review_status <> 'APPROVED' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

-- ===== 5. VAN HANH: chi Mai Hoa, luu du lieu DAU VAO =====
CREATE TABLE divination_cases (
    case_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    session_time DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    pseudonymized_user_hash VARCHAR(64) NOT NULL,
    topic VARCHAR(20) NOT NULL CHECK (topic IN
          ('CAREER','RELATIONSHIP','FINANCE','HEALTH','ACADEMIC','GENERAL')),
    casting_method VARCHAR(20) NOT NULL CHECK (casting_method IN ('MAI_HOA_TIME','MAI_HOA_NUMBER')),
    -- Cach theo thoi gian (am lich)
    year_branch_num TINYINT NULL CHECK (year_branch_num BETWEEN 1 AND 12),
    lunar_month     TINYINT NULL CHECK (lunar_month BETWEEN 1 AND 12),
    lunar_day       TINYINT NULL CHECK (lunar_day BETWEEN 1 AND 30),
    hour_branch_num TINYINT NULL CHECK (hour_branch_num BETWEEN 1 AND 12),
    -- Cach theo so
    number_upper INT NULL CHECK (number_upper >= 1),
    number_lower INT NULL CHECK (number_lower >= 1),
    system_output_summary NVARCHAR(MAX) NULL,
    verified_outcome NVARCHAR(MAX) NULL,
    is_reviewed_for_best_practice BIT NOT NULL DEFAULT 0,
    CONSTRAINT chk_casting_inputs CHECK (
        (casting_method = 'MAI_HOA_TIME'
            AND year_branch_num IS NOT NULL AND lunar_month IS NOT NULL
            AND lunar_day IS NOT NULL AND hour_branch_num IS NOT NULL
            AND number_upper IS NULL AND number_lower IS NULL)
     OR (casting_method = 'MAI_HOA_NUMBER'
            AND number_upper IS NOT NULL AND number_lower IS NOT NULL
            AND year_branch_num IS NULL AND lunar_month IS NULL
            AND lunar_day IS NULL AND hour_branch_num IS NULL))
);
GO

-- ===== 6. VIEWS =====
CREATE VIEW v_interpretations_public AS
SELECT interpretation_id, target_type, hexagram_id, line_position, moving_line_position,
       to_hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version
FROM interpretations WHERE review_status = 'APPROVED';
GO
CREATE VIEW v_inference_rules_public AS
SELECT rule_id, rule_code, school, condition_description, condition_expression,
       conclusion_template, priority, version
FROM inference_rules WHERE review_status = 'APPROVED';
GO
CREATE VIEW v_classic_texts_verified AS
SELECT text_id, hexagram_id, line_position, text_type, text_han, text_vn, source_id
FROM classic_texts WHERE verified_by IS NOT NULL;
GO
CREATE VIEW v_hexagram_trigrams AS
SELECT h.hexagram_id, h.name_vn, h.binary_code,
       h.upper_code, tu.name_vn AS upper_name, h.lower_code, tl.name_vn AS lower_name
FROM hexagrams h
JOIN trigrams tu ON tu.binary_code = h.upper_code
JOIN trigrams tl ON tl.binary_code = h.lower_code;
GO

-- Que chu, hao dong, que bien, ho quai, The/Dung
-- binary_code: ky tu TRAI = hao 6 (tren). Hao k nam o vi tri ky tu (7 - k).
CREATE VIEW v_divination_results AS
SELECT dc.case_id, dc.casting_method, dc.topic,
       c.upper_n, c.lower_n, c.moving_line,
       hi.hexagram_id AS initial_hexagram_id, hi.name_vn AS initial_name,
       ht.hexagram_id AS transformed_hexagram_id, ht.name_vn AS transformed_name,
       hn.hexagram_id AS nuclear_hexagram_id,  hn.name_vn AS nuclear_name,
       CASE WHEN c.moving_line <= 3 THEN 'LOWER' ELSE 'UPPER' END AS dung_side,
       CASE WHEN c.moving_line <= 3 THEN tl.five_element ELSE tu.five_element END AS dung_element,
       CASE WHEN c.moving_line <= 3 THEN tu.five_element ELSE tl.five_element END AS the_element
FROM divination_cases dc
CROSS APPLY (SELECT
    CASE dc.casting_method WHEN 'MAI_HOA_TIME'
         THEN ((dc.year_branch_num + dc.lunar_month + dc.lunar_day - 1) % 8) + 1
         ELSE ((dc.number_upper - 1) % 8) + 1 END AS upper_n,
    CASE dc.casting_method WHEN 'MAI_HOA_TIME'
         THEN ((dc.year_branch_num + dc.lunar_month + dc.lunar_day + dc.hour_branch_num - 1) % 8) + 1
         ELSE ((dc.number_lower - 1) % 8) + 1 END AS lower_n,
    CASE dc.casting_method WHEN 'MAI_HOA_TIME'
         THEN ((dc.year_branch_num + dc.lunar_month + dc.lunar_day + dc.hour_branch_num - 1) % 6) + 1
         ELSE ((dc.number_upper + dc.number_lower - 1) % 6) + 1 END AS moving_line) c
JOIN trigrams tu ON tu.early_heaven_num = c.upper_n
JOIN trigrams tl ON tl.early_heaven_num = c.lower_n
CROSS APPLY (SELECT tu.binary_code + tl.binary_code AS initial_binary) b
CROSS APPLY (SELECT
    STUFF(b.initial_binary, 7 - c.moving_line, 1,
          CASE SUBSTRING(b.initial_binary, 7 - c.moving_line, 1) WHEN '1' THEN '0' ELSE '1' END) AS transformed_binary,
    SUBSTRING(b.initial_binary, 2, 3) + SUBSTRING(b.initial_binary, 3, 3) AS nuclear_binary) t
LEFT JOIN hexagrams hi ON hi.binary_code = b.initial_binary
LEFT JOIN hexagrams ht ON ht.binary_code = t.transformed_binary
LEFT JOIN hexagrams hn ON hn.binary_code = t.nuclear_binary;
GO

-- ===== KIEM TRA SAU KHI CHAY =====
SELECT name FROM sys.tables ORDER BY name;   -- phai thay 11 bang
SELECT name FROM sys.views  ORDER BY name;   -- phai thay 5 view
GO

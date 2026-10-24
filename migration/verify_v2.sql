/* =====================================================================
   KinhDich_KB — verify_v2.sql
   Cac query kiem tra "ky vong 0 dong" sau migration_v2.
   
   Moi query phai tra ve 0 dong neu DB o trang thai hop le.
   Neu co ket qua -> phat hien van de cu the.
   
   CACH CHAY:
     sqlcmd -S "(local)" -E -d KinhDich_KB -b -f 65001 -I -i verify_v2_nobom.sql
   ===================================================================== */

USE KinhDich_KB;
GO

PRINT N'=== verify_v2.sql: Bat dau kiem tra ===';
PRINT N'Mo mong: Moi section phai tra ve 0 dong';
GO

-- =====================================================================
-- V1: Que thieu dong (expected: 0 dong)
-- Moi que tu 5-64 phai co dung 15 dong (tru que 1-4 chua nap)
-- =====================================================================
PRINT N'V1: Que thieu dong (phai = 0 dong khi que 5-64 da nap day du):';
SELECT h.hexagram_id, h.name_vn, COUNT(ct.text_id) AS actual_rows,
       15 AS expected_rows,
       (15 - COUNT(ct.text_id)) AS missing
FROM dbo.hexagrams h
LEFT JOIN dbo.classic_texts ct ON ct.hexagram_id = h.hexagram_id
WHERE h.hexagram_id BETWEEN 5 AND 64
GROUP BY h.hexagram_id, h.name_vn
HAVING COUNT(ct.text_id) <> 15
ORDER BY h.hexagram_id;
GO

-- =====================================================================
-- V2: Dong trung khoa (UNIQUE constraint) -- phai = 0
-- =====================================================================
PRINT N'V2: Dong trung khoa (phai = 0):';
SELECT hexagram_id, line_position, text_type, source_id, COUNT(*) AS cnt
FROM dbo.classic_texts
GROUP BY hexagram_id, line_position, text_type, source_id
HAVING COUNT(*) > 1
ORDER BY hexagram_id, text_type;
GO

-- =====================================================================
-- V3: text_han chua ky tu la (khong phai chu Han, khong phai NULL)
-- Phat hien: chu Latin, so, dau cau la -- phai = 0
-- =====================================================================
PRINT N'V3: text_han chua ky tu la (phai = 0):';
SELECT text_id, hexagram_id, line_position, text_type,
       LEFT(text_han, 50) AS text_han_preview
FROM dbo.classic_texts
WHERE text_han IS NOT NULL
  AND text_han LIKE N'%[A-Za-z0-9]%'   -- co chu Latin hoac so
ORDER BY hexagram_id, text_type;
GO

-- =====================================================================
-- V4: APPROVED thieu verified_by (phai = 0)
-- =====================================================================
PRINT N'V4: review_status=APPROVED nhung verified_by NULL (phai = 0):';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.classic_texts') AND name = 'review_status')
BEGIN
    SELECT text_id, hexagram_id, line_position, text_type, review_status, verified_by
    FROM dbo.classic_texts
    WHERE review_status = 'APPROVED' 
      AND (verified_by IS NULL OR verified_at IS NULL);
END
ELSE
    SELECT N'SKIP: cot review_status chua ton tai' AS warning;
GO

-- =====================================================================
-- V5: Hao khong co trong hexagram_lines
-- =====================================================================
PRINT N'V5: classic_texts.line_position khong co trong hexagram_lines (phai = 0):';
SELECT ct.text_id, ct.hexagram_id, ct.line_position, ct.text_type
FROM dbo.classic_texts ct
WHERE ct.line_position IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM dbo.hexagram_lines hl
      WHERE hl.hexagram_id = ct.hexagram_id 
        AND hl.position = ct.line_position
  );
GO

-- =====================================================================
-- V6: text_han va text_vn deu NULL (vi pham chk_ct_content)
-- =====================================================================
PRINT N'V6: text_han va text_vn deu NULL (phai = 0):';
SELECT text_id, hexagram_id, line_position, text_type
FROM dbo.classic_texts
WHERE text_han IS NULL AND text_vn IS NULL;
GO

-- =====================================================================
-- V7: Nhan thua trong text_vn (sau migration)
-- =====================================================================
PRINT N'V7: Nhan Thoán Truyện: o cuoi text_vn (phai = 0):';
SELECT text_id, hexagram_id, text_type
FROM dbo.classic_texts
WHERE text_vn LIKE N'%Thoán Truyện:%';
GO

-- =====================================================================
-- V8: Dau cham le dau text_vn (phai = 0)
-- =====================================================================
PRINT N'V8: text_vn bat dau bang dau cham (phai = 0):';
SELECT text_id, hexagram_id, text_type, LEFT(text_vn, 10) AS preview
FROM dbo.classic_texts
WHERE text_vn LIKE N'.' + NCHAR(10) + N'%'
   OR text_vn LIKE N'. %';
GO

-- =====================================================================
-- V9: Kiem tra source_id hop le
-- =====================================================================
PRINT N'V9: source_id trong classic_texts khong co trong sources (phai = 0):';
SELECT DISTINCT ct.source_id
FROM dbo.classic_texts ct
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.sources s WHERE s.source_id = ct.source_id
);
GO

-- =====================================================================
-- V10: Tong ket
-- =====================================================================
PRINT N'V10: Tong ket so lieu:';
SELECT 
    (SELECT COUNT(*) FROM dbo.classic_texts) AS total_classic_texts,
    (SELECT COUNT(*) FROM dbo.classic_texts WHERE text_han IS NULL) AS null_han_count,
    (SELECT COUNT(*) FROM dbo.classic_texts WHERE verified_by IS NOT NULL) AS verified_count,
    (SELECT COUNT(DISTINCT hexagram_id) FROM dbo.classic_texts) AS hexagrams_with_texts;
GO

PRINT N'=== verify_v2.sql: HOAN THANH ===';
PRINT N'Tat ca cac section phai tra ve 0 dong (tru V10 la tong ket).';
GO

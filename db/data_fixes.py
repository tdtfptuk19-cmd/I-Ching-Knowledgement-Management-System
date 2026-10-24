#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
data_fixes.py - sinh SQL SUA DU LIEU co chot chan (NGUOI DUNG chay trong SSMS) va cac cong cu danh sach.
Moi lenh UPDATE: chi ghi khi gia tri hien tai dung nhu ky vong, kiem tra so dong, chay trong giao dich,
va ghi nhat ky vao bang data_corrections (tu tao neu chua co). Script nay KHONG ket noi DB.

  known        --final-b02 F --final-b03 F --out X.sql [--overlay overlay.json]
               Sua 2 loi da biet (Q12 Thoan truyen 說->則; Q16 'dĩ动'->'dĩ động') + ghi chu Q12 text_vn.
  normalize-vn --old F1 F2 ... --new PARSER.json --out X.sql [--overlay ...] [--expect 28]
               Dua text_vn cac que 1-4 ve dau ra co hoc cua parser (quy uoc A).
  source-ref   --json F1 F2 ... --out X.sql
               Them cot source_ref (so trang PDF) va dien tu _meta.source_ref (chay lai duoc, chi dien o con NULL).
  gaps-sheet   --json F1 F2 ... --out gaps_master.csv
               Danh sach dong text_han NULL de NHAP KEP (2 lan doc lap tu anh trang).
  gaps-sql     --sheet gaps_master.csv --out X.sql [--overlay ...]
               Chi nhan dong 2 lan nhap khop nhau, chi la chu Han.
  pages-csv    --pdf P --first 31 --last 64 --out compare_names_ha_kinh.csv
               Tim tieu de que trong PDF (can pypdf), doi chieu ten Han voi build_64_que.py.

Chi dung thu vien chuan (pages-csv can them pypdf).
"""
import argparse
import csv
import hashlib
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
CJK_ONLY = re.compile(r"^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\U00020000-\U0002a6df]+$")

DDL_CORR = """USE KinhDich_KB;
GO
IF OBJECT_ID(N'data_corrections', N'U') IS NULL
CREATE TABLE data_corrections (
    correction_id INT IDENTITY(1,1) PRIMARY KEY,
    applied_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    batch_label   VARCHAR(40) NOT NULL,
    change_type   VARCHAR(10) NOT NULL CHECK (change_type IN ('UPDATE','NOTE')),
    table_name    VARCHAR(40) NOT NULL,
    hexagram_id   INT NULL,
    line_position SMALLINT NULL,
    text_type     VARCHAR(20) NULL,
    column_name   VARCHAR(40) NOT NULL,
    old_value     NVARCHAR(MAX) NULL,
    new_value     NVARCHAR(MAX) NULL,
    reason        NVARCHAR(500) NOT NULL,
    applied_by    NVARCHAR(128) NOT NULL DEFAULT SUSER_SNAME()
);
GO
"""


# ----------------------------------------------------------------------------- tien ich
def die(msg):
    print("DUNG: " + msg)
    sys.exit(1)


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def rows_of(p):
    return load_json(p)["classic_texts"]


def key(r):
    return (r.get("hexagram_id"), r.get("line_position"), r.get("text_type"))


def norm_han(s):
    return "".join(c for c in (s or "") if unicodedata.category(c)[0] not in "PZC")


def sq(v):
    return "NULL" if v is None else "N'" + str(v).replace("'", "''") + "'"


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        h.update(f.read())
    return h.hexdigest().upper()


def lpn(v):
    return -1 if v is None else int(v)


def issues(r):
    v = (r.get("_meta") or {}).get("issues") or []
    return [str(x) for x in v] if isinstance(v, list) else [str(v)]


def write_sql(path, text):
    if os.path.exists(path):
        die(f"{path} da ton tai; khong ghi de. Doi ten hoac xoa file cu.")
    with open(path, "w", encoding="utf-8-sig", newline="\n") as f:
        f.write(text)
    print(f"Da tao {path}")


def add_overlay(path, entries):
    """entries: list of (hid, lp, tt, column, value). Gop vao file overlay (thay muc cung khoa+cot)."""
    cur = {}
    if path and os.path.exists(path):
        for o in load_json(path)["overrides"]:
            cur[(o["hexagram_id"], o["line_position"], o["text_type"], o["column"])] = o["value"]
    for h, lp, tt, col, val in entries:
        cur[(h, lp, tt, col)] = val
    if path:
        out = [{"hexagram_id": k[0], "line_position": k[1], "text_type": k[2], "column": k[3], "value": v}
               for k, v in sorted(cur.items(), key=lambda x: (x[0][0], -1 if x[0][1] is None else x[0][1], x[0][2], x[0][3]))]
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"overrides": out}, f, ensure_ascii=False, indent=2)
        print(f"Da cap nhat overlay {path} ({len(out)} muc)")


def pages_of(ref):
    ref = ref or ""
    m = re.search(r"p\.\s*(\d+)(?:\s*[-\u2013\u2014]\s*(\d+))?", ref)
    if not m:
        m = re.search(r"(?:trang|page)\s*(\d+)(?:\s*[-\u2013\u2014]\s*(\d+))?", ref, re.I)
    if not m:
        return None
    return f"p. {m.group(1)}" if not m.group(2) or m.group(2) == m.group(1) else f"p. {m.group(1)}-{m.group(2)}"


def header(title, inputs):
    lines = [f"/* {title} */"]
    for p in inputs:
        lines.append(f"/*   nguon: {os.path.basename(p)}  SHA256 {sha(p)} */")
    return "\n".join(lines) + "\n"


def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


# ----------------------------------------------------------------------------- known
def find(rows, h, lp, tt):
    c = [r for r in rows if key(r) == (h, lp, tt)]
    if len(c) != 1:
        die(f"khong tim thay dung 1 dong {h}/{'-' if lp is None else lp}/{tt} (thay {len(c)})")
    return c[0]


def cmd_known(a):
    OLD_H, NEW_H = "大往小來說是", "大往小來則是"
    OLD_V, NEW_V = "dĩ动", "dĩ động"
    r12 = find(rows_of(a.final_b02), 12, None, "THOAN_TRUYEN")
    if (r12["text_han"] or "").count(OLD_H) != 1:
        die(f"text_han cua que 12 Thoan truyen khong chua dung 1 lan '{OLD_H}' (co {(r12['text_han'] or '').count(OLD_H)})")
    new_han = norm_han(r12["text_han"].replace(OLD_H, NEW_H))
    r16 = find(rows_of(a.final_b03), 16, None, "THOAN_TRUYEN")
    if (r16["text_vn"] or "").count(OLD_V) != 1:
        die(f"text_vn cua que 16 Thoan truyen khong chua dung 1 lan '{OLD_V}' (co {(r16['text_vn'] or '').count(OLD_V)})")
    new_vn = r16["text_vn"].replace(OLD_V, NEW_V)

    r1 = ("PDF lop chu (Thoan truyen que 12, Bi) in '則' o vi tri nay; final dang co '說' (go nham khi sua tay). "
          "Doi 說->則.")
    r2 = ("PDF in 'dĩ động' (audit v3 bao MISSING_WORD); final dang co ky tu '动' lac vao. Doi 'dĩ动' -> 'dĩ động'.")
    r3 = ("GHI NHAN, khong sua: text_vn dong nay duoc dung lai bang tay trong final (manual_fix tach han van va phien am). "
          "Phan phien am cua doan Han dau khong co trong lop chu PDF (suy tu cach doc Han-Viet) va chu hoa/dau cau khac raw; "
          "dong nay khong con la trich nguyen van tu nguon.")

    def fix(label, col, old, new, h, tt, reason, errno):
        return f"""
INSERT INTO data_corrections (batch_label, change_type, table_name, hexagram_id, line_position, text_type, column_name, old_value, new_value, reason)
SELECT '{label}', 'UPDATE', 'classic_texts', hexagram_id, line_position, text_type, '{col}', {col}, REPLACE({col}, {sq(old)}, {sq(new)}), {sq(reason)}
FROM classic_texts WHERE hexagram_id = {h} AND line_position IS NULL AND text_type = '{tt}' AND {col} LIKE N'%' + {sq(old)} + N'%';
SET @n = @@ROWCOUNT; IF @n <> 1 THROW {errno}, N'{label}: khong tim thay dung 1 dong de ghi nhat ky', 1;
UPDATE classic_texts SET {col} = REPLACE({col}, {sq(old)}, {sq(new)})
WHERE hexagram_id = {h} AND line_position IS NULL AND text_type = '{tt}' AND {col} LIKE N'%' + {sq(old)} + N'%';
SET @n = @@ROWCOUNT; IF @n <> 1 THROW {errno + 1}, N'{label}: so dong cap nhat khac 1', 1;
"""

    sql = header("FIX-KNOWN: sua 2 loi da biet + 1 ghi chu (NGUOI DUNG chay trong SSMS)", [a.final_b02, a.final_b03]) + DDL_CORR
    sql += "SET XACT_ABORT ON;\nBEGIN TRY\nBEGIN TRAN;\nDECLARE @n INT;\n"
    sql += fix("FIX-1", "text_han", OLD_H, NEW_H, 12, "THOAN_TRUYEN", r1, 50011)
    sql += fix("FIX-2", "text_vn", OLD_V, NEW_V, 16, "THOAN_TRUYEN", r2, 50013)
    sql += f"""
INSERT INTO data_corrections (batch_label, change_type, table_name, hexagram_id, line_position, text_type, column_name, old_value, new_value, reason)
SELECT 'FIX-3', 'NOTE', 'classic_texts', hexagram_id, line_position, text_type, 'text_vn', text_vn, NULL, {sq(r3)}
FROM classic_texts WHERE hexagram_id = 12 AND line_position IS NULL AND text_type = 'THOAN_TRUYEN';
SET @n = @@ROWCOUNT; IF @n <> 1 THROW 50015, N'FIX-3: khong tim thay dung 1 dong', 1;
COMMIT;
PRINT N'FIX-KNOWN: xong (2 UPDATE, 1 NOTE).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
GO
SELECT correction_id, batch_label, change_type, hexagram_id, text_type, column_name, applied_at FROM data_corrections ORDER BY correction_id;
"""
    write_sql(a.out, sql)
    add_overlay(a.overlay, [(12, None, "THOAN_TRUYEN", "text_han", new_han), (16, None, "THOAN_TRUYEN", "text_vn", new_vn)])
    print("Se thay doi: 2 gia tri (Q12 text_han, Q16 text_vn) + 1 ghi chu. Mo file .sql de doc truoc khi chay.")


# ----------------------------------------------------------------------------- normalize-vn
def cmd_normalize(a):
    old = {}
    for f in a.old:
        for r in rows_of(f):
            if r.get("text_type") == "VAN_NGON":
                continue
            if key(r) in old:
                die(f"khoa trung trong cac file --old: {key(r)}")
            old[key(r)] = r
    new = {}
    for r in rows_of(a.new):
        if r.get("text_type") == "VAN_NGON":
            continue
        new[key(r)] = r
    extra = [k for k in new if k not in old]
    if extra:
        die(f"{len(extra)} dong trong --new khong co trong --old, vd {extra[:3]}")
    miss = [k for k in old if k not in new]
    if miss:
        print(f"CANH BAO: {len(miss)} dong cua --old khong co trong --new (khong doi), vd {miss[:3]}")
    han_bad = [k for k in new if norm_han(new[k].get("text_han")) != norm_han(old[k].get("text_han"))
               and not (new[k].get("text_han") is None and old[k].get("text_han") is None)]
    if han_bad:
        die(f"text_han khac nhau giua --old va --new o {len(han_bad)} dong (khong duoc phep): {han_bad[:3]}")
    diffs = []
    for k in sorted(new, key=lambda k: (k[0], -1 if k[1] is None else k[1], k[2])):
        ov, nv = old[k].get("text_vn"), new[k].get("text_vn")
        if nv is None:
            die(f"--new co text_vn rong tai {k}")
        if ov != nv:
            diffs.append((k, ov, nv))
    n = len(diffs)
    print(f"So dong so sanh: {len(new)}; text_vn khac nhau: {n}" + ("" if n == a.expect else f"  (CANH BAO: ky vong {a.expect})"))
    if n == 0:
        die("khong co dong nao can doi.")
    sql = header("NORM-VN: chuan hoa text_vn theo dau ra co hoc cua parser (quy uoc A)", a.old + [a.new]) + DDL_CORR
    sql += "IF OBJECT_ID('tempdb..#n') IS NOT NULL DROP TABLE #n;\n"
    sql += "CREATE TABLE #n (hid INT NOT NULL, lp INT NOT NULL, tt VARCHAR(20) NOT NULL, old_vn NVARCHAR(MAX) NULL, new_vn NVARCHAR(MAX) NOT NULL);\n"
    for ch in chunks(diffs, 10):
        sql += "INSERT INTO #n (hid, lp, tt, old_vn, new_vn) VALUES\n" + ",\n".join(
            f"({k[0]}, {lpn(k[1])}, '{k[2]}', {sq(ov)}, {sq(nv)})" for k, ov, nv in ch) + ";\n"
    join = ("FROM classic_texts c JOIN #n m ON c.hexagram_id = m.hid AND ISNULL(c.line_position, -1) = m.lp "
            "AND c.text_type = m.tt AND c.text_vn = m.old_vn")
    sql += f"""SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRAN;
DECLARE @n INT;
INSERT INTO data_corrections (batch_label, change_type, table_name, hexagram_id, line_position, text_type, column_name, old_value, new_value, reason)
SELECT 'NORM-VN', 'UPDATE', 'classic_texts', c.hexagram_id, c.line_position, c.text_type, 'text_vn', c.text_vn, m.new_vn,
       N'Chuan hoa text_vn theo dau ra co hoc cua parser (quy uoc A: giu nhan va ngat dong cua nguon)'
{join};
SET @n = @@ROWCOUNT; IF @n <> {n} THROW 50021, N'NORM-VN: so dong khop gia tri cu khac ky vong (DB co the da bi sua)', 1;
UPDATE c SET c.text_vn = m.new_vn
{join};
SET @n = @@ROWCOUNT; IF @n <> {n} THROW 50022, N'NORM-VN: so dong cap nhat khac ky vong', 1;
COMMIT;
PRINT N'NORM-VN: xong, {n} dong.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
GO
"""
    write_sql(a.out, sql)
    add_overlay(a.overlay, [(k[0], k[1], k[2], "text_vn", nv) for k, _, nv in diffs])


# ----------------------------------------------------------------------------- source-ref
def cmd_source_ref(a):
    refs, nopage, src = {}, 0, {}
    for f in a.json:
        for r in rows_of(f):
            if r.get("text_type") == "VAN_NGON":
                continue
            k = key(r)
            if k in refs or k in src:
                die(f"khoa trung giua cac file: {k}")
            src[k] = f
            p = pages_of((r.get("_meta") or {}).get("source_ref"))
            if p is None:
                nopage += 1
                continue
            refs[k] = p
    n = len(refs)
    print(f"{n} dong co so trang; {nopage} dong khong doc duoc so trang (bo qua)")
    if n == 0:
        die("khong co dong nao co so trang")
    items = sorted(refs.items(), key=lambda kv: (kv[0][0], -1 if kv[0][1] is None else kv[0][1], kv[0][2]))
    sql = header("SOURCE-REF: them cot source_ref va dien so trang PDF", a.json) + DDL_CORR
    sql += "IF COL_LENGTH('classic_texts', 'source_ref') IS NULL ALTER TABLE classic_texts ADD source_ref NVARCHAR(40) NULL;\nGO\n"
    sql += "IF OBJECT_ID('tempdb..#r') IS NOT NULL DROP TABLE #r;\nCREATE TABLE #r (hid INT NOT NULL, lp INT NOT NULL, tt VARCHAR(20) NOT NULL, ref NVARCHAR(40) NOT NULL);\n"
    for ch in chunks(items, 200):
        sql += "INSERT INTO #r (hid, lp, tt, ref) VALUES\n" + ",\n".join(
            f"({k[0]}, {lpn(k[1])}, '{k[2]}', {sq(v)})" for k, v in ch) + ";\n"
    jn = "FROM classic_texts c JOIN #r r ON c.hexagram_id = r.hid AND ISNULL(c.line_position, -1) = r.lp AND c.text_type = r.tt"
    sql += f"""SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRAN;
DECLARE @m INT, @n INT;
SELECT @m = COUNT(*) {jn};
IF @m <> {n} THROW 50031, N'SOURCE-REF: so dong khop khoa trong DB khac so dong trong file (thieu quẻ chua nap?)', 1;
UPDATE c SET c.source_ref = r.ref {jn} WHERE c.source_ref IS NULL;
SET @n = @@ROWCOUNT;
INSERT INTO data_corrections (batch_label, change_type, table_name, column_name, reason)
VALUES ('SOURCE-REF', 'NOTE', 'classic_texts', 'source_ref', CONCAT(N'Them cot va dien source_ref cho ', @n, N' dong (tren tong {n} dong trong file nguon)'));
COMMIT;
PRINT CONCAT(N'SOURCE-REF: da dien ', @n, N' dong.');
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
GO
SELECT COUNT(*) AS tong, SUM(CASE WHEN source_ref IS NOT NULL THEN 1 ELSE 0 END) AS co_source_ref FROM classic_texts;
"""
    write_sql(a.out, sql)


# ----------------------------------------------------------------------------- gaps
def gap_kind(r):
    s = " ".join(issues(r))
    if "han_text_unreadable" in s:
        return "font"
    if any(w in s for w in ("source_defect", "duplicate", "heading_label_mismatch")):
        return "source_duplicate"
    return "other"


def cmd_gaps_sheet(a):
    if os.path.exists(a.out):
        die(f"{a.out} da ton tai; khong ghi de.")
    rows = []
    for f in a.json:
        for r in rows_of(f):
            if r.get("text_type") != "VAN_NGON" and r.get("text_han") is None:
                rows.append(r)
    rows.sort(key=lambda r: (r["hexagram_id"], -1 if r.get("line_position") is None else r["line_position"], r["text_type"]))
    with open(a.out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["hexagram_id", "line_position", "text_type", "source_id", "gap_kind", "pages", "han_entry_1", "han_entry_2", "note"])
        for r in rows:
            gk = gap_kind(r)
            w.writerow([r["hexagram_id"], "" if r.get("line_position") is None else r["line_position"], r["text_type"],
                        r.get("source_id"), gk, pages_of((r.get("_meta") or {}).get("source_ref")) or "", "", "",
                        "NGUON IN LAP/SAI: khong dien duoc tu PDF nay, can nguon thu hai" if gk == "source_duplicate" else ""])
    kinds = {}
    for r in rows:
        kinds[gap_kind(r)] = kinds.get(gap_kind(r), 0) + 1
    print(f"Da tao {a.out}: {len(rows)} dong text_han NULL {kinds}")
    print("Cach nhap kep: nguoi 1 dien han_entry_1 tu ANH TRANG; nguoi 2 (hoac cung nguoi, phien khac) dien han_entry_2 ma KHONG nhin cot 1.")


def cmd_gaps_sql(a):
    with open(a.sheet, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    good, problems, skipped = [], [], 0
    for r in rows:
        e1, e2 = norm_han(r.get("han_entry_1")), norm_han(r.get("han_entry_2"))
        k = (int(r["hexagram_id"]), None if (r.get("line_position") or "").strip() == "" else int(r["line_position"]), r["text_type"].strip())
        if not e1 and not e2:
            skipped += 1
            continue
        if not e1 or not e2:
            problems.append(f"{k}: moi co 1 lan nhap")
        elif e1 != e2:
            problems.append(f"{k}: hai lan nhap KHAC nhau ({e1} / {e2})")
        elif not CJK_ONLY.match(e1):
            problems.append(f"{k}: co ky tu khong phai chu Han")
        else:
            good.append((k, e1))
    print(f"Chap nhan {len(good)} dong; bo qua (chua nhap) {skipped}; co van de {len(problems)}")
    for p in problems:
        print("  VAN DE:", p)
    if not good:
        die("khong co dong nao du dieu kien.")
    n = len(good)
    sql = header("GAPS: dien text_han bang nhap kep (2 lan khop nhau)", [a.sheet]) + DDL_CORR
    sql += "IF OBJECT_ID('tempdb..#g') IS NOT NULL DROP TABLE #g;\nCREATE TABLE #g (hid INT NOT NULL, lp INT NOT NULL, tt VARCHAR(20) NOT NULL, han NVARCHAR(1000) NOT NULL);\n"
    for ch in chunks(good, 100):
        sql += "INSERT INTO #g (hid, lp, tt, han) VALUES\n" + ",\n".join(f"({k[0]}, {lpn(k[1])}, '{k[2]}', {sq(h)})" for k, h in ch) + ";\n"
    jn = ("FROM classic_texts c JOIN #g g ON c.hexagram_id = g.hid AND ISNULL(c.line_position, -1) = g.lp "
          "AND c.text_type = g.tt AND c.text_han IS NULL")
    sql += f"""SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRAN;
DECLARE @n INT;
INSERT INTO data_corrections (batch_label, change_type, table_name, hexagram_id, line_position, text_type, column_name, old_value, new_value, reason)
SELECT 'GAPS', 'UPDATE', 'classic_texts', c.hexagram_id, c.line_position, c.text_type, 'text_han', NULL, g.han,
       N'Dien chu Han tu anh trang PDF bang nhap kep (hai lan doc lap khop nhau)'
{jn};
SET @n = @@ROWCOUNT; IF @n <> {n} THROW 50041, N'GAPS: so dong text_han NULL khop khoa khac ky vong', 1;
UPDATE c SET c.text_han = g.han
{jn};
SET @n = @@ROWCOUNT; IF @n <> {n} THROW 50042, N'GAPS: so dong cap nhat khac ky vong', 1;
COMMIT;
PRINT N'GAPS: xong, {n} dong.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
GO
"""
    write_sql(a.out, sql)
    add_overlay(a.overlay, [(k[0], k[1], k[2], "text_han", h) for k, h in good])
    if problems:
        sys.exit(2)


# ----------------------------------------------------------------------------- pages-csv
def scan_headings(page_texts, first, last):
    pat = re.compile(r"^\s*(\d{1,2})\s*\.\s*((?:[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]\s*)+)(.*)$")
    found = {}
    for pageno, text in enumerate(page_texts, start=1):
        for line in (text or "").splitlines():
            m = pat.match(line)
            if not m:
                continue
            n = int(m.group(1))
            if first <= n <= last and n not in found:
                found[n] = (pageno, re.sub(r"\s+", "", m.group(2)), m.group(3).strip())
    return found


def cmd_pages_csv(a):
    if os.path.exists(a.out):
        die(f"{a.out} da ton tai; khong ghi de.")
    sys.path.insert(0, HERE)
    import build_64_que as B
    names = {r[0]: (r[1], r[2]) for r in B.H}
    from pypdf import PdfReader
    reader = PdfReader(a.pdf)
    texts = [pg.extract_text() or "" for pg in reader.pages]
    found = scan_headings(texts, a.first, a.last)
    out, problems, prev = [], [], 0
    for n in range(a.first, a.last + 1):
        db_han, db_vn = names[n]
        if n not in found:
            problems.append(f"que {n}: khong tim thay tieu de")
            out.append([n, "", db_han, "N", "", db_vn, "N", ""])
            continue
        page, han, vn = found[n]
        match = han == db_han
        if not match:
            problems.append(f"que {n}: ten Han trong PDF '{han}' khac bang chuan '{db_han}'")
        if page < prev:
            problems.append(f"que {n}: trang {page} nho hon trang que truoc ({prev}); co the lay nham muc luc")
        prev = max(prev, page)
        out.append([n, han, db_han, "Y" if match else "N", vn, db_vn, "Y", page])
    out.append([a.last + 1, "", "", "", "", "", "", len(texts) + 1])
    with open(a.out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["hexagram_id", "source_han", "db_name_han", "han_match", "source_vn_heading", "db_name_vn", "found_in_pdf", "page"])
        w.writerows(out)
    print(f"PDF {len(texts)} trang; tim thay {len(found)}/{a.last - a.first + 1} tieu de; da tao {a.out} (them dong chot que {a.last + 1}, trang {len(texts) + 1})")
    for p in problems:
        print("  VAN DE:", p)
    sys.exit(1 if problems else 0)


# ----------------------------------------------------------------------------- main
def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    k = sub.add_parser("known")
    k.add_argument("--final-b02", required=True)
    k.add_argument("--final-b03", required=True)
    k.add_argument("--out", required=True)
    k.add_argument("--overlay")
    k.set_defaults(fn=cmd_known)
    n = sub.add_parser("normalize-vn")
    n.add_argument("--old", nargs="+", required=True)
    n.add_argument("--new", required=True)
    n.add_argument("--out", required=True)
    n.add_argument("--overlay")
    n.add_argument("--expect", type=int, default=28)
    n.set_defaults(fn=cmd_normalize)
    s = sub.add_parser("source-ref")
    s.add_argument("--json", nargs="+", required=True)
    s.add_argument("--out", required=True)
    s.set_defaults(fn=cmd_source_ref)
    gs = sub.add_parser("gaps-sheet")
    gs.add_argument("--json", nargs="+", required=True)
    gs.add_argument("--out", required=True)
    gs.set_defaults(fn=cmd_gaps_sheet)
    gq = sub.add_parser("gaps-sql")
    gq.add_argument("--sheet", required=True)
    gq.add_argument("--out", required=True)
    gq.add_argument("--overlay")
    gq.set_defaults(fn=cmd_gaps_sql)
    pc = sub.add_parser("pages-csv")
    pc.add_argument("--pdf", required=True)
    pc.add_argument("--first", type=int, required=True)
    pc.add_argument("--last", type=int, required=True)
    pc.add_argument("--out", required=True)
    pc.set_defaults(fn=cmd_pages_csv)
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()

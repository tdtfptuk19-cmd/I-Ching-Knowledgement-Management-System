#!/usr/bin/env python3
"""
Kiem tra DOC LAP file JSON do AI xuat, roi sinh file T-SQL de nap vao SQL Server.

Cach chay:
    python load_json_to_sql.py _out/lan1_que-01-02.json
    python load_json_to_sql.py _out/lan1_que-01-02.json --strip-han-punct
Co --strip-han-punct: bo dau cau va khoang trang trong text_han (chu Han co dien khong co dau cau),
ghi so dong da doi. Khong bao gio tu sua chu Han.
Co --texts-only: chi nap classic_texts (dung khi 8 que don, 64 que kep, 386 hao da nap tu kinhdich_64_que.sql).
Van kiem tra day du JSON, nhung khong sinh INSERT cho trigrams/hexagrams/hexagram_lines.
Khi dung --texts-only, JSON CHI CAN co bang classic_texts: cau truc que/hao duoc lay tu build_64_que.py
(cung thu muc), la nguon su that da nap vao DB. Neu JSON co them cac bang cau truc thi bi bo qua.
Co --skip-van-ngon: bo cac dong VAN_NGON (chua kiem chung duoc) khoi file SQL, dong thoi in so dong bi bo.
Ket qua: neu khong co LOI, tao file _out/lan1_que-01-02_load.sql (UTF-8 co BOM).
Chi dung thu vien chuan cua Python.
"""
import csv
import json
import os
import re
import sys
import unicodedata

COLS = {
    "trigrams": ["trigram_id", "name_vn", "name_han", "binary_code", "five_element",
                 "nature_symbol", "family_member", "early_heaven_num",
                 "later_heaven_num", "cardinal_direction"],
    "hexagrams": ["hexagram_id", "binary_code", "name_vn", "name_han",
                  "palace_id", "palace_position"],
    "hexagram_lines": ["hexagram_id", "position", "yin_yang", "is_special"],
    "classic_texts": ["hexagram_id", "line_position", "text_type", "text_han",
                      "text_vn", "source_id", "review_status", "confidence",
                      "source_ref", "issues"],
}
ORDER = ["trigrams", "hexagrams", "hexagram_lines", "classic_texts"]

# Bang Bat Quai chuan cua nhom: binary -> (so Tien Thien, ngu hanh, so Hau Thien)
TRIGRAM_REF = {
    "111": (1, "KIM", 6), "011": (2, "KIM", 7), "101": (3, "HOA", 9),
    "001": (4, "MOC", 3), "110": (5, "MOC", 4), "010": (6, "THUY", 1),
    "100": (7, "THO", 8), "000": (8, "THO", 2),
}
TEXT_TYPES = {"THOAN_TU", "THOAN_TRUYEN", "DAI_TUONG", "HAO_TU", "TIEU_TUONG", "VAN_NGON"}
HAN = re.compile("[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\U00020000-\U0002a6df]")
ALLOWED_PUNCT = set("，。、；：？！「」『』《》（）")


def q(v):
    """Chuyen gia tri Python thanh literal T-SQL."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return str(v)
    return "N'" + str(v).replace("'", "''") + "'"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strip_punct = "--strip-han-punct" in sys.argv
    skip_vn = "--skip-van-ngon" in sys.argv
    texts_only = "--texts-only" in sys.argv
    if not args:
        print(__doc__)
        sys.exit(2)
    path = args[0]
    out = os.path.splitext(path)[0] + "_load.sql"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    skipped_vn = 0
    if skip_vn and isinstance(data.get("classic_texts"), list):
        before = len(data["classic_texts"])
        data["classic_texts"] = [r for r in data["classic_texts"] if r.get("text_type") != "VAN_NGON"]
        skipped_vn = before - len(data["classic_texts"])

    structure_from_build = False
    if texts_only:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        try:
            import build_64_que as B
        except ImportError:
            B = None
            print("CANH BAO: khong import duoc build_64_que.py (can o cung thu muc); dung cau truc co trong JSON.")
        if B is not None:
            codes_b = {r[0]: B.code_of(r) for r in B.H}
            data["trigrams"] = [{"trigram_id": t[0], "binary_code": t[3], "five_element": t[4],
                                 "early_heaven_num": t[0], "later_heaven_num": t[7], "name_han": None}
                                for t in B.TRIGRAMS]
            data["hexagrams"] = [{"hexagram_id": n, "binary_code": c} for n, c in codes_b.items()]
            data["hexagram_lines"] = []
            for n, c in codes_b.items():
                for k in range(1, 7):
                    data["hexagram_lines"].append({"hexagram_id": n, "position": k,
                                                   "yin_yang": int(c[6 - k]), "is_special": False})
                if n in (1, 2):
                    data["hexagram_lines"].append({"hexagram_id": n, "position": 7,
                                                   "yin_yang": None, "is_special": True})
            structure_from_build = True

    errors, warnings = [], []

    for t in ORDER:
        if t not in data or not isinstance(data[t], list):
            errors.append(f"Thieu bang '{t}' trong JSON")
    if errors:
        for e in errors:
            print("LOI:", e)
        sys.exit(1)

    # ---- trigrams ----
    tri = {}
    for r in data["trigrams"]:
        code = r.get("binary_code")
        ref = TRIGRAM_REF.get(code)
        if ref is None:
            errors.append(f"trigrams: binary_code la '{code}'")
            continue
        tri[code] = r
        if r.get("early_heaven_num") != ref[0]:
            errors.append(f"trigrams {code}: early_heaven_num={r.get('early_heaven_num')}, chuan={ref[0]}")
        if r.get("five_element") != ref[1]:
            errors.append(f"trigrams {code}: five_element={r.get('five_element')}, chuan={ref[1]}")
        if r.get("later_heaven_num") != ref[2]:
            errors.append(f"trigrams {code}: later_heaven_num={r.get('later_heaven_num')}, chuan={ref[2]}")
        if r.get("name_han"):
            warnings.append(f"trigrams {code}: name_han='{r['name_han']}' (kiem tra nguon, bang chuan khong co cot nay)")
    if set(tri) != set(TRIGRAM_REF):
        errors.append("trigrams: khong du 8 ma bit khac nhau")

    # ---- hexagrams ----
    hexes = {}
    for r in data["hexagrams"]:
        hid, code = r.get("hexagram_id"), r.get("binary_code", "")
        hexes[hid] = r
        if not re.fullmatch(r"[01]{6}", str(code)):
            errors.append(f"hexagrams {hid}: binary_code khong hop le '{code}'")
            continue
        if code[:3] not in tri or code[3:] not in tri:
            errors.append(f"hexagrams {hid}: Thuong/Ha '{code[:3]}/{code[3:]}' khong khop que don nao")
    if len({r.get("binary_code") for r in data["hexagrams"]}) != len(data["hexagrams"]):
        errors.append("hexagrams: co binary_code trung nhau")

    # ---- hexagram_lines ----
    lines = {}
    for r in data["hexagram_lines"]:
        hid, pos = r.get("hexagram_id"), r.get("position")
        key = (hid, pos)
        if key in lines:
            errors.append(f"hexagram_lines: trung {key}")
        lines[key] = r
        if hid not in hexes:
            errors.append(f"hexagram_lines {key}: que khong co trong hexagrams")
            continue
        code = hexes[hid]["binary_code"]
        if isinstance(pos, int) and 1 <= pos <= 6:
            expect = int(code[6 - pos])  # hao k nam o ky tu thu (7-k) tu trai
            if r.get("is_special") is not False:
                errors.append(f"hexagram_lines {key}: hao thuong phai is_special=false")
            if r.get("yin_yang") != expect:
                errors.append(f"hexagram_lines {key}: yin_yang={r.get('yin_yang')}, theo ma bit phai la {expect}")
        elif pos == 7:
            if hid not in (1, 2):
                errors.append(f"hexagram_lines {key}: position 7 chi danh cho que 1 va 2")
            if r.get("is_special") is not True or r.get("yin_yang") is not None:
                errors.append(f"hexagram_lines {key}: hao dac biet phai is_special=true, yin_yang=null")
        else:
            errors.append(f"hexagram_lines {key}: position khong hop le")
    for hid in hexes:
        n = sum(1 for (h, p) in lines if h == hid and 1 <= p <= 6)
        if n != 6:
            errors.append(f"que {hid}: co {n} hao thuong (can 6)")

    # ---- classic_texts ----
    seen = set()
    null_han = 0
    normalized = 0
    sources = set()
    for i, r in enumerate(data["classic_texts"]):
        hid, lp, tt = r.get("hexagram_id"), r.get("line_position"), r.get("text_type")
        sources.add(r.get("source_id"))
        k = (hid, lp, tt, r.get("source_id"))
        tag = f"classic_texts[{i}] {k}"
        if k in seen:
            errors.append(f"{tag}: trung khoa")
        seen.add(k)
        if tt not in TEXT_TYPES:
            errors.append(f"{tag}: text_type la '{tt}'")
        if hid not in hexes:
            errors.append(f"{tag}: que khong ton tai")
        if lp is not None and (hid, lp) not in lines:
            errors.append(f"{tag}: khong co hao tuong ung trong hexagram_lines")
        if tt in ("HAO_TU", "TIEU_TUONG") and lp is None:
            errors.append(f"{tag}: {tt} bat buoc co line_position")
        if tt in ("THOAN_TU", "THOAN_TRUYEN", "DAI_TUONG") and lp is not None:
            errors.append(f"{tag}: {tt} phai co line_position = null")
        han, vn = r.get("text_han"), r.get("text_vn")
        if strip_punct and han:
            new = "".join(c for c in han if unicodedata.category(c)[0] not in "PZC")
            if new != han:
                normalized += 1
                r["text_han"] = han = new
        if han is None and vn is None:
            errors.append(f"{tag}: ca text_han va text_vn deu null")
        if han is None:
            null_han += 1
        else:
            if re.search(r"\s", han):
                errors.append(f"{tag}: text_han con khoang trang")
            bad = sorted({c for c in han if not HAN.match(c) and c not in ALLOWED_PUNCT})
            if bad:
                shown = " ".join(f"{c}(U+{ord(c):04X})" for c in bad[:8])
                errors.append(f"{tag}: text_han co ky tu khong phai chu Han: {shown}")
        if vn is not None and not vn.strip():
            errors.append(f"{tag}: text_vn rong")

        # Doc _meta va ghi vao cot moi, khong tu dien verified_by
        meta = r.get("_meta") or {}
        r["confidence"] = meta.get("confidence")
        r["source_ref"] = meta.get("source_ref")
        raw_issues = meta.get("issues")
        if isinstance(raw_issues, list):
            r["issues"] = "; ".join(raw_issues) if raw_issues else None
        else:
            r["issues"] = raw_issues
        r["review_status"] = r.get("review_status", "PENDING")
        r["verified_by"] = None
        r["verified_at"] = None

    # ---- kiem tra gaps_all.csv ----
    gaps_file = None
    candidates = [
        os.path.join(os.path.dirname(path), "gaps_all.csv"),
        os.path.join(os.path.dirname(path), "..", "_out", "gaps_all.csv"),
        os.path.join(os.path.dirname(path), "..", "gaps_all.csv"),
        "_out/gaps_all.csv",
        "gaps_all.csv"
    ]
    for c in candidates:
        if os.path.isfile(c):
            gaps_file = os.path.abspath(c)
            break

    if gaps_file:
        expected_nulls = set()
        with open(gaps_file, encoding="utf-8-sig") as gf:
            reader = csv.reader(gf)
            try:
                hdr = next(reader)
            except StopIteration:
                hdr = []
            for row in reader:
                if not row or len(row) < 4:
                    continue
                try:
                    g_hid = int(row[1])
                except ValueError:
                    continue
                g_lp = int(row[2]) if row[2].strip().isdigit() else None
                g_tt = row[3].strip()
                expected_nulls.add((g_hid, g_lp, g_tt))

        present_hids = set(r.get("hexagram_id") for r in data["classic_texts"])
        actual_nulls = {
            (r.get("hexagram_id"), r.get("line_position"), r.get("text_type"))
            for r in data["classic_texts"]
            if r.get("text_han") is None
        }
        expected_for_present = {k for k in expected_nulls if k[0] in present_hids}
        if actual_nulls != expected_for_present:
            unexp = actual_nulls - expected_for_present
            missed = expected_for_present - actual_nulls
            diff_msg = []
            if unexp:
                diff_msg.append(f"NULL khong co trong gaps_all.csv: {unexp}")
            if missed:
                diff_msg.append(f"gaps_all.csv co NULL nhung JSON khong NULL: {missed}")
            errors.append(f"So dong/vi tri NULL text_han lech so voi gaps_all.csv: {'; '.join(diff_msg)}")
    else:
        warnings.append("Khong tim thay gaps_all.csv de doi chieu so dong NULL")

    # ---- day du: canh bao dong bi thieu (khong chan nap) ----
    present = {}
    for r in data["classic_texts"]:
        present.setdefault(r.get("hexagram_id"), set()).add((r.get("text_type"), r.get("line_position")))
    for hid in sorted(k for k in present if k in hexes):
        need = [("THOAN_TU", None), ("THOAN_TRUYEN", None), ("DAI_TUONG", None)]
        for p_ in sorted(p_ for (h_, p_) in lines if h_ == hid):
            need += [("HAO_TU", p_), ("TIEU_TUONG", p_)]
        miss = [n for n in need if n not in present[hid]]
        if miss:
            warnings.append(f"que {hid}: THIEU " + ", ".join(f"{t}/{p_}" for t, p_ in miss))

    # ---- bao cao ----
    print("=== SO LUONG ===")
    if structure_from_build:
        print("  (cau truc que/hao lay tu build_64_que.py; chi classic_texts duoc doc tu JSON)")
    if skipped_vn:
        print(f"  (da bo qua {skipped_vn} dong VAN_NGON theo --skip-van-ngon)")
    for t in ORDER:
        print(f"  {t}: {len(data[t])}")
    print(f"  classic_texts co text_han = null: {null_han}")
    if strip_punct:
        print(f"  text_han da bo dau cau/khoang trang: {normalized} dong")
    print(f"  source_id xuat hien: {sorted(sources, key=str)}  (phai ton tai trong bang sources)")
    for w in warnings:
        print("CANH BAO:", w)
    if errors:
        print(f"\n=== {len(errors)} LOI (khong tao file SQL) ===")
        for e in errors:
            print("LOI:", e)
        sys.exit(1)

    # ---- sinh T-SQL ----
    sql = ["USE KinhDich_KB;", "GO", "SET XACT_ABORT ON;", "BEGIN TRY", "BEGIN TRAN;"]
    for t in ORDER:
        if texts_only and t != "classic_texts":
            continue
        cols = COLS[t]
        for r in data[t]:
            vals = ", ".join(q(r.get(c)) for c in cols)
            sql.append(f"INSERT INTO {t} ({', '.join(cols)}) VALUES ({vals});")
    sql += ["COMMIT;", "PRINT N'Nap thanh cong.';", "END TRY", "BEGIN CATCH",
            "IF @@TRANCOUNT > 0 ROLLBACK;", "THROW;", "END CATCH;"]
    with open(out, "w", encoding="utf-8-sig") as f:  # co BOM de SSMS doc dung Unicode
        f.write("\n".join(sql) + "\n")
    if texts_only:
        print("(--texts-only: file SQL chi chua classic_texts)")
    print(f"\nKhong co loi. Da tao: {out}")
    print("Mo file nay trong SSMS va Execute mot lan.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh file kinhdich_64_que.sql (8 que don + 64 que kep + 386 muc hao) va TU KIEM TRA ma bit.

Chay:  python build_64_que.py            -> in ket qua kiem tra, tao kinhdich_64_que.sql
Quy uoc ma bit (khop schema): ky tu TRAI = hao tren cung; ma que kep = ma que Thuong + ma que Ha.
Du lieu ten que la tri thuc chung cua nhom, can doi chieu voi muc luc cua sach nguon.
"""
import os
import sys

# (trigram_id = so Tien Thien, ten, ten Han, ma bit, ngu hanh, tuong, thanh vien gia dinh, so Hau Thien, phuong vi Hau Thien)
TRIGRAMS = [
    (1, "Càn",  "乾", "111", "KIM",  "Trời", "Cha",        6, "Tây Bắc"),
    (2, "Đoài", "兌", "011", "KIM",  "Đầm",  "Thiếu nữ",   7, "Tây"),
    (3, "Ly",   "離", "101", "HOA",  "Lửa",  "Trung nữ",   9, "Nam"),
    (4, "Chấn", "震", "001", "MOC",  "Sấm",  "Trưởng nam", 3, "Đông"),
    (5, "Tốn",  "巽", "110", "MOC",  "Gió",  "Trưởng nữ",  4, "Đông Nam"),
    (6, "Khảm", "坎", "010", "THUY", "Nước", "Trung nam",  1, "Bắc"),
    (7, "Cấn",  "艮", "100", "THO",  "Núi",  "Thiếu nam",  8, "Đông Bắc"),
    (8, "Khôn", "坤", "000", "THO",  "Đất",  "Mẹ",         2, "Tây Nam"),
]
CODE = {t[1]: t[3] for t in TRIGRAMS}
NATURE_VN = {"Càn": "Thiên", "Đoài": "Trạch", "Ly": "Hỏa", "Chấn": "Lôi",
             "Tốn": "Phong", "Khảm": "Thủy", "Cấn": "Sơn", "Khôn": "Địa"}
NATURE_HAN = {"Càn": "天", "Đoài": "澤", "Ly": "火", "Chấn": "雷",
              "Tốn": "風", "Khảm": "水", "Cấn": "山", "Khôn": "地"}
HAN_TRI = {t[1]: t[2] for t in TRIGRAMS}

# (so thu tu Van Vuong, ten Han, ten Viet, que Thuong, que Ha)
H = [
    (1, "乾為天", "Thuần Càn", "Càn", "Càn"),
    (2, "坤為地", "Thuần Khôn", "Khôn", "Khôn"),
    (3, "水雷屯", "Thủy Lôi Truân", "Khảm", "Chấn"),
    (4, "山水蒙", "Sơn Thủy Mông", "Cấn", "Khảm"),
    (5, "水天需", "Thủy Thiên Nhu", "Khảm", "Càn"),
    (6, "天水訟", "Thiên Thủy Tụng", "Càn", "Khảm"),
    (7, "地水師", "Địa Thủy Sư", "Khôn", "Khảm"),
    (8, "水地比", "Thủy Địa Tỷ", "Khảm", "Khôn"),
    (9, "風天小畜", "Phong Thiên Tiểu Súc", "Tốn", "Càn"),
    (10, "天澤履", "Thiên Trạch Lý", "Càn", "Đoài"),
    (11, "地天泰", "Địa Thiên Thái", "Khôn", "Càn"),
    (12, "天地否", "Thiên Địa Bĩ", "Càn", "Khôn"),
    (13, "天火同人", "Thiên Hỏa Đồng Nhân", "Càn", "Ly"),
    (14, "火天大有", "Hỏa Thiên Đại Hữu", "Ly", "Càn"),
    (15, "地山謙", "Địa Sơn Khiêm", "Khôn", "Cấn"),
    (16, "雷地豫", "Lôi Địa Dự", "Chấn", "Khôn"),
    (17, "澤雷隨", "Trạch Lôi Tùy", "Đoài", "Chấn"),
    (18, "山風蠱", "Sơn Phong Cổ", "Cấn", "Tốn"),
    (19, "地澤臨", "Địa Trạch Lâm", "Khôn", "Đoài"),
    (20, "風地觀", "Phong Địa Quán", "Tốn", "Khôn"),
    (21, "火雷噬嗑", "Hỏa Lôi Phệ Hạp", "Ly", "Chấn"),
    (22, "山火賁", "Sơn Hỏa Bí", "Cấn", "Ly"),
    (23, "山地剝", "Sơn Địa Bác", "Cấn", "Khôn"),
    (24, "地雷復", "Địa Lôi Phục", "Khôn", "Chấn"),
    (25, "天雷無妄", "Thiên Lôi Vô Vọng", "Càn", "Chấn"),
    (26, "山天大畜", "Sơn Thiên Đại Súc", "Cấn", "Càn"),
    (27, "山雷頤", "Sơn Lôi Di", "Cấn", "Chấn"),
    (28, "澤風大過", "Trạch Phong Đại Quá", "Đoài", "Tốn"),
    (29, "坎為水", "Thuần Khảm", "Khảm", "Khảm"),
    (30, "離為火", "Thuần Ly", "Ly", "Ly"),
    (31, "澤山咸", "Trạch Sơn Hàm", "Đoài", "Cấn"),
    (32, "雷風恆", "Lôi Phong Hằng", "Chấn", "Tốn"),
    (33, "天山遯", "Thiên Sơn Độn", "Càn", "Cấn"),
    (34, "雷天大壯", "Lôi Thiên Đại Tráng", "Chấn", "Càn"),
    (35, "火地晉", "Hỏa Địa Tấn", "Ly", "Khôn"),
    (36, "地火明夷", "Địa Hỏa Minh Di", "Khôn", "Ly"),
    (37, "風火家人", "Phong Hỏa Gia Nhân", "Tốn", "Ly"),
    (38, "火澤睽", "Hỏa Trạch Khuê", "Ly", "Đoài"),
    (39, "水山蹇", "Thủy Sơn Kiển", "Khảm", "Cấn"),
    (40, "雷水解", "Lôi Thủy Giải", "Chấn", "Khảm"),
    (41, "山澤損", "Sơn Trạch Tổn", "Cấn", "Đoài"),
    (42, "風雷益", "Phong Lôi Ích", "Tốn", "Chấn"),
    (43, "澤天夬", "Trạch Thiên Quải", "Đoài", "Càn"),
    (44, "天風姤", "Thiên Phong Cấu", "Càn", "Tốn"),
    (45, "澤地萃", "Trạch Địa Tụy", "Đoài", "Khôn"),
    (46, "地風升", "Địa Phong Thăng", "Khôn", "Tốn"),
    (47, "澤水困", "Trạch Thủy Khốn", "Đoài", "Khảm"),
    (48, "水風井", "Thủy Phong Tỉnh", "Khảm", "Tốn"),
    (49, "澤火革", "Trạch Hỏa Cách", "Đoài", "Ly"),
    (50, "火風鼎", "Hỏa Phong Đỉnh", "Ly", "Tốn"),
    (51, "震為雷", "Thuần Chấn", "Chấn", "Chấn"),
    (52, "艮為山", "Thuần Cấn", "Cấn", "Cấn"),
    (53, "風山漸", "Phong Sơn Tiệm", "Tốn", "Cấn"),
    (54, "雷澤歸妹", "Lôi Trạch Quy Muội", "Chấn", "Đoài"),
    (55, "雷火豐", "Lôi Hỏa Phong", "Chấn", "Ly"),
    (56, "火山旅", "Hỏa Sơn Lữ", "Ly", "Cấn"),
    (57, "巽為風", "Thuần Tốn", "Tốn", "Tốn"),
    (58, "兌為澤", "Thuần Đoài", "Đoài", "Đoài"),
    (59, "風水渙", "Phong Thủy Hoán", "Tốn", "Khảm"),
    (60, "水澤節", "Thủy Trạch Tiết", "Khảm", "Đoài"),
    (61, "風澤中孚", "Phong Trạch Trung Phu", "Tốn", "Đoài"),
    (62, "雷山小過", "Lôi Sơn Tiểu Quá", "Chấn", "Cấn"),
    (63, "水火既濟", "Thủy Hỏa Ký Tế", "Khảm", "Ly"),
    (64, "火水未濟", "Hỏa Thủy Vị Tế", "Ly", "Khảm"),
]

# Ten Viet/Han goi theo sach nguon (de cot name_source); lay tu lan1_que-01-02.json
NAME_SOURCE = {1: "Kiền Vi Thiên", 2: "Khôn Vi Địa"}

ANCHORS = {1: "111111", 2: "000000", 3: "010001", 11: "000111", 12: "111000",
           16: "001000", 17: "011001", 27: "100001", 58: "011011",
           60: "010011", 63: "010101", 64: "101010"}


def code_of(row):
    return CODE[row[3]] + CODE[row[4]]


def run_checks():
    errors = []
    codes = {r[0]: code_of(r) for r in H}

    if [r[0] for r in H] != list(range(1, 65)):
        errors.append("so thu tu khong phai 1..64 lien tuc")
    if len(set(codes.values())) != 64:
        errors.append("co ma bit trung nhau")
    if len({(r[3], r[4]) for r in H}) != 64:
        errors.append("khong du 64 to hop (Thuong, Ha) khac nhau")

    for n, expect in ANCHORS.items():
        if codes[n] != expect:
            errors.append(f"que {n}: ma {codes[n]} khac ma moc {expect}")

    # Quy tac cap Van Vuong: que le/chan lien ke la DAO (dao thu tu cac hao);
    # voi que doi xung (dao = chinh no) thi la DOI (lat toan bo am duong).
    flip = str.maketrans("01", "10")
    for n in range(1, 64, 2):
        a, b = codes[n], codes[n + 1]
        expect = a.translate(flip) if a[::-1] == a else a[::-1]
        if b != expect:
            errors.append(f"cap {n}/{n+1}: {a} -> {b}, ky vong {expect}")

    # Ten Viet / Han phai khop que Thuong, que Ha
    for n, han, vn, up, lo in H:
        if up == lo:
            if vn != f"Thuần {up}":
                errors.append(f"que {n}: ten Viet '{vn}' khong khop que thuan {up}")
            if han != f"{HAN_TRI[up]}為{NATURE_HAN[up]}":
                errors.append(f"que {n}: ten Han '{han}' khong khop que thuan {up}")
        else:
            if not vn.startswith(f"{NATURE_VN[up]} {NATURE_VN[lo]} "):
                errors.append(f"que {n}: ten Viet '{vn}' khong bat dau bang '{NATURE_VN[up]} {NATURE_VN[lo]}'")
            if not han.startswith(NATURE_HAN[up] + NATURE_HAN[lo]):
                errors.append(f"que {n}: ten Han '{han}' khong bat dau bang '{NATURE_HAN[up]}{NATURE_HAN[lo]}'")

    # Bat Quai
    if len({t[3] for t in TRIGRAMS}) != 8 or len({t[0] for t in TRIGRAMS}) != 8:
        errors.append("bat quai: ma bit hoac so Tien Thien khong duy nhat")
    return codes, errors


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, int):
        return str(v)
    return "N'" + str(v).replace("'", "''") + "'"


def build_sql(codes):
    out = []
    w = out.append
    w("/* Nap 8 que don + 64 que kep + 386 muc hao. Sinh boi build_64_que.py. */")
    w("USE KinhDich_KB;")
    w("GO")
    w("-- Cot ten que theo sach nguon (neu schema cu chua co)")
    w("IF COL_LENGTH('hexagrams','name_source') IS NULL")
    w("    ALTER TABLE hexagrams ADD name_source NVARCHAR(100) NULL;")
    w("GO")
    w("SET XACT_ABORT ON;")
    w("BEGIN TRY")
    w("BEGIN TRAN;")
    w("IF EXISTS (SELECT 1 FROM hexagram_lines) OR EXISTS (SELECT 1 FROM hexagrams) OR EXISTS (SELECT 1 FROM trigrams)")
    w("    THROW 50001, N'trigrams/hexagrams/hexagram_lines da co du lieu. Xoa truoc khi nap lai (hoac chua nap file lan1 truoc).', 1;")
    w("")
    w("-- name_han, cardinal_direction: tri thuc chung cua nhom, can doi chieu nguon")
    w("INSERT INTO trigrams (trigram_id, name_vn, name_han, binary_code, five_element, nature_symbol, family_member, early_heaven_num, later_heaven_num, cardinal_direction) VALUES")
    rows = [f"({t[0]}, {q(t[1])}, {q(t[2])}, '{t[3]}', '{t[4]}', {q(t[5])}, {q(t[6])}, {t[0]}, {t[7]}, {q(t[8])})" for t in TRIGRAMS]
    w(",\n".join(rows) + ";")
    w("")
    w("INSERT INTO hexagrams (hexagram_id, binary_code, name_vn, name_han) VALUES")
    rows = [f"({r[0]}, '{codes[r[0]]}', {q(r[2])}, {q(r[1])})" for r in H]
    w(",\n".join(rows) + ";")
    w("")
    w("INSERT INTO hexagram_lines (hexagram_id, position, yin_yang, is_special) VALUES")
    rows = []
    for r in H:
        c = codes[r[0]]
        for k in range(1, 7):
            rows.append(f"({r[0]}, {k}, {c[6 - k]}, 0)")
        if r[0] in (1, 2):
            rows.append(f"({r[0]}, 7, NULL, 1)")
    w(",\n".join(rows) + ";")
    w("")
    for n, nm in NAME_SOURCE.items():
        w(f"UPDATE hexagrams SET name_source = {q(nm)} WHERE hexagram_id = {n};")
    w("")
    w("COMMIT;")
    w("PRINT N'Nap 64 que thanh cong.';")
    w("END TRY")
    w("BEGIN CATCH")
    w("    IF @@TRANCOUNT > 0 ROLLBACK;")
    w("    THROW;")
    w("END CATCH;")
    w("GO")
    w("")
    w("/* ===== KIEM TRA SAU KHI NAP (chay tung cau) ===== */")
    w("-- 1) Dem: 8 / 64 / 386")
    w("SELECT (SELECT COUNT(*) FROM trigrams) AS trigrams, (SELECT COUNT(*) FROM hexagrams) AS hexagrams, (SELECT COUNT(*) FROM hexagram_lines) AS lines_total;")
    w("-- 2) 64 ma bit khac nhau va 64 to hop Thuong/Ha khac nhau (ky vong 64, 64)")
    w("SELECT COUNT(DISTINCT binary_code) AS n_code, COUNT(DISTINCT upper_code + lower_code) AS n_combo FROM hexagrams;")
    w("-- 3) Que nao khong ghep duoc voi que don (ky vong 0 dong)")
    w("SELECT h.hexagram_id, h.name_vn FROM hexagrams h LEFT JOIN v_hexagram_trigrams v ON v.hexagram_id = h.hexagram_id WHERE v.hexagram_id IS NULL;")
    w("-- 4) Quy tac cap Van Vuong: que le/chan lien ke la dao thu tu cac hao, que doi xung thi lat am duong (ky vong 0 dong)")
    w("SELECT a.hexagram_id AS que_le, a.binary_code, b.binary_code AS que_chan")
    w("FROM hexagrams a JOIN hexagrams b ON b.hexagram_id = a.hexagram_id + 1")
    w("WHERE a.hexagram_id % 2 = 1")
    w("  AND b.binary_code <> CASE WHEN REVERSE(a.binary_code) = a.binary_code")
    w("                            THEN TRANSLATE(a.binary_code, '01', '10') ELSE REVERSE(a.binary_code) END;")
    w("-- 5) yin_yang cua hao khop ma bit (ky vong 0 dong)")
    w("SELECT l.hexagram_id, l.position FROM hexagram_lines l JOIN hexagrams h ON h.hexagram_id = l.hexagram_id")
    w("WHERE l.position <= 6 AND l.yin_yang <> CAST(SUBSTRING(h.binary_code, 7 - l.position, 1) AS INT);")
    w("-- 6) Cac que moc")
    w("SELECT hexagram_id, binary_code, name_vn FROM hexagrams WHERE hexagram_id IN (1, 2, 11, 12, 17, 60, 63, 64) ORDER BY hexagram_id;")
    w("-- (moc: 1=111111, 2=000000, 11=000111, 12=111000, 17=011001, 60=010011, 63=010101, 64=101010)")
    return "\n".join(out) + "\n"


def main():
    codes, errors = run_checks()
    print("=== KIEM TRA TU DONG ===")
    print(f"  que: {len(H)}, ma bit khac nhau: {len(set(codes.values()))}")
    print(f"  to hop (Thuong, Ha) khac nhau: {len({(r[3], r[4]) for r in H})}")
    print(f"  que moc da kiem: {sorted(ANCHORS)}")
    if errors:
        print(f"\n{len(errors)} LOI:")
        for e in errors:
            print("  LOI:", e)
        sys.exit(1)
    print("  quy tac cap Van Vuong (32 cap): DAT")
    print("  ten Viet/Han khop que Thuong/Ha: DAT")
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kinhdich_64_que.sql")
    with open(out, "w", encoding="utf-8-sig") as f:
        f.write(build_sql(codes))
    print(f"\nDa tao: {out}")


if __name__ == "__main__":
    main()

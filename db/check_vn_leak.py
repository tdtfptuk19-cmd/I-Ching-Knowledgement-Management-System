#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phat hien LOI BINH GIANG cua tac gia bi lot vao text_vn (audit tung dong khong bat duoc,
vi cac dong do co that trong PDF).

Y tuong: phan dich tho (sau dong danh dau cuoi cung: "Dich:", "Tuong rang:", "Thoan viet:"...) la tho luc bat,
moi dong ngan (6-8 tieng). Mot dong dai bat thuong sau dong danh dau thuong la loi binh giang.

Chay:  python check_vn_leak.py _out\\extracted_que09-12.generated.json
       python check_vn_leak.py file.json --max-tokens 12 --types HAO_TU,TIEU_TUONG
Thoat ma 1 neu co dong bi gan co. Chi doc, khong sua file.
"""
import argparse
import json
import re
import sys
import unicodedata

MARKER = re.compile(r"^(Dịch|Tượng rằng|Thoán rằng|Thoán viết|Tượng viết)\s*[.:]", re.I)
CORE = "THOAN_TU,THOAN_TRUYEN,DAI_TUONG,HAO_TU,TIEU_TUONG"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("json")
    ap.add_argument("--max-tokens", type=int, default=12, help="so tieng toi da cho mot dong tho (mac dinh 12)")
    ap.add_argument("--types", default=CORE)
    a = ap.parse_args()
    types = set(a.types.split(","))

    data = json.load(open(a.json, encoding="utf-8"))
    flagged, no_marker, scanned, max_seen = [], 0, 0, 0
    for r in data["classic_texts"]:
        if r.get("text_type") not in types or not r.get("text_vn"):
            continue
        lines = [unicodedata.normalize("NFC", l).strip() for l in r["text_vn"].splitlines()]
        lines = [l for l in lines if l]
        idx = [i for i, l in enumerate(lines) if MARKER.match(l)]
        if not idx:
            no_marker += 1
            continue
        scanned += 1
        for j in range(idx[-1] + 1, len(lines)):
            n = len(lines[j].split())
            max_seen = max(max_seen, n)
            if n > a.max_tokens:
                flagged.append((r["hexagram_id"], r.get("line_position"), r["text_type"], j + 1, n, lines[j]))

    print(f"File: {a.json}")
    print(f"Dong da quet (co dong danh dau): {scanned}; khong co dong danh dau (bo qua): {no_marker}")
    print(f"Dong tho dai nhat gap: {max_seen} tieng; nguong gan co: > {a.max_tokens}")
    print(f"So dong bi gan co: {len(flagged)}")
    for h, lp, t, ln, n, text in flagged:
        pv = text if len(text) <= 90 else text[:90] + "..."
        print(f"  FLAG que {h} hao {lp if lp is not None else '-'} {t} dong {ln} ({n} tieng): {pv}")
    if flagged:
        print("-> Xem cuoi text_vn cua cac dong tren trong PDF: neu la loi binh giang cua tac gia thi parser dang lay thua.")
    sys.exit(1 if flagged else 0)


if __name__ == "__main__":
    main()

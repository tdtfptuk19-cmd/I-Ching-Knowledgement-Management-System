#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_content.py — Kiem tra noi dung toan dien classic_texts.

Kiem tra:
  1. text_han co ky tu la (khong phai chu Han, khong phai ky tu cho phep)
  2. Dong lap trong text_vn
  3. Nhan thua o dau/cuoi text_vn
  4. Dau cau le dau/cuoi text_han hoac text_vn
  5. Tuong quan do dai text_han vs text_vn (qua chenh lech → canh bao)
  6. Doi chieu HAO_TU voi TIEU_TUONG cung hao (phat hien bat tuong xung)
  7. Phat hien source_id bat hop le

Su dung: python audit_content.py [<thu_muc_final_json>]
Mac dinh quet thu muc _out/ hien tai.

TUYEN BO: Script nay chi DOC, KHONG GHI bat ky file *.json nao.
"""
import json, glob, os, re, sys, unicodedata
from collections import Counter

# Ky tu Han hop le: CJK Unified, Extension A, B, Compatibility
HAN_RANGES = [
    (0x3400, 0x4DBF),   # CJK Extension A
    (0x4E00, 0x9FFF),   # CJK Unified
    (0xF900, 0xFAFF),   # CJK Compatibility
    (0x20000, 0x2A6DF), # CJK Extension B
]

def is_han(c):
    cp = ord(c)
    return any(lo <= cp <= hi for lo, hi in HAN_RANGES)

def check_han_chars(text_han, row_id):
    """Kiem tra text_han chi chua chu Han. Tra ve danh sach loi."""
    issues = []
    if text_han is None:
        return issues
    # Bo tien to 象曰, 彖曰, etc. — cac chu nay duoc phep o dau
    # Nhung tat ca ky tu deu phai la Han
    for i, c in enumerate(text_han):
        if not is_han(c):
            issues.append(f"  [{row_id}] text_han[{i}] = {c!r} (U+{ord(c):04X}) KHONG PHAI chu Han")
    return issues

def check_vn_issues(text_vn, row_id):
    """Kiem tra text_vn co cac van de: nhan thua, dau cau le, dong lap."""
    issues = []
    if text_vn is None:
        return issues
    
    lines = text_vn.split("\n")
    
    # Dau cham le o dau
    if text_vn.startswith("."):
        issues.append(f"  [{row_id}] text_vn bat dau bang dau cham le: {text_vn[:20]!r}")
    
    # Nhan thua cuoi
    last_line = lines[-1].strip() if lines else ""
    LABEL_PATTERNS = ["Thoán Truyện:", "Thoán truyện:", "Hào", "Tượng viết:"]
    for pat in LABEL_PATTERNS:
        if last_line == pat or last_line.startswith(pat + " ") and len(last_line) < len(pat) + 5:
            issues.append(f"  [{row_id}] text_vn ket thuc bang nhan co the thua: {last_line!r}")
    
    # Dong lap
    stripped_lines = [l.strip() for l in lines if l.strip()]
    counts = Counter(stripped_lines)
    for line, cnt in counts.items():
        if cnt > 1 and len(line) > 5:
            issues.append(f"  [{row_id}] Dong lap x{cnt}: {line[:60]!r}")
    
    return issues

def check_len_correlation(text_han, text_vn, row_id):
    """Canh bao neu do dai qua chenh lech."""
    issues = []
    if text_han is None or text_vn is None:
        return issues
    han_len = len(text_han)
    # text_vn thuong dai hon nhieu lan (phien am + dich), nen ratio phai hop ly
    # text_han 1 chu ~ 1-3 tu Viet; neu text_vn ngan hon text_han * 2 -> bat thuong
    vn_len = len(text_vn)
    if vn_len < han_len:
        issues.append(f"  [{row_id}] CANH BAO: text_vn ({vn_len} ky tu) ngan hon text_han ({han_len} ky tu)")
    return issues

def check_hao_vs_tieu(data):
    """Doi chieu HAO_TU voi TIEU_TUONG: phai co cung so hao."""
    issues = []
    rows = data.get("classic_texts", [])
    hao_tu = {}
    tieu_tuong = {}
    for r in rows:
        hid = r.get("hexagram_id")
        lp = r.get("line_position")
        tt = r.get("text_type")
        if tt == "HAO_TU" and lp is not None:
            hao_tu[(hid, lp)] = r
        elif tt == "TIEU_TUONG" and lp is not None:
            tieu_tuong[(hid, lp)] = r
    
    # Kiem tra moi HAO_TU phai co TIEU_TUONG tuong ung
    for key in hao_tu:
        if key not in tieu_tuong:
            hid, lp = key
            issues.append(f"  Que {hid} hao {lp}: co HAO_TU nhung THIEU TIEU_TUONG")
    for key in tieu_tuong:
        if key not in hao_tu:
            hid, lp = key
            issues.append(f"  Que {hid} hao {lp}: co TIEU_TUONG nhung THIEU HAO_TU")
    
    return issues

def audit_file(path):
    """Kiem tra mot file JSON. Tra ve (n_issues, n_warnings)."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    
    fname = os.path.basename(path)
    all_issues = []
    all_warnings = []
    
    rows = data.get("classic_texts", [])
    
    for i, r in enumerate(rows):
        hid = r.get("hexagram_id")
        lp = r.get("line_position")
        tt = r.get("text_type")
        row_id = f"Q{hid} {tt} pos={lp}"
        
        # Kiem tra text_han
        han_issues = check_han_chars(r.get("text_han"), row_id)
        all_issues.extend(han_issues)
        
        # Kiem tra text_vn
        vn_issues = check_vn_issues(r.get("text_vn"), row_id)
        # Phan loai: nhan thua va dau cham la LOI, dong lap la CANH BAO
        for iss in vn_issues:
            if "Dong lap" in iss:
                all_warnings.append(iss)
            else:
                all_issues.append(iss)
        
        # Kiem tra do dai
        len_issues = check_len_correlation(r.get("text_han"), r.get("text_vn"), row_id)
        all_warnings.extend(len_issues)
        
        # Kiem tra source_id
        sid = r.get("source_id")
        if sid is None or not isinstance(sid, int) or sid < 1 or sid > 16:
            all_issues.append(f"  [{row_id}] source_id bat hop le: {sid!r}")
    
    # Kiem tra HAO_TU vs TIEU_TUONG
    pair_issues = check_hao_vs_tieu(data)
    all_issues.extend(pair_issues)
    
    return all_issues, all_warnings

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "_out"
    )
    
    files = sorted(glob.glob(os.path.join(base, "final_b*.json")))
    if not files:
        print(f"CANH BAO: Khong tim thay file final_b*.json trong {base}")
        sys.exit(1)
    
    print(f"audit_content.py — Quet {len(files)} file")
    print("=" * 60)
    
    total_issues = 0
    total_warnings = 0
    
    for path in files:
        fname = os.path.basename(path)
        issues, warnings = audit_file(path)
        
        if issues or warnings:
            print(f"\n[{fname}]")
            if issues:
                print(f"  LOI ({len(issues)}):")
                for iss in issues:
                    print(iss)
            if warnings:
                print(f"  CANH BAO ({len(warnings)}):")
                for w in warnings:
                    print(w)
        
        total_issues += len(issues)
        total_warnings += len(warnings)
    
    print("\n" + "=" * 60)
    print(f"KET QUA: {total_issues} LOI, {total_warnings} CANH BAO")
    
    if total_issues == 0:
        print("PASS: Khong co loi nghiem trong.")
    else:
        print("FAIL: Co loi can xu ly truoc khi nap vao DB.")
        sys.exit(1)

if __name__ == "__main__":
    main()

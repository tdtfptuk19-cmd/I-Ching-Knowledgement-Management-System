#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_tool.py - CONG CHAN CUONG CHE + nap DB co kiem chung cho kinh van (classic_texts).

  gate   <P> --source-id N --que a-b    Chay moi cong tu FILE; ghi _out\\gate_<P>.json. Thoat 1 neu co cong FAIL.
  apply  <P> [--execute]                NGUOI DUNG chay. Chi chay khi gate PASS va cac file khong doi.
                                        Mac dinh DRY-RUN (khong ghi DB); them --execute de ghi that, roi tu verify.
  verify <P> [--expect-total N]         Chi doc DB: so TUNG dong cua batch voi final_<P>.json bang SHA256.
  verify-all --json F1 F2 ... [--overlay overlay.json] [--expect-total N]
                                        Chi doc DB: so TOAN BO classic_texts voi cac file nguon (+ ban sua).
  retag  <in.json> --source-id N --out <out.json>
                                        Chi doi source_id; khong cham text_han/text_vn; khong ghi de file co san.

Chay tu thu muc du an (co _out\\). Chi dung thu vien chuan cua Python.
"""
import argparse
import csv
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata

DEFAULT_SQLCMD = r"C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\SQLCMD.EXE"
HERE = os.path.dirname(os.path.abspath(__file__))
CJK_ONLY = re.compile(r"^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\U00020000-\U0002a6df]+$")
EXPLAIN_STRUCT = ("han_prefix_omitted", "source_variant", "source_defect")
VALID_MARK = {"Y", "N", "N/A"}


# ----------------------------------------------------------------------------- tien ich
def die(msg, code=1):
    print("DUNG: " + msg)
    sys.exit(code)


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for ch in iter(lambda: f.read(1 << 20), b""):
            h.update(ch)
    return h.hexdigest().upper()


def read_text_auto(p):
    b = open(p, "rb").read()
    if b[:2] in (b"\xff\xfe", b"\xfe\xff"):
        return b.decode("utf-16")
    return b.decode("utf-8-sig", errors="replace")


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def rows_of(p):
    return load_json(p)["classic_texts"]


def key(r):
    return (r.get("hexagram_id"), r.get("line_position"), r.get("text_type"))


def issues(r):
    v = (r.get("_meta") or {}).get("issues") or []
    return [str(x) for x in v] if isinstance(v, list) else [str(v)]


def has_issue(r, *words):
    return any(w in s for s in issues(r) for w in words)


def norm_han(s):
    return "".join(c for c in (s or "") if unicodedata.category(c)[0] not in "PZC")


def h16(s):
    if s is None:
        return hashlib.sha256(b"").hexdigest().upper()
    s_norm = s.replace("\r", "")
    return hashlib.sha256(s_norm.encode("utf-16-le")).hexdigest().upper()


def is_flagged(r):
    m = r.get("_meta") or {}
    return (bool(issues(r)) or r.get("text_han") is None or r.get("text_vn") is None
            or m.get("confidence") not in (None, "high"))


def writable(p):
    return os.access(p, os.W_OK)


def parse_que(s):
    m = re.fullmatch(r"(\d+)-(\d+)", (s or "").strip())
    if not m:
        die("--que phai co dang a-b (vi du 31-34)")
    return list(range(int(m.group(1)), int(m.group(2)) + 1))


def parse_baseline(p):
    d = {}
    for ln in read_text_auto(p).splitlines():
        m = re.match(r"^\s*([0-9A-Fa-f]{64})\s+(.+?)\s*$", ln)
        if m:
            d[re.split(r"[\\/]", m.group(2).strip())[-1].lower()] = m.group(1).upper()
    return d


def load_audit_nonok(path):
    out = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            st = (r.get("status") or "").strip().upper()
            if st in ("", "OK"):
                continue
            lp = (r.get("line_position") or "").strip()
            try:
                hid = int(r["hexagram_id"])
                lpv = None if lp == "" else int(lp)
            except (KeyError, ValueError):
                continue
            out.append(((hid, lpv, (r.get("text_type") or "").strip()),
                        (r.get("check") or "").strip().upper(), st, (r.get("detail") or "")[:100]))
    return out


def fmt_keys(ks, n=6):
    ks = list(ks)
    s = ", ".join(f"{h}/{'-' if lp is None else lp}/{t}" for h, lp, t in ks[:n])
    return s + (f" ... (+{len(ks) - n})" if len(ks) > n else "")


def run_loader(a, json_path):
    loader = a.loader or os.path.join(HERE, "load_json_to_sql.py")
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    p = subprocess.run([sys.executable, loader, json_path, "--strip-han-punct", "--texts-only"],
                       capture_output=True, env=env)
    return p.returncode, (p.stdout + p.stderr).decode("utf-8", "replace")


# ----------------------------------------------------------------------------- GATE
def cmd_gate(a):
    od, P = a.out_dir, a.batch
    names = {"gen": f"{P}.generated.json", "final": f"final_{P}.json", "sheet": f"review_{P}.csv",
             "audit": f"audit_final_{P}.csv", "leak": f"leak_final_{P}.txt"}
    paths = {k: os.path.join(od, v) for k, v in names.items()}
    res = []

    def add(g, ok, d=""):
        res.append({"gate": g, "pass": bool(ok), "detail": d})

    missing = [paths[k] for k in paths if not os.path.exists(paths[k])]
    add("G01_files_exist", not missing, ("thieu: " + "; ".join(missing)) if missing else "du 5 file")
    if not missing:
        try:
            gate_checks(a, paths, add)
        except Exception as e:  # mot loi bat ngo cung la FAIL, khong bao gio bo qua
            add("G99_exception", False, f"{type(e).__name__}: {e}")
    overall = all(r["pass"] for r in res)
    rec = {"batch": P, "created": datetime.datetime.now().isoformat(timespec="seconds"),
           "source_id": a.source_id, "que": a.que, "overall": overall, "results": res,
           "files": {k: {"path": p, "sha256": sha256_file(p)} for k, p in paths.items() if os.path.exists(p)}}
    gp = os.path.join(od, f"gate_{P}.json")
    with open(gp, "w", encoding="utf-8") as f:
        json.dump(rec, f, ensure_ascii=False, indent=2)
    print(f"=== GATE {P} ===")
    for r in res:
        print(f"  {'PASS' if r['pass'] else 'FAIL'}  {r['gate']:<40} {r['detail']}")
    print(f"KET QUA: {'PASS' if overall else 'FAIL'}  (ghi {gp})")
    sys.exit(0 if overall else 1)


def gate_checks(a, paths, add):
    gen, fin = rows_of(paths["gen"]), rows_of(paths["final"])
    gk = {key(r): r for r in gen}
    fk = {key(r): r for r in fin}
    add("G02_unique_keys", len(gk) == len(gen) and len(fk) == len(fin),
        f"generated={len(gen)}/{len(gk)}, final={len(fin)}/{len(fk)} (dong/khoa)")
    add("G03_same_keys_as_generated", set(gk) == set(fk),
        "khoa final = khoa generated" if set(gk) == set(fk) else
        f"thua: {fmt_keys(set(fk) - set(gk))} | thieu: {fmt_keys(set(gk) - set(fk))}")
    ids = sorted({r["hexagram_id"] for r in fin})
    if a.que:
        add("G04_hexagram_range", ids == parse_que(a.que), f"final co que {ids[:1]}..{ids[-1:]}; ky vong {a.que}")
    cnt = {}
    for r in fin:
        cnt[r["hexagram_id"]] = cnt.get(r["hexagram_id"], 0) + 1
    bad = {h: n for h, n in cnt.items() if n != (17 if h in (1, 2) else a.rows_per_que)}
    add("G05_rows_per_hexagram", not bad, "dung" if not bad else f"sai so dong: {bad}")
    bad_src = [k for k, r in fk.items() if r.get("source_id") != a.source_id]
    add("G06_source_id", not bad_src, f"moi dong = {a.source_id}" if not bad_src else
        f"{len(bad_src)} dong sai source_id, vd {fmt_keys(bad_src, 3)}")
    vn_rows = [k for k in fk if k[2] == "VAN_NGON"]
    add("G07_no_van_ngon", not vn_rows, "khong co VAN_NGON" if not vn_rows else fmt_keys(vn_rows))
    bad_han = [k for k, r in fk.items() if r.get("text_han") is not None and not CJK_ONLY.match(r["text_han"])]
    add("G08_text_han_only_cjk", not bad_han, "sach" if not bad_han else f"co ky tu khong phai chu Han: {fmt_keys(bad_han)}")
    bad_vn = [k for k, r in fk.items() if not (isinstance(r.get("text_vn"), str) and r["text_vn"].strip())]
    add("G09_text_vn_present", not bad_vn, "du" if not bad_vn else f"thieu text_vn: {fmt_keys(bad_vn)}")
    nulls = sum(1 for r in fin if r.get("text_han") is None)
    add("G10_null_han_rate", nulls <= a.max_null_frac * max(1, len(fin)),
        f"{nulls}/{len(fin)} dong text_han null (nguong {a.max_null_frac:.0%})")
    unfixed = [k for k in fk if k in gk
               and (gk[k].get("text_han"), gk[k].get("text_vn")) != (fk[k].get("text_han"), fk[k].get("text_vn"))
               and not has_issue(fk[k], "manual_fix")]
    add("G11_every_change_has_manual_fix", not unfixed,
        "moi dong sua deu co manual_fix" if not unfixed else f"sua ma khong ghi manual_fix: {fmt_keys(unfixed)}")

    nonok = load_audit_nonok(paths["audit"])
    unexpl = []
    for k, chk, st, d in nonok:
        if st == "REVIEW":
            continue
        r = fk.get(k)
        if r is not None and ((chk == "STRUCTURE" and has_issue(r, *EXPLAIN_STRUCT)) or has_issue(r, "audit_accept")):
            continue
        unexpl.append((k, chk, st))
    add("G12_audit_final_no_unexplained_mismatch", not unexpl,
        f"{len(nonok)} dong khong OK, deu la REVIEW hoac da giai thich" if not unexpl else
        "; ".join(f"{h}/{'-' if lp is None else lp}/{t} {c} {s}" for (h, lp, t), c, s in unexpl[:5]))

    leak = read_text_auto(paths["leak"])
    m = re.search(r"So dong bi gan co:\s*(\d+)", leak)
    add("G13_leak_final_zero", bool(m) and int(m.group(1)) == 0,
        f"check_vn_leak bao {m.group(1)} dong" if m else "khong doc duoc 'So dong bi gan co' trong file leak")

    with open(paths["sheet"], encoding="utf-8-sig", newline="") as f:
        sheet = list(csv.DictReader(f))
    need = {"row_id", "hexagram_id", "line_position", "text_type", "han_ok", "vn_ok", "note"}
    cols_ok = bool(sheet) and need <= set(sheet[0].keys())
    add("G14_sheet_has_columns", cols_ok, "du cot han_ok/vn_ok..." if cols_ok else f"thieu cot: {sorted(need - set(sheet[0].keys())) if sheet else 'phieu rong'}")
    if cols_ok:
        skeys, blank, badval, nrows = {}, [], [], []
        for r in sheet:
            try:
                lp = (r["line_position"] or "").strip()
                k = (int(r["hexagram_id"]), None if lp == "" else int(lp), r["text_type"].strip())
            except ValueError:
                continue
            skeys[k] = r
            h, v = (r["han_ok"] or "").strip().upper(), (r["vn_ok"] or "").strip().upper()
            if h == "" or v == "":
                blank.append(k)
            elif h not in VALID_MARK or v not in VALID_MARK:
                badval.append(k)
            if "N" in (h, v):
                nrows.append((k, (r["note"] or "").strip()))
        add("G15_sheet_fully_checked", not blank and not badval,
            f"{len(skeys)} dong deu da kiem" if not blank and not badval else
            f"chua dien: {len(blank)} (vd {fmt_keys(blank, 4)}); gia tri sai: {len(badval)}")
        must = {k for k, r in gk.items() if is_flagged(r)} | {k for k, _, _, _ in nonok}
        uncovered = must - set(skeys)
        add("G16_sheet_covers_flagged_and_audit", not uncovered,
            f"{len(must)} dong bat buoc deu co trong phieu" if not uncovered else f"thieu trong phieu: {fmt_keys(uncovered)}")
        unres = [k for k, note in nrows
                 if not (has_issue(fk.get(k, {}), "manual_fix") or note.upper().startswith("ACCEPT:"))]
        add("G17_N_rows_resolved", not unres,
            f"{len(nrows)} dong danh N, deu co manual_fix hoac ACCEPT:" if not unres else
            f"danh N nhung chua co manual_fix/ACCEPT: {fmt_keys(unres)}")

    add("G18_final_is_readonly", not writable(paths["final"]),
        "final o che do chi doc" if not writable(paths["final"]) else "final CON GHI DUOC: chay attrib +R")

    tools = a.tools or [os.path.join(od_default(a), "extract_core.py"), os.path.join(od_default(a), "audit_json_vs_pdf_v3.py")]
    if not os.path.exists(a.baseline):
        add("G19_tools_unchanged", False, f"thieu file moc ma bam: {a.baseline}")
    else:
        base = parse_baseline(a.baseline)
        probs = []
        for t in tools:
            nm = re.split(r"[\\/]", t)[-1].lower()
            if not os.path.exists(t):
                probs.append(f"{nm}: khong ton tai")
            elif nm not in base:
                probs.append(f"{nm}: khong co trong file moc")
            elif sha256_file(t) != base[nm]:
                probs.append(f"{nm}: LECH moc")
        add("G19_tools_unchanged", not probs, "parser va audit khop moc" if not probs else "; ".join(probs))

    tmp = tempfile.mkdtemp(prefix="gate_")
    try:
        cp = os.path.join(tmp, "final.json")
        shutil.copyfile(paths["final"], cp)
        rc, out = run_loader(a, cp)
        warns = [ln for ln in out.splitlines() if ln.startswith("CANH BAO")]
        missing_w = [w for w in warns if "THIEU" in w]
        add("G20_loader_dry_run", rc == 0 and "LOI:" not in out and not missing_w,
            f"loader ok ({len(warns)} canh bao)" if rc == 0 and "LOI:" not in out and not missing_w else
            (out.strip().replace("\n", " | ")[:300] or f"exit {rc}"))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def od_default(a):
    return a.out_dir


# ----------------------------------------------------------------------------- SQL / VERIFY
def run_sqlcmd(a, extra):
    cmd = [a.sqlcmd, "-S", a.server, "-E", "-d", a.db, "-b", "-f", "65001", "-I"] + extra
    p = subprocess.run(cmd, capture_output=True)
    return p.returncode, p.stdout.decode("utf-8-sig", "replace"), p.stderr.decode("utf-8-sig", "replace")


def query(a, tag, sql):
    rc, out, err = run_sqlcmd(a, ["-h", "-1", "-W", "-s", "|", "-Q", f"/*TAG:{tag}*/ SET NOCOUNT ON; {sql}"])
    if rc != 0:
        die(f"sqlcmd loi o truy van {tag}: {(out + err).strip()[:300]}")
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def build_expected(files, skip_types=("VAN_NGON",)):
    exp, src = {}, {}
    for f in files:
        for r in rows_of(f):
            if r.get("text_type") in skip_types:
                continue
            k = key(r)
            if k in exp:
                die(f"khoa trung giua cac file nguon: {k} ({src[k]} va {f})")
            exp[k] = (norm_han(r["text_han"]) if r.get("text_han") is not None else None, r.get("text_vn"))
            src[k] = f
    return exp


def apply_overlay(exp, path):
    for o in load_json(path)["overrides"]:
        k = (o["hexagram_id"], o["line_position"], o["text_type"])
        if k not in exp:
            die(f"overlay tham chieu khoa khong co trong nguon: {k}")
        han, vn = exp[k]
        if o["column"] == "text_han":
            han = o["value"]
        elif o["column"] == "text_vn":
            vn = o["value"]
        else:
            die(f"overlay cot khong ho tro: {o['column']}")
        exp[k] = (han, vn)


def do_verify(a, exp, ids, expect_total, label):
    checks = []

    def add(n, ok, d=""):
        checks.append({"check": n, "pass": bool(ok), "detail": d})

    where = (" WHERE hexagram_id IN (" + ",".join(str(i) for i in ids) + ")") if ids else ""
    and_ids = (" AND hexagram_id IN (" + ",".join(str(i) for i in ids) + ")") if ids else ""
    total = int(query(a, "total", "SELECT COUNT(*) FROM classic_texts")[0])
    add("V1_total_rows", expect_total is None or total == expect_total,
        f"DB={total}" + ("" if expect_total is None else f", ky vong={expect_total}"))
    got = {}
    for ln in query(a, "per_que", f"SELECT hexagram_id, COUNT(*) FROM classic_texts{where} GROUP BY hexagram_id ORDER BY hexagram_id"):
        h, n = ln.split("|")
        got[int(h)] = int(n)
    want = {}
    for (h, _, _) in exp:
        want[h] = want.get(h, 0) + 1
    add("V2_rows_per_hexagram", got == want, "khop" if got == want else
        f"lech: " + ", ".join(f"{h}: DB {got.get(h, 0)} / nguon {want.get(h, 0)}" for h in sorted(set(got) | set(want)) if got.get(h, 0) != want.get(h, 0))[:300])
    n_latin = int(query(a, "latin", "SELECT COUNT(*) FROM classic_texts WHERE text_han LIKE N'%[A-Za-z ]%'")[0])
    add("V3_no_latin_or_space_in_han", n_latin == 0, f"{n_latin} dong")
    n_vn = int(query(a, "vanngon", "SELECT COUNT(*) FROM classic_texts WHERE text_type = 'VAN_NGON'")[0])
    add("V4_no_van_ngon", n_vn == 0, f"{n_vn} dong")
    n_null = int(query(a, "nullhan", f"SELECT COUNT(*) FROM classic_texts WHERE text_han IS NULL{and_ids}")[0])
    exp_null = sum(1 for v in exp.values() if v[0] is None)
    add("V5_null_han_count", n_null == exp_null, f"DB={n_null}, nguon={exp_null}")

    dbh = {}
    for ln in query(a, "hashes", "SELECT hexagram_id, ISNULL(line_position,-1), text_type, "
                                  "CONVERT(varchar(64), HASHBYTES('SHA2_256', ISNULL(text_han,N'')), 2), "
                                                                    "CONVERT(varchar(64), HASHBYTES('SHA2_256', REPLACE(ISNULL(text_vn,N''), CHAR(13), N'')), 2) "
                                  f"FROM classic_texts{where} ORDER BY 1, 2, 3"):
        p = ln.split("|")
        if len(p) != 5:
            die(f"dong ket qua hash khong dung dinh dang: {ln[:80]}")
        lp = int(p[1])
        dbh[(int(p[0]), None if lp == -1 else lp, p[2])] = (p[3].upper(), p[4].upper())
    miss = [k for k in exp if k not in dbh]
    extra = [k for k in dbh if k not in exp]
    diff = [(k, "han" if dbh[k][0] != h16(exp[k][0]) else "vn") for k in exp if k in dbh
            and (dbh[k][0] != h16(exp[k][0]) or dbh[k][1] != h16(exp[k][1]))]
    add("V6_row_by_row_sha256", not (miss or extra or diff),
        f"{len(dbh)} dong DB, {len(exp)} dong nguon: khop 100%" if not (miss or extra or diff) else
        f"thieu trong DB: {len(miss)}, thua trong DB: {len(extra)}, lech noi dung: {len(diff)} "
        f"(vd {fmt_keys([k for k, _ in diff], 3)})")
    st = query(a, "struct", "SELECT (SELECT COUNT(*) FROM trigrams), (SELECT COUNT(*) FROM hexagrams), "
                            "(SELECT COUNT(*) FROM hexagram_lines), (SELECT COUNT(*) FROM divination_cases)")[0]
    add("V7_structure_unchanged", st == "8|64|386|0", f"trigrams|hexagrams|lines|divination = {st}")

    ok = all(c["pass"] for c in checks)
    print(f"=== VERIFY {label} ===")
    for c in checks:
        print(f"  {'PASS' if c['pass'] else 'FAIL'}  {c['check']:<34} {c['detail']}")
    print(f"KET QUA: {'PASS' if ok else 'FAIL'}")
    return ok, checks


def write_verify(a, label, ok, checks):
    p = os.path.join(a.out_dir, f"verify_{label}_tool.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump({"label": label, "time": datetime.datetime.now().isoformat(timespec="seconds"),
                   "overall": ok, "checks": checks}, f, ensure_ascii=False, indent=2)
    print(f"(ghi {p})")


def cmd_verify(a):
    final = os.path.join(a.out_dir, f"final_{a.batch}.json")
    if not os.path.exists(final):
        die(f"khong thay {final}")
    exp = build_expected([final])
    if a.overlay:
        apply_overlay(exp, a.overlay)
    ids = sorted({k[0] for k in exp})
    ok, checks = do_verify(a, exp, ids, a.expect_total, a.batch)
    write_verify(a, a.batch, ok, checks)
    sys.exit(0 if ok else 1)


def cmd_verify_all(a):
    exp = build_expected(a.json)
    if a.overlay:
        apply_overlay(exp, a.overlay)
    ok, checks = do_verify(a, exp, None, a.expect_total if a.expect_total is not None else len(exp), "all")
    write_verify(a, "all", ok, checks)
    sys.exit(0 if ok else 1)


def static_scan(sql, nrows, source_id):
    stripped = re.sub(r"N'(?:[^']|'')*'", "N''", sql)
    allowed = [re.compile(x) for x in (
        r"^USE \w+;$", r"^GO$", r"^SET XACT_ABORT ON;$", r"^BEGIN TRY$", r"^BEGIN TRAN;$", r"^COMMIT;$",
        r"^PRINT N'';$", r"^END TRY$", r"^BEGIN CATCH$", r"^IF @@TRANCOUNT > 0 ROLLBACK;$", r"^THROW;$",
        r"^END CATCH;$")]
    ins = re.compile(r"^INSERT INTO classic_texts \(hexagram_id, line_position, text_type, text_han, text_vn, source_id\) "
                     r"VALUES \((?:\d+|NULL), (?:\d+|NULL), N'', (?:N''|NULL), (?:N''|NULL), (\d+)\);$")
    bad, n_ins = [], 0
    for ln in stripped.splitlines():
        s = ln.strip()
        if not s:
            continue
        m = ins.match(s)
        if m:
            n_ins += 1
            if int(m.group(1)) != source_id:
                bad.append("source_id sai: " + s[:80])
        elif not any(p.match(s) for p in allowed):
            bad.append(s[:80])
    if bad:
        die("file SQL chua lenh ngoai ke hoach: " + " | ".join(bad[:3]))
    if n_ins != nrows:
        die(f"so lenh INSERT ({n_ins}) khac so dong final ({nrows})")


def cmd_apply(a):
    od, P = a.out_dir, a.batch
    gp = os.path.join(od, f"gate_{P}.json")
    if not os.path.exists(gp):
        die(f"chua co {gp}. Phai chay 'gate' truoc.")
    g = load_json(gp)
    if not g.get("overall"):
        die("gate cua batch nay la FAIL. Khong duoc nap.")
    for n, info in g["files"].items():
        if not os.path.exists(info["path"]) or sha256_file(info["path"]) != info["sha256"]:
            die(f"file '{n}' da bi DOI hoac mat sau khi gate chay ({info['path']}). Chay lai gate.")
    final = g["files"]["final"]["path"]
    if writable(final):
        die("final chua o che do chi doc (attrib +R).")
    rows = rows_of(final)
    ids = sorted({r["hexagram_id"] for r in rows})
    source_id = int(g["source_id"])

    work = os.path.join(od, f"apply_{P}")
    os.makedirs(work, exist_ok=True)
    wf = os.path.join(work, "final.json")
    shutil.copyfile(final, wf)
    rc, out = run_loader(a, wf)
    if rc != 0 or "LOI:" in out:
        die("loader loi:\n" + out)
    with open(os.path.join(work, "final_load.sql"), encoding="utf-8-sig") as f:
        sql = f.read()
    static_scan(sql, len(rows), source_id)
    nobom = os.path.join(work, "final_load_nobom.sql")
    with open(nobom, "w", encoding="utf-8", newline="\n") as f:
        f.write(sql)

    total_before = int(query(a, "total", "SELECT COUNT(*) FROM classic_texts")[0])
    existing = int(query(a, "existing", "SELECT COUNT(*) FROM classic_texts WHERE hexagram_id IN ("
                         + ",".join(str(i) for i in ids) + ")")[0])
    if existing != 0:
        die(f"DB da co {existing} dong cua cac que {ids[0]}..{ids[-1]}. Khong nap de tranh trung lap.")
    print(f"KE HOACH GHI: batch {P}: {len(rows)} dong INSERT vao classic_texts (que {ids[0]}..{ids[-1]}, source_id {source_id})")
    print(f"  server={a.server} db={a.db}; classic_texts hien co {total_before}; sau khi nap ky vong {total_before + len(rows)}")
    print(f"  file SQL: {nobom} (da quet: chi co INSERT classic_texts + giao dich)")
    if not a.execute:
        print("DRY-RUN: chua ghi gi. Them --execute de ghi that.")
        return
    rc, out, err = run_sqlcmd(a, ["-i", nobom])
    with open(os.path.join(work, "load_output.txt"), "w", encoding="utf-8") as f:
        f.write(out + "\n" + err)
    if rc != 0 or "Nap thanh cong" not in out:
        die("nap THAT BAI (giao dich da duoc huy). Ket qua:\n" + (out + err).strip()[:800])
    print("NAP THANH CONG. Dang kiem chung tung dong...")
    exp = build_expected([final])
    ok, checks = do_verify(a, exp, ids, total_before + len(rows), P)
    write_verify(a, P, ok, checks)
    sys.exit(0 if ok else 1)


def cmd_retag(a):
    if os.path.exists(a.out):
        die(f"{a.out} da ton tai; khong ghi de.")
    d = load_json(a.input)
    rows = d["classic_texts"]
    before = [(r.get("text_han"), r.get("text_vn")) for r in rows]
    olds = sorted({r.get("source_id") for r in rows}, key=str)
    for r in rows:
        r["source_id"] = a.source_id
    if before != [(r.get("text_han"), r.get("text_vn")) for r in rows]:
        die("noi dung bi doi ngoai y muon")
    d["_retag"] = {"from_source_ids": olds, "to": a.source_id,
                   "time": datetime.datetime.now().isoformat(timespec="seconds")}
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print(f"Da ghi {a.out}: {len(rows)} dong, source_id {olds} -> {a.source_id}; text_han/text_vn khong doi.")


# ----------------------------------------------------------------------------- main
def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp, db=False):
        sp.add_argument("--out-dir", default="_out")
        if db:
            sp.add_argument("--sqlcmd", default=DEFAULT_SQLCMD)
            sp.add_argument("--server", default="(local)")
            sp.add_argument("--db", default="KinhDich_KB")

    g = sub.add_parser("gate")
    g.add_argument("batch")
    g.add_argument("--source-id", type=int, required=True)
    g.add_argument("--que")
    g.add_argument("--rows-per-que", type=int, default=15)
    g.add_argument("--max-null-frac", type=float, default=0.35)
    g.add_argument("--baseline", default=os.path.join("_out", "baseline_hashes.txt"))
    g.add_argument("--tools", nargs="*")
    g.add_argument("--loader")
    common(g)
    g.set_defaults(fn=cmd_gate)

    ap = sub.add_parser("apply")
    ap.add_argument("batch")
    ap.add_argument("--execute", action="store_true")
    ap.add_argument("--loader")
    common(ap, True)
    ap.set_defaults(fn=cmd_apply)

    v = sub.add_parser("verify")
    v.add_argument("batch")
    v.add_argument("--expect-total", type=int)
    v.add_argument("--overlay")
    common(v, True)
    v.set_defaults(fn=cmd_verify)

    va = sub.add_parser("verify-all")
    va.add_argument("--json", nargs="+", required=True)
    va.add_argument("--overlay")
    va.add_argument("--expect-total", type=int)
    common(va, True)
    va.set_defaults(fn=cmd_verify_all)

    r = sub.add_parser("retag")
    r.add_argument("input")
    r.add_argument("--source-id", type=int, required=True)
    r.add_argument("--out", required=True)
    r.set_defaults(fn=cmd_retag)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dich_su_validator.py - Post-Validation Guardrail Engine for Trợ lý Dịch sư (Milestone M3).

Executes 9 deterministic post-validation checks against markdown output:
1. Section headers: Exactly 3 canonical H2 headers in order.
2. Label lock: Line 1 of Section 1 matches **Kết luận tổng hợp: <NHÃN>**, no other labels.
3. Forbidden words: Strict prohibition of absolute certainty phrasing (G6).
4. Citation tag validity: 100% of 8-prefix citation tags exist in facts.valid_citations.
5. Citation density: >= 1 tag per section, >= 1 tag per bullet in Section 3.
6. G5 vigilance: Moving line tags in Section 2, vigilance keyword if hao_tu_is_hung & non-hung.
7. G9 leak strings: Zero leak_strings, zero 8+ consecutive word overlap with poem_texts.
8. Standard phrases count: Exact occurrence count of deterministic phrases (G4).
9. Stop reason check: stop_reason != "max_tokens" (truncation prevention).
"""

from __future__ import annotations

import re
from typing import Any, Dict, Final, FrozenSet, List, Optional, Set, Tuple
import unicodedata

from process_layer.app.engines.dich_su_facts import (
    Facts,
    STANDARD_PHRASE_RULES_EMPTY,
    STANDARD_PHRASE_TOPIC_FALLBACK,
    normalize_nfc,
)

# Canonical constants
EXPECTED_H2_HEADERS: Final[Tuple[str, ...]] = (
    "## 1. Tổng quan cơ duyên Thể Dụng",
    "## 2. Quá trình chuyển hóa (Quẻ Hỗ → Quẻ Biến)",
    "## 3. Chiến Lược Tu Thân & Xu Cát Tị Hung",
)

ALL_POLARITY_LABELS: Final[FrozenSet[str]] = frozenset({
    "ĐẠI CÁT", "TIỂU CÁT", "BÌNH HÒA", "TIỂU HUNG", "ĐẠI HUNG"
})

VALID_CITATION_PREFIXES: Final[Tuple[str, ...]] = (
    "Ngũ hành·",
    "Thoán từ,",
    "Thoán truyện,",
    "Đại tượng,",
    "Hào từ ",
    "Tiểu tượng ",
    "Luật·",
    "Tổng hợp·",
)

VIGILANCE_KEYWORDS_REGEX: Final[re.Pattern] = re.compile(
    r"\b(cảnh giác|thận trọng|lưu tâm)\b", re.IGNORECASE
)

# Python 3.12 compatible regex patterns for forbidden words
FORBIDDEN_WORDS_PATTERNS: Final[List[Tuple[str, re.Pattern]]] = [
    (
        "chắc chắn (không có từ phủ định)",
        re.compile(r"(?:(\b(?:không|chưa|khó))\s+)?(\bchắc chắn\b)", re.IGNORECASE),
    ),
    ("tất sẽ", re.compile(r"\btất sẽ\b", re.IGNORECASE)),
    ("chắc 100%", re.compile(r"\bchắc 100%(?!\w)", re.IGNORECASE)),
    ("nhất định (sẽ|phải|thành|xảy ra)", re.compile(r"\bnhất định\s+(?:sẽ|phải|thành|xảy ra)\b", re.IGNORECASE)),
]


def extract_sections(markdown_text: str) -> Tuple[Optional[str], Optional[str], Optional[str], List[str]]:
    """
    Split markdown_text into 3 sections based on H2 headers.

    Returns:
        (sec1_content, sec2_content, sec3_content, actual_h2_headers)
    """
    norm_text = normalize_nfc(markdown_text)
    lines = norm_text.splitlines()

    h2_lines = [line.strip() for line in lines if line.strip().startswith("## ")]

    p1 = norm_text.find(EXPECTED_H2_HEADERS[0])
    p2 = norm_text.find(EXPECTED_H2_HEADERS[1])
    p3 = norm_text.find(EXPECTED_H2_HEADERS[2])

    if p1 == -1 or p2 == -1 or p3 == -1 or not (p1 < p2 < p3):
        return None, None, None, h2_lines

    sec1 = norm_text[p1 + len(EXPECTED_H2_HEADERS[0]):p2].strip()
    sec2 = norm_text[p2 + len(EXPECTED_H2_HEADERS[1]):p3].strip()
    sec3 = norm_text[p3 + len(EXPECTED_H2_HEADERS[2]):].strip()
    return sec1, sec2, sec3, h2_lines


def extract_citations(text: str) -> List[str]:
    """
    Extract bracketed tokens matching 8 valid prefixes.
    Collapses internal whitespace, normalizes NFC.
    Ignores plain brackets like [1], [...], [ghi chú].
    """
    norm_text = normalize_nfc(text)
    raw_brackets = re.findall(r"\[([^\]]+)\]", norm_text)
    citations: List[str] = []
    for content in raw_brackets:
        cleaned = re.sub(r"\s+", " ", content).strip()
        if any(cleaned.startswith(prefix) for prefix in VALID_CITATION_PREFIXES):
            citations.append(f"[{cleaned}]")
    return citations


def post_validation(
    markdown_text: str,
    facts: Facts,
    stop_reason: str = "end_turn",
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Hậu kiểm toàn diện 9 rào chắn an toàn (Guardrails) trên văn bản luận giải.

    Args:
        markdown_text: Nội dung bài luận giải markdown cần kiểm tra.
        facts: Đối tượng Facts bất biến chứa các dữ kiện kiểm định.
        stop_reason: Lý do dừng sinh của LLM ("end_turn", "max_tokens", v.v.).

    Returns:
        tuple[bool, list[dict]]: (passed, checks)
    """
    norm_text = normalize_nfc(markdown_text)
    checks: List[Dict[str, Any]] = []

    # ----------------------------------------------------
    # Rule 1: Section headers (exactly 3 canonical H2 headers)
    # ----------------------------------------------------
    sec1, sec2, sec3, actual_h2s = extract_sections(norm_text)
    r1_passed = (actual_h2s == list(EXPECTED_H2_HEADERS))
    checks.append({
        "rule_id": "R1_SECTION_HEADERS",
        "description": "Kiểm tra cấu trúc đúng 3 tiêu đề H2 theo định dạng chuẩn",
        "passed": r1_passed,
        "details": {
            "expected_headers": list(EXPECTED_H2_HEADERS),
            "actual_headers": actual_h2s,
            "count_match": len(actual_h2s) == 3,
        },
    })

    # ----------------------------------------------------
    # Rule 2: Label lock (Line 1 of Section 1)
    # ----------------------------------------------------
    r2_passed = False
    r2_details: Dict[str, Any] = {}
    if sec1 is not None:
        sec1_lines = [l.strip() for l in sec1.splitlines() if l.strip()]
        if sec1_lines:
            line_1 = sec1_lines[0]
            m = re.match(r"^\*\*Kết luận tổng hợp:\s*(.+?)\*\*\s*$", line_1, re.IGNORECASE)
            if m:
                extracted_label = normalize_nfc(m.group(1)).strip().upper()
                expected_label = normalize_nfc(facts.polarity_label).strip().upper()
                label_matched = (extracted_label == expected_label)

                conflicting_labels = [
                    lbl for lbl in ALL_POLARITY_LABELS
                    if lbl != expected_label and lbl in line_1.upper()
                ]
                no_conflicts = (len(conflicting_labels) == 0)

                r2_passed = label_matched and no_conflicts
                r2_details = {
                    "first_line": line_1,
                    "extracted_label": extracted_label,
                    "expected_label": expected_label,
                    "label_matched": label_matched,
                    "conflicting_labels": conflicting_labels,
                }
            else:
                r2_details = {
                    "first_line": line_1,
                    "error": "Dòng đầu không đúng cú pháp **Kết luận tổng hợp: <NHÃN>**",
                }
        else:
            r2_details = {"error": "Mục 1 không có nội dung văn bản"}
    else:
        r2_details = {"error": "Không thể tách Mục 1 do thiếu tiêu đề H2"}

    checks.append({
        "rule_id": "R2_LABEL_LOCK",
        "description": "Khóa nhãn bắt buộc: Dòng đầu Mục 1 phải đúng mẫu **Kết luận tổng hợp: <NHÃN>**",
        "passed": r2_passed,
        "details": r2_details,
    })

    # ----------------------------------------------------
    # Rule 3: Forbidden words (Regex boundaries & negative lookbehind)
    # ----------------------------------------------------
    forbidden_violations: List[str] = []
    text_lower = norm_text.lower()
    for name, pattern in FORBIDDEN_WORDS_PATTERNS:
        if name.startswith("chắc chắn"):
            for m in pattern.finditer(text_lower):
                if not m.group(1):
                    forbidden_violations.append(m.group(2))
        else:
            for m in pattern.finditer(text_lower):
                forbidden_violations.append(m.group(0))

    r3_passed = (len(forbidden_violations) == 0)
    checks.append({
        "rule_id": "R3_FORBIDDEN_WORDS",
        "description": "Chặn từ cấm tuyệt đối hóa theo quy tắc G6",
        "passed": r3_passed,
        "details": {"violations": forbidden_violations},
    })

    # ----------------------------------------------------
    # Rule 4: Citation validity (100% of 8-prefix citations exist in facts)
    # ----------------------------------------------------
    all_citations = extract_citations(norm_text)
    invalid_citations = [c for c in all_citations if c not in facts.valid_citations]
    r4_passed = (len(invalid_citations) == 0 and len(all_citations) > 0)
    checks.append({
        "rule_id": "R4_CITATION_VALIDITY",
        "description": "Xác thực thẻ căn cứ: 100% thẻ 8 tiền tố phải tồn tại trong facts.valid_citations",
        "passed": r4_passed,
        "details": {
            "total_citations": len(all_citations),
            "invalid_citations": invalid_citations,
        },
    })

    # ----------------------------------------------------
    # Rule 5: Citation density (>=1 per section, >=1 per bullet in sec3)
    # ----------------------------------------------------
    r5_passed = False
    r5_details: Dict[str, Any] = {}
    if sec1 is not None and sec2 is not None and sec3 is not None:
        c1 = [c for c in extract_citations(sec1) if c in facts.valid_citations]
        c2 = [c for c in extract_citations(sec2) if c in facts.valid_citations]
        c3 = [c for c in extract_citations(sec3) if c in facts.valid_citations]

        # Parse bullet items in section 3
        sec3_lines = sec3.splitlines()
        bullets: List[str] = []
        current_bullet: List[str] = []
        for line in sec3_lines:
            stripped = line.strip()
            if re.match(r"^[-*+]\s+", stripped) or re.match(r"^\d+\.\s+", stripped):
                if current_bullet:
                    bullets.append("\n".join(current_bullet))
                current_bullet = [stripped]
            elif current_bullet:
                if stripped == "":
                    bullets.append("\n".join(current_bullet))
                    current_bullet = []
                else:
                    current_bullet.append(stripped)
        if current_bullet:
            bullets.append("\n".join(current_bullet))

        bullets_without_citation: List[str] = []
        for b in bullets:
            valid_b_cites = [c for c in extract_citations(b) if c in facts.valid_citations]
            if not valid_b_cites:
                bullets_without_citation.append(b)

        r5_passed = (
            len(c1) >= 1
            and len(c2) >= 1
            and len(c3) >= 1
            and len(bullets) >= 1
            and len(bullets_without_citation) == 0
        )
        r5_details = {
            "sec1_citation_count": len(c1),
            "sec2_citation_count": len(c2),
            "sec3_citation_count": len(c3),
            "sec3_bullet_count": len(bullets),
            "bullets_without_citation": bullets_without_citation,
        }
    else:
        r5_details = {"error": "Không thể kiểm tra mật độ do cấu trúc tiêu đề bị lỗi"}

    checks.append({
        "rule_id": "R5_CITATION_DENSITY",
        "description": "Mật độ thẻ căn cứ: Mỗi mục (1, 2, 3) có >= 1 thẻ; mỗi gạch đầu dòng Mục 3 có >= 1 thẻ",
        "passed": r5_passed,
        "details": r5_details,
    })

    # ----------------------------------------------------
    # Rule 6: G5 Vigilance check
    # ----------------------------------------------------
    r6_passed = False
    r6_details: Dict[str, Any] = {}
    if sec2 is not None:
        hao_prefix, tieu_tuong_prefix = facts.moving_line_citation_prefixes
        sec2_citations = extract_citations(sec2)
        has_hao_tu = any(c.startswith(hao_prefix) and c in facts.valid_citations for c in sec2_citations)
        has_tieu_tuong = any(c.startswith(tieu_tuong_prefix) and c in facts.valid_citations for c in sec2_citations)

        vigilance_req = facts.requires_vigilance_keyword
        vigilance_found = bool(VIGILANCE_KEYWORDS_REGEX.search(sec2))

        tags_ok = has_hao_tu and has_tieu_tuong
        vigilance_ok = (not vigilance_req) or vigilance_found

        r6_passed = tags_ok and vigilance_ok
        r6_details = {
            "has_hao_tu_tag": has_hao_tu,
            "has_tieu_tuong_tag": has_tieu_tuong,
            "vigilance_required": vigilance_req,
            "vigilance_found": vigilance_found,
            "expected_prefixes": [hao_prefix, tieu_tuong_prefix],
        }
    else:
        r6_details = {"error": "Không thể kiểm tra G5 do thiếu Mục 2"}

    checks.append({
        "rule_id": "R6_G5_VIGILANCE",
        "description": "Kiểm tra G5: Mục 2 chứa Hào từ/Tiểu tượng của hào động và từ khóa cảnh giác nếu hào từ hung",
        "passed": r6_passed,
        "details": r6_details,
    })

    # ----------------------------------------------------
    # Rule 7: G9 & Leak strings check
    # ----------------------------------------------------
    leak_detected: List[str] = []
    text_lower_nfc = normalize_nfc(norm_text).lower()
    for leak in facts.leak_strings:
        leak_clean = normalize_nfc(leak).strip()
        if len(leak_clean) >= 3 and leak_clean.lower() in text_lower_nfc:
            leak_detected.append(leak_clean)

    # Poem overlap check: 8+ consecutive words
    def get_words(t: str) -> List[str]:
        return re.findall(r"[\w]+", normalize_nfc(t).lower())

    md_words = get_words(norm_text)
    n = 8
    md_ngrams: Set[str] = set()
    if len(md_words) >= n:
        for i in range(len(md_words) - n + 1):
            md_ngrams.add(" ".join(md_words[i : i + n]))

    poem_overlaps: List[str] = []
    if md_ngrams and facts.poem_texts:
        poem_sources = list(facts.poem_texts) + [" ".join(facts.poem_texts)]
        for poem_line in poem_sources:
            p_words = get_words(poem_line)
            if len(p_words) >= n:
                for i in range(len(p_words) - n + 1):
                    ngram = " ".join(p_words[i : i + n])
                    if ngram in md_ngrams:
                        poem_overlaps.append(ngram)

    r7_passed = (len(leak_detected) == 0 and len(poem_overlaps) == 0)
    checks.append({
        "rule_id": "R7_G9_LEAK_STRINGS",
        "description": "Chống rò rỉ dữ liệu (leak_strings) và chống sao chép bản dịch thơ (poem_texts)",
        "passed": r7_passed,
        "details": {
            "leak_strings_detected": leak_detected,
            "poem_overlaps_detected": poem_overlaps,
        },
    })

    # ----------------------------------------------------
    # Rule 8: Standard phrases count (G4)
    # ----------------------------------------------------
    r8_details: Dict[str, Any] = {}
    r8_ok = True

    c_rules = norm_text.count(STANDARD_PHRASE_RULES_EMPTY)
    if facts.rules_empty:
        if c_rules != 1:
            r8_ok = False
        r8_details["rules_empty_phrase"] = {"expected": 1, "actual": c_rules}
    else:
        if c_rules > 0:
            r8_ok = False
        r8_details["rules_empty_phrase"] = {"expected": 0, "actual": c_rules}

    c_topic = norm_text.count(STANDARD_PHRASE_TOPIC_FALLBACK)
    if facts.topic_fallback:
        if c_topic != 1:
            r8_ok = False
        r8_details["topic_fallback_phrase"] = {"expected": 1, "actual": c_topic}
    else:
        if c_topic > 0:
            r8_ok = False
        r8_details["topic_fallback_phrase"] = {"expected": 0, "actual": c_topic}

    checks.append({
        "rule_id": "R8_STANDARD_PHRASES",
        "description": "Kiểm tra số lần xuất hiện chính xác của các câu chuẩn định theo G4",
        "passed": r8_ok,
        "details": r8_details,
    })

    # ----------------------------------------------------
    # Rule 9: Stop reason check
    # ----------------------------------------------------
    r9_passed = (stop_reason != "max_tokens")
    checks.append({
        "rule_id": "R9_STOP_REASON",
        "description": "Kiểm tra lý do dừng sinh của LLM (không bị cắt cụt do max_tokens)",
        "passed": r9_passed,
        "details": {
            "stop_reason": stop_reason,
            "error": "Văn bản bị cắt cụt do chạm trần token (max_tokens)" if not r9_passed else None,
        },
    })

    overall_passed = all(c["passed"] for c in checks)
    return overall_passed, checks

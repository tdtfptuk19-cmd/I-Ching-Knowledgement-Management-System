#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ai_advice_validator.py - Post-Validation Guardrail Engine for AI Advice Layer.
Executes 9-10 deterministic checks on generated 3-5 bullet action advice.
"""
from __future__ import annotations

import re
from typing import Any, Dict, Final, FrozenSet, List, Optional, Tuple

from process_layer.app.engines.dich_su_facts import (
    Facts,
    normalize_nfc,
)
from process_layer.app.engines.dich_su_validator import (
    ALL_POLARITY_LABELS,
    FORBIDDEN_WORDS_PATTERNS,
    VALID_CITATION_PREFIXES,
    extract_citations,
)

SYSTEM_LEAK_PHRASES: Final[Tuple[str, ...]] = (
    "[VAI TRÒ]",
    "[RÀO CHẮN BẮT BUỘC]",
    "KMS GUARDRAILS",
    "systemInstruction",
    "<prompt>",
    "TẬP HỢP THẺ CĂN CỨ HỢP LỆ",
)

HEALTH_FINANCE_SAFETY_KEYWORDS: Final[re.Pattern] = re.compile(
    r"\b(chuyên gia|bác sĩ|tài chính|y tế|tham vấn|thực tế)\b",
    re.IGNORECASE,
)


def post_validation_advice(
    markdown_text: str,
    facts: Facts,
    stop_reason: str = "end_turn",
    topic: Optional[str] = None,
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Hậu kiểm toàn diện các rào chắn cho khối Lời khuyên Hành động từ AI (3–5 bullets).
    """
    norm_text = normalize_nfc(markdown_text).strip()
    checks: List[Dict[str, Any]] = []

    # 1. Format: đúng 3–5 dòng, mỗi dòng bắt đầu "- "
    raw_lines = [l.strip() for l in norm_text.splitlines() if l.strip()]
    bullet_lines = [l for l in raw_lines if l.startswith("- ") or l.startswith("-\t")]
    format_passed = (3 <= len(raw_lines) <= 5) and (len(bullet_lines) == len(raw_lines))
    checks.append({
        "rule_id": "CHECK_ADVICE_FORMAT",
        "description": "Đúng 3–5 gạch đầu dòng bắt đầu bằng '- '",
        "passed": format_passed,
        "details": {
            "total_lines": len(raw_lines),
            "bullet_lines_count": len(bullet_lines),
            "expected_range": "3-5",
        },
    })

    # 2. Citation validity: 100% thẻ căn cứ có tiền tố hợp lệ phải nằm trong facts.valid_citations
    all_citations = extract_citations(norm_text)
    invalid_citations = [c for c in all_citations if c not in facts.valid_citations]
    citation_validity_passed = (len(invalid_citations) == 0 and len(all_citations) > 0)
    checks.append({
        "rule_id": "CHECK_ADVICE_CITATION_VALIDITY",
        "description": "100% thẻ căn cứ xuất hiện phải nằm trong facts.valid_citations",
        "passed": citation_validity_passed,
        "details": {
            "total_citations": len(all_citations),
            "invalid_citations": invalid_citations,
        },
    })

    # 3. Citation density: Mỗi gạch đầu dòng phải có ít nhất 1 thẻ căn cứ hợp lệ
    bullets_without_citation: List[int] = []
    for idx, b_line in enumerate(bullet_lines):
        b_cits = extract_citations(b_line)
        valid_b_cits = [c for c in b_cits if c in facts.valid_citations]
        if not valid_b_cits:
            bullets_without_citation.append(idx + 1)

    density_passed = (len(bullets_without_citation) == 0) and (len(bullet_lines) > 0)
    checks.append({
        "rule_id": "CHECK_ADVICE_CITATION_DENSITY",
        "description": "Mỗi gạch đầu dòng phải chứa ít nhất 1 thẻ căn cứ hợp lệ",
        "passed": density_passed,
        "details": {
            "bullets_without_citation": bullets_without_citation,
        },
    })

    # 4. Forbidden words: Không chứa từ khẳng định tuyệt đối
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

    forbidden_passed = (len(forbidden_violations) == 0)
    checks.append({
        "rule_id": "CHECK_ADVICE_FORBIDDEN_WORDS",
        "description": "Không chứa các từ khẳng định tuyệt đối (G6)",
        "passed": forbidden_passed,
        "details": {"violations": forbidden_violations},
    })

    # 5. Label lock: Nếu chứa nhãn phân cực nào, phải trùng facts.polarity_label
    expected_label = normalize_nfc(facts.polarity_label).strip().upper()
    conflicting_labels = [
        lbl for lbl in ALL_POLARITY_LABELS
        if lbl != expected_label and lbl in norm_text.upper()
    ]
    label_lock_passed = (len(conflicting_labels) == 0)
    checks.append({
        "rule_id": "CHECK_ADVICE_LABEL_LOCK",
        "description": "Không được xuất hiện nhãn phân cực mâu thuẫn với facts.polarity_label",
        "passed": label_lock_passed,
        "details": {
            "expected_label": expected_label,
            "conflicting_labels": conflicting_labels,
        },
    })

    # 6. Leak strings: Không chứa case_id hay thông tin nhạy cảm
    leaks_found: List[str] = []
    for s in facts.leak_strings:
        if s and len(s) >= 4 and s.lower() in text_lower:
            leaks_found.append(s)
    leak_passed = (len(leaks_found) == 0)
    checks.append({
        "rule_id": "CHECK_ADVICE_LEAK_STRINGS",
        "description": "Không làm rò rỉ mã định danh nhạy cảm hoặc disclaimer trong nội dung",
        "passed": leak_passed,
        "details": {"leaks_found": leaks_found},
    })

    # 7. Length check: <= 1200 ký tự
    length_passed = (len(norm_text) <= 1200)
    checks.append({
        "rule_id": "CHECK_ADVICE_LENGTH",
        "description": "Độ dài nội dung không vượt quá 1200 ký tự",
        "passed": length_passed,
        "details": {"actual_length": len(norm_text), "max_length": 1200},
    })

    # 8. Prompt injection: Không lặp lại chỉ dẫn hệ thống
    injection_violations = [p for p in SYSTEM_LEAK_PHRASES if p in norm_text]
    injection_passed = (len(injection_violations) == 0)
    checks.append({
        "rule_id": "CHECK_ADVICE_PROMPT_INJECTION",
        "description": "Không để lộ các chỉ dẫn hệ thống hoặc prompt nội bộ",
        "passed": injection_passed,
        "details": {"violations": injection_violations},
    })

    # 9. Stop reason: Không bị cắt cụt do max_tokens hoặc safety
    stop_reason_passed = stop_reason not in ("max_tokens", "safety")
    checks.append({
        "rule_id": "CHECK_ADVICE_STOP_REASON",
        "description": "LLM kết thúc bình thường (không bị ngắt bởi max_tokens hoặc safety)",
        "passed": stop_reason_passed,
        "details": {"stop_reason": stop_reason},
    })

    # 10. Safety note check (nếu chủ đề là HEALTH hoặc FINANCE)
    topic_clean = (topic or "").strip().upper()
    if topic_clean in ("HEALTH", "FINANCE"):
        has_safety = bool(HEALTH_FINANCE_SAFETY_KEYWORDS.search(norm_text))
        checks.append({
            "rule_id": "CHECK_ADVICE_SAFETY_NOTE",
            "description": f"Chủ đề nhạy cảm {topic_clean} cần có câu nhắc tham vấn chuyên gia",
            "passed": has_safety,
            "details": {"topic": topic_clean, "has_safety_keyword": has_safety},
        })

    all_passed = all(c["passed"] for c in checks)
    return all_passed, checks

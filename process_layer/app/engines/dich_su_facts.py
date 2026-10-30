#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dich_su_facts.py - Input Preprocessing & Facts Dataclass for Mai Hoa Dịch Số LLM Assistant.

This module is responsible for:
1. Deeply immutable Facts dataclass with defensive conversions and Unicode NFC normalization.
2. Filtering classic texts to strictly include only initial hexagram and moving line texts.
3. Extracting poetic translations (poem_texts) for G9 guardrail verification.
4. Extracting sensitive identifiers into leak_strings for quarantine and leak detection.
5. Accurately resolving Thể and Dụng trigrams based on dung_side and initial_hexagram.
6. Generating all valid citation tags adhering to 8 canonical prefixes.
7. Formatting deterministic user message matching Appendix B template.
"""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any, Dict, Final, FrozenSet, List, Optional, Tuple
import unicodedata

from process_layer.app.core.errors import ValidationError as BaseValidationError

# Standard deterministic phrases per Post-validation Rule 8 & G4
STANDARD_PHRASE_RULES_EMPTY: Final[str] = (
    "Chưa có luật chuyên gia nào được kích hoạt cho quẻ này."
)
STANDARD_PHRASE_TOPIC_FALLBACK: Final[str] = (
    "Lưu ý: luận giải theo chủ đề cụ thể đang chờ phê duyệt nên bản luận mang tính khái quát."
)

# Regex pattern for hung sentiment indicators in Vietnamese texts
HUNG_REGEX: Final[re.Pattern] = re.compile(
    r"\b(hung|hung tai|lận|tiểu lận|hối lận|tai ương|tai họa|nguy hại|ngộ độc)\b",
    re.IGNORECASE,
)

# Chinese characters indicating adverse or hung sentiment
HUNG_HAN_CHARS: Final[Tuple[str, ...]] = ("凶", "吝", "厲")

# =====================================================================
# BÁT QUÁI VẠN VẬT LOẠI TƯỢNG (TRIGRAM ONTOLOGY) - MAI HOA DỊCH SỐ (THIỆU UNG)
# =====================================================================
TRIGRAM_ONTOLOGY: Final[Dict[str, Dict[str, str]]] = {
    "CÀN": {
        "name_vn": "Càn",
        "symbol": "Trời (Thiên)",
        "element": "Kim",
        "nature": "Cương kiện, mạnh mẽ, chủ động, sáng tạo nguyên sơ",
        "domain_meaning": "Lãnh đạo, người đứng đầu, cơ quan cấp trên, trung tâm điều hành, vốn lớn, tài sản quy mô, chiến lược vĩ mô",
    },
    "ĐOÀI": {
        "name_vn": "Đoài",
        "symbol": "Đầm (Trạch)",
        "element": "Kim",
        "nature": "Duyệt dã (vui vẻ), hòa nhã, cởi mở, hướng ngoại",
        "domain_meaning": "Đàm phán, thương thảo, thuyết phục, giao thiệp đối tác, phát ngôn, tiếp thị, thỏa hiệp, lưu tâm chỗ khuyết thiếu",
    },
    "LY": {
        "name_vn": "Ly",
        "symbol": "Lửa (Hỏa)",
        "element": "Hỏa",
        "nature": "Lệ dã (sáng rõ), văn minh, bám dính, nhiệt huyết",
        "domain_meaning": "Văn thư, hợp đồng, pháp lý, thương hiệu, danh tiếng, truyền thông, sự minh bạch, sự thật phơi bày",
    },
    "CHẤN": {
        "name_vn": "Chấn",
        "symbol": "Sấm (Lôi)",
        "element": "Mộc",
        "nature": "Động dã (khởi phát), biến động nhanh, bứt phá, dứt khoát",
        "domain_meaning": "Khởi nghiệp, ra mắt dự án mới, hành động tiên phong, thay đổi đột ngột, tốc độ thực thi, xung lực tăng trưởng",
    },
    "TỐN": {
        "name_vn": "Tốn",
        "symbol": "Gió/Cây (Phong)",
        "element": "Mộc",
        "nature": "Nhập dã (thẩm thấu), uyển chuyển, lan tỏa, hòa nhập",
        "domain_meaning": "Thương mại, lưu thông hàng hóa, cơ hội trung gian, mạng lưới quan hệ, tiếp cận thị trường ngách, tránh do dự",
    },
    "KHẢM": {
        "name_vn": "Khảm",
        "symbol": "Nước (Thủy)",
        "element": "Thủy",
        "nature": "Hãm dã (hiểm trở), sâu thẳm, linh hoạt, biến ảo",
        "domain_meaning": "Dòng tiền lưu chuyển, mưu lược ngầm, bí mật kinh doanh, biến số khó lường, rủi ro thanh khoản, thử thách chông gai",
    },
    "CẤN": {
        "name_vn": "Cấn",
        "symbol": "Núi (Sơn)",
        "element": "Thổ",
        "nature": "Chỉ dã (ngưng nghỉ), tích lũy nội lực, kiên định, tĩnh lặng",
        "domain_meaning": "Tích lũy nội lực, án binh bất động, rào cản hành chính, phòng thủ kiên cố, bảo tồn tài sản, hạn chế mở rộng mạo hiểm",
    },
    "KHÔN": {
        "name_vn": "Khôn",
        "symbol": "Đất (Địa)",
        "element": "Thổ",
        "nature": "Thuận dã (nhu thuận), nuôi dưỡng, hậu thuẫn, nền tảng, bao dung",
        "domain_meaning": "Hậu thuẫn vững chắc, đất đai cơ sở hạ tầng, thị trường đại chúng, quản trị nhân sự, tích lũy âm thầm, phục vụ khách hàng",
    },
}


def get_trigram_key(name: Optional[str]) -> str:
    """Chuẩn hóa tên quẻ đơn thành khóa tra cứu Ontology (ví dụ 'Càn' -> 'CÀN')."""
    if not name:
        return ""
    norm = normalize_nfc(name).strip().upper()
    for k in TRIGRAM_ONTOLOGY:
        if k in norm or norm in k:
            return k
    return norm


class FactsValidationError(BaseValidationError, ValueError):
    """
    Validation error for facts preprocessor.
    Inherits from both BaseValidationError (status_code=422) and ValueError
    for seamless compatibility across API layers and standard error handling.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 422,
        details: Optional[Dict[str, Any]] = None,
    ):
        BaseValidationError.__init__(self, message=message, details=details)
        self.status_code = status_code


# Expose ValidationError alias
ValidationError = FactsValidationError


def normalize_nfc(text: Optional[str]) -> str:
    """Normalize string to Unicode NFC format."""
    if not text:
        return ""
    return unicodedata.normalize("NFC", text)


@dataclass(frozen=True, slots=True)
class Facts:
    """
    Deeply immutable dataclass carrying deterministic facts for LLM prompting and post-validation.
    """

    user_message: str
    valid_citations: frozenset[str]
    polarity_label: str
    moving_line: int
    poem_texts: tuple[str, ...]
    leak_strings: tuple[str, ...]
    rules_empty: bool
    topic_fallback: bool
    hao_tu_is_hung: bool

    def __post_init__(self) -> None:
        # Defensive conversions to guarantee immutability
        if not isinstance(self.valid_citations, frozenset):
            object.__setattr__(self, "valid_citations", frozenset(self.valid_citations))
        if not isinstance(self.poem_texts, tuple):
            object.__setattr__(self, "poem_texts", tuple(self.poem_texts))
        if not isinstance(self.leak_strings, tuple):
            object.__setattr__(self, "leak_strings", tuple(self.leak_strings))

        # Enforce moving_line boundaries
        if not isinstance(self.moving_line, int) or not (1 <= self.moving_line <= 6):
            raise ValueError(f"moving_line must be an integer between 1 and 6, got {self.moving_line!r}")

        # Unicode NFC normalization for all string fields and collection contents (R5)
        object.__setattr__(self, "user_message", normalize_nfc(self.user_message))
        object.__setattr__(self, "polarity_label", normalize_nfc(self.polarity_label))
        object.__setattr__(
            self,
            "valid_citations",
            frozenset(normalize_nfc(c.strip()) for c in self.valid_citations if c and c.strip()),
        )
        object.__setattr__(
            self,
            "poem_texts",
            tuple(normalize_nfc(p.strip()) for p in self.poem_texts if p and p.strip()),
        )
        object.__setattr__(
            self,
            "leak_strings",
            tuple(normalize_nfc(s.strip()) for s in self.leak_strings if s and s.strip()),
        )

    @property
    def is_hung(self) -> bool:
        """Returns True if the overall synthesis polarity label is Hung."""
        return self.polarity_label in {"TIỂU HUNG", "ĐẠI HUNG"}

    @property
    def requires_vigilance_keyword(self) -> bool:
        """
        Guardrail G5 check: If moving line is Hung while overall synthesis is non-Hung,
        Section 2 MUST contain vigilance keywords (cảnh giác, thận trọng, lưu tâm).
        """
        return self.hao_tu_is_hung and not self.is_hung

    @property
    def expected_label_line(self) -> str:
        """Returns the mandatory line 1 of Section 1 per Post-validation Rule 2."""
        return f"**Kết luận tổng hợp: {self.polarity_label}**"

    @property
    def required_standard_phrases(self) -> tuple[str, ...]:
        """Returns deterministic standard phrases required per Post-validation Rule 8."""
        phrases: list[str] = []
        if self.rules_empty:
            phrases.append(STANDARD_PHRASE_RULES_EMPTY)
        if self.topic_fallback:
            phrases.append(STANDARD_PHRASE_TOPIC_FALLBACK)
        return tuple(phrases)

    @property
    def moving_line_citation_prefixes(self) -> tuple[str, str]:
        """Prefixes for required moving line citations in Section 2 per Post-validation Rule 6."""
        return (
            f"[Hào từ {self.moving_line},",
            f"[Tiểu tượng {self.moving_line},",
        )


def determine_hao_tu_is_hung(
    moving_texts: list[dict], five_element_analysis: Optional[list[dict]] = None
) -> bool:
    """
    Determine whether moving line text or sentiment carries Hung indicators.
    Scans text_han for Chinese characters (凶, 吝, 厲) and text_vn for keywords.
    """
    for t in moving_texts:
        han = t.get("text_han") or ""
        if any(c in han for c in HUNG_HAN_CHARS):
            return True
        vn = t.get("text_vn") or ""
        vn_norm = normalize_nfc(vn)
        if HUNG_REGEX.search(vn_norm):
            return True
    return False


def build_facts(
    divination_payload: dict,
    user_question: Optional[str] = None,
    user_level: Optional[str] = None,
) -> Facts:
    """
    Build deeply immutable Facts dataclass from divination response payload.

    Args:
        divination_payload: Output dictionary from rule & synthesis engines.
        user_question: Optional user query string (max 500 characters).
        user_level: Optional user expertise level (BEGINNER, INTERMEDIATE, EXPERT).

    Returns:
        Facts instance ready for LLM prompt construction and post-validation.

    Raises:
        FactsValidationError: If user_question > 500 characters or user_level is invalid.
        ValueError: If payload data is malformed (e.g. invalid moving_line).
    """
    # 1. Validate and sanitize user_question (G8 prompt injection defense)
    if user_question is not None:
        if len(user_question) > 500:
            raise FactsValidationError(
                f"user_question vượt quá giới hạn 500 ký tự (422): độ dài hiện tại {len(user_question)}",
                status_code=422,
                details={"field": "user_question", "max_length": 500, "actual_length": len(user_question)},
            )
        uq_sanitized = normalize_nfc(user_question).strip()
        uq_sanitized = uq_sanitized.replace('"""', '\\"\\"\\"')
    else:
        uq_sanitized = ""

    # 2. Resolve user_level with priority: argument > payload casting_meta > INTERMEDIATE
    allowed_levels: Final[set[str]] = {"BEGINNER", "INTERMEDIATE", "EXPERT", "NOVICE", "PRACTITIONER"}
    if user_level is not None and str(user_level).strip() != "":
        raw_lvl = str(user_level).strip().upper()
        if raw_lvl not in allowed_levels:
            raise FactsValidationError(
                f"user_level không hợp lệ (422): {user_level}",
                status_code=422,
                details={"allowed": ["BEGINNER", "INTERMEDIATE", "EXPERT"]},
            )
        candidate_lvl = raw_lvl
    else:
        candidate_lvl = (
            divination_payload.get("casting_meta", {}).get("user_level") or "INTERMEDIATE"
        )

    candidate_lvl = str(candidate_lvl).strip().upper()
    if candidate_lvl == "NOVICE":
        resolved_level = "BEGINNER"
    elif candidate_lvl == "PRACTITIONER":
        resolved_level = "INTERMEDIATE"
    elif candidate_lvl in {"BEGINNER", "INTERMEDIATE", "EXPERT"}:
        resolved_level = candidate_lvl
    else:
        resolved_level = "INTERMEDIATE"

    # 3. Resolve Thể and Dụng trigrams
    moving_line = divination_payload.get("moving_line")
    if moving_line is None or not isinstance(moving_line, int) or not (1 <= moving_line <= 6):
        raise ValueError(f"moving_line không hợp lệ trong divination_payload: {moving_line!r}")

    dung_side = divination_payload.get("dung_side")
    if dung_side not in ("UPPER", "LOWER"):
        dung_side = "UPPER" if moving_line >= 4 else "LOWER"

    init_hex = divination_payload.get("initial_hexagram", {})
    upper_tri = init_hex.get("upper_trigram", {})
    lower_tri = init_hex.get("lower_trigram", {})

    if dung_side == "UPPER":
        dung_tri = upper_tri
        the_tri = lower_tri
        dung_side_vn = "Thượng quái"
        the_side_vn = "Hạ quái"
    else:
        dung_tri = lower_tri
        the_tri = upper_tri
        dung_side_vn = "Hạ quái"
        the_side_vn = "Thượng quái"

    the_element = divination_payload.get("the_element") or the_tri.get("five_element", "")
    dung_element = divination_payload.get("dung_element") or dung_tri.get("five_element", "")

    # 4. Five Element relationships
    five_analysis = divination_payload.get("five_element_analysis", [])
    pairs_map = {
        p.get("pair"): p for p in five_analysis if isinstance(p, dict) and "pair" in p
    }

    p_main = pairs_map.get("THE_DUNG_MAIN", {})
    p_unuc = pairs_map.get("THE_UPPER_NUCLEAR", {})
    p_lnuc = pairs_map.get("THE_LOWER_NUCLEAR", {})
    p_trans = pairs_map.get("THE_TRANSFORMED_DUNG", {})

    nuc_hex = divination_payload.get("nuclear_hexagram", {})
    trans_hex = divination_payload.get("transformed_hexagram", {})
    trans_dung_tri = trans_hex.get(
        "upper_trigram" if dung_side == "UPPER" else "lower_trigram", {}
    )

    upper_nuclear_element = (
        p_unuc.get("target_element") or nuc_hex.get("upper_trigram", {}).get("five_element", "")
    )
    upper_nuclear_trigram_name = nuc_hex.get("upper_trigram", {}).get("name_vn", "")

    lower_nuclear_element = (
        p_lnuc.get("target_element") or nuc_hex.get("lower_trigram", {}).get("five_element", "")
    )
    lower_nuclear_trigram_name = nuc_hex.get("lower_trigram", {}).get("name_vn", "")

    transformed_dung_element = (
        p_trans.get("target_element") or trans_dung_tri.get("five_element", "")
    )
    transformed_dung_trigram_name = trans_dung_tri.get("name_vn", "")

    def clean_interp(text: Optional[str]) -> str:
        """Strip trailing period to prevent double periods in formatted output."""
        return (text or "").strip().rstrip(".")

    # 5. Filter classic texts & extract poem_texts
    init_hid = init_hex.get("hexagram_id")
    filtered_texts: dict[str, dict] = {}
    poem_texts: list[str] = []

    def parse_vn_am_and_poems(text_vn: Optional[str]) -> str:
        lines = (text_vn or "").split("\n")
        am_parts: list[str] = []
        in_poem = False
        for raw_line in lines:
            line = raw_line.strip()
            if not line:
                continue
            if in_poem:
                poem_texts.append(normalize_nfc(line))
            elif line.startswith("Dịch.") or line.startswith("Tượng rằng:"):
                in_poem = True
                rem = re.sub(
                    r"^(?:Dịch\.\s*(?:Tượng rằng:)?|Tượng rằng:)\s*", "", line
                ).strip()
                if rem:
                    poem_texts.append(normalize_nfc(rem))
            else:
                am_parts.append(line)
        return " ".join(am_parts).strip()

    for t in divination_payload.get("classic_texts", []):
        hid = t.get("hexagram_id")
        ttype = t.get("text_type")
        lpos = t.get("line_position")
        if hid == init_hid:
            if ttype in ("THOAN_TU", "THOAN_TRUYEN", "DAI_TUONG"):
                filtered_texts[ttype] = t
            elif ttype in ("HAO_TU", "TIEU_TUONG") and lpos == moving_line:
                filtered_texts[f"{ttype}_{lpos}"] = t

    t_thoan_tu = filtered_texts.get("THOAN_TU", {})
    t_thoan_truyen = filtered_texts.get("THOAN_TRUYEN", {})
    t_dai_tuong = filtered_texts.get("DAI_TUONG", {})
    t_hao_tu = filtered_texts.get(f"HAO_TU_{moving_line}", {})
    t_tieu_tuong = filtered_texts.get(f"TIEU_TUONG_{moving_line}", {})

    thoan_tu_vn_am = parse_vn_am_and_poems(t_thoan_tu.get("text_vn"))
    thoan_truyen_vn_am = parse_vn_am_and_poems(t_thoan_truyen.get("text_vn"))
    dai_tuong_vn_am = parse_vn_am_and_poems(t_dai_tuong.get("text_vn"))
    hao_tu_vn_am = parse_vn_am_and_poems(t_hao_tu.get("text_vn"))
    tieu_tuong_vn_am = parse_vn_am_and_poems(t_tieu_tuong.get("text_vn"))

    # 6. Generate valid citations
    citations: list[str] = [
        normalize_nfc("[Ngũ hành·THE_DUNG_MAIN]"),
        normalize_nfc("[Ngũ hành·THE_UPPER_NUCLEAR]"),
        normalize_nfc("[Ngũ hành·THE_LOWER_NUCLEAR]"),
        normalize_nfc("[Ngũ hành·THE_TRANSFORMED_DUNG]"),
    ]

    the_key = get_trigram_key(the_tri.get("name_vn"))
    dung_key = get_trigram_key(dung_tri.get("name_vn"))
    trans_dung_key = get_trigram_key(trans_dung_tri.get("name_vn"))
    unuc_key = get_trigram_key(upper_nuclear_trigram_name)
    lnuc_key = get_trigram_key(lower_nuclear_trigram_name)

    for k in (the_key, dung_key, trans_dung_key, unuc_key, lnuc_key):
        if k and k in TRIGRAM_ONTOLOGY:
            tag = normalize_nfc(f"[Tượng·{k}]")
            if tag not in citations:
                citations.append(tag)

    if t_thoan_tu.get("source_ref"):
        citations.append(normalize_nfc(f"[Thoán từ, {t_thoan_tu['source_ref']}]"))
    if t_thoan_truyen.get("source_ref"):
        citations.append(normalize_nfc(f"[Thoán truyện, {t_thoan_truyen['source_ref']}]"))
    if t_dai_tuong.get("source_ref"):
        citations.append(normalize_nfc(f"[Đại tượng, {t_dai_tuong['source_ref']}]"))
    if t_hao_tu.get("source_ref"):
        citations.append(normalize_nfc(f"[Hào từ {moving_line}, {t_hao_tu['source_ref']}]"))
    if t_tieu_tuong.get("source_ref"):
        citations.append(normalize_nfc(f"[Tiểu tượng {moving_line}, {t_tieu_tuong['source_ref']}]"))

    # Synthesis & summary citation
    synthesis = divination_payload.get("synthesis", {})
    polarity_label = normalize_nfc(synthesis.get("polarity_label", "BÌNH HÒA"))
    summary_tag = ""
    for ab in synthesis.get("advice_blocks", []):
        rref = ab.get("provenance", {}).get("rule_ref")
        if rref:
            stag = normalize_nfc(f"[Tổng hợp·{rref}]")
            citations.append(stag)
            summary_tag = f"Thẻ căn cứ: {stag}"
            break

    # Rules fired
    rules_fired = divination_payload.get("rules_fired", [])
    rules_empty = len(rules_fired) == 0
    if not rules_empty:
        rule_lines: list[str] = []
        for rf in rules_fired:
            rcode = rf.get("rule_code", "")
            concl = rf.get("conclusion", "")
            rtag = normalize_nfc(f"[Luật·{rcode}]")
            citations.append(rtag)
            rule_lines.append(f"- Luật {rcode}: {concl}. Thẻ căn cứ: {rtag}")
        rules_section = "\n".join(rule_lines)
    else:
        rules_section = STANDARD_PHRASE_RULES_EMPTY

    # Coverage and Topic Fallback
    coverage = divination_payload.get("coverage", {})
    topic_fallback = bool(coverage.get("fallback_applied", False))
    coverage_note = coverage.get("message", "")

    # Interpretations
    interpretations = divination_payload.get("interpretations", [])
    if interpretations:
        interp_lines = [
            f"- {i.get('content') or i.get('summary', '')}" for i in interpretations
        ]
        interpretations_section = "\n".join(interp_lines)
    elif topic_fallback:
        interpretations_section = STANDARD_PHRASE_TOPIC_FALLBACK
    else:
        interpretations_section = "Không có diễn giải chuyên đề."

    # 7. Collect leak strings (sensitive identifiers quarantine)
    case_id = divination_payload.get("case_id")
    user_hash = (
        (divination_payload.get("casting_meta") or {}).get("pseudonymized_user_hash")
        or divination_payload.get("pseudonymized_user_hash")
    )
    disclaimer = divination_payload.get("disclaimer")
    raw_leak_candidates = [case_id, user_hash, disclaimer]
    leak_strings = tuple(
        normalize_nfc(str(s).strip())
        for s in raw_leak_candidates
        if s is not None and str(s).strip() != ""
    )

    # 8. Determine hao_tu_is_hung
    moving_line_texts = [t for t in (t_hao_tu, t_tieu_tuong) if t]
    hao_tu_is_hung = determine_hao_tu_is_hung(moving_line_texts, five_analysis)

    # 9. Format Appendix B User Message
    casting_meta = divination_payload.get("casting_meta") or {}
    lunar_meta = casting_meta.get("lunar_meta") or {}
    solar_dt = casting_meta.get("solar_datetime") or lunar_meta.get("solar_datetime") or ""
    lunar_day = lunar_meta.get("lunar_day", "")
    lunar_month = lunar_meta.get("lunar_month", "")
    can_chi_year = lunar_meta.get("can_chi_year", "")
    hour_branch_name = lunar_meta.get("hour_branch_name", "")

    if lunar_day and lunar_month:
        time_display = f"{solar_dt} (Âm lịch: Ngày {lunar_day} Tháng {lunar_month} Năm {can_chi_year}, Giờ {hour_branch_name})".strip()
    elif solar_dt:
        time_display = f"{solar_dt}"
    else:
        time_display = "Chiêm đoán theo số (Mai Hoa Dịch Số)"

    valid_citations_fset = frozenset(citations)
    valid_citations_list = "\n".join(f"- {c}" for c in sorted(valid_citations_fset))

    p_concl = clean_interp(synthesis.get("primary_conclusion"))
    summary_sentence = (
        f"{p_concl}. {summary_tag}".strip() if summary_tag else f"{p_concl}."
    )

    trigram_lines: list[str] = []
    seen_trigram_keys: set[str] = set()
    for role, k in [
        (f"Thể quái ({the_side_vn})", the_key),
        (f"Dụng quái ({dung_side_vn})", dung_key),
        ("Thượng Hỗ", unuc_key),
        ("Hạ Hỗ", lnuc_key),
        ("Biến Dụng quái", trans_dung_key),
    ]:
        if k and k in TRIGRAM_ONTOLOGY and k not in seen_trigram_keys:
            seen_trigram_keys.add(k)
            ont = TRIGRAM_ONTOLOGY[k]
            tag = normalize_nfc(f"[Tượng·{k}]")
            trigram_lines.append(
                f"- Quái {ont['name_vn']} ({ont['symbol']} - Hành {ont['element']}) [{role}]: "
                f"Bản chất: {ont['nature']}. Tượng trưng chuyên đề: {ont['domain_meaning']}. Thẻ căn cứ: {tag}"
            )
    trigram_section = "\n".join(trigram_lines) if trigram_lines else "Không có dữ kiện tượng quái."

    user_message = f"""DƯỚI ĐÂY LÀ DỮ KIỆN TẤT ĐỊNH ĐÃ ĐƯỢC RULE ENGINE VÀ SYNTHESIS ENGINE TÍNH TOÁN:

1. THÔNG TIN QUẺ VÀ THỜI ĐIỂM:
- Thời điểm gieo: {time_display}
- Quẻ Chủ: {init_hex.get('name_vn')} (ID: {init_hex.get('hexagram_id')}, Tượng: {init_hex.get('upper_trigram', {}).get('nature_symbol')} trên {init_hex.get('lower_trigram', {}).get('nature_symbol')})
- Quẻ Hỗ: {nuc_hex.get('name_vn')} (ID: {nuc_hex.get('hexagram_id')}, Tượng: {nuc_hex.get('upper_trigram', {}).get('nature_symbol')} trên {nuc_hex.get('lower_trigram', {}).get('nature_symbol')})
- Quẻ Biến: {trans_hex.get('name_vn')} (ID: {trans_hex.get('hexagram_id')}, Tượng: {trans_hex.get('upper_trigram', {}).get('nature_symbol')} trên {trans_hex.get('lower_trigram', {}).get('nature_symbol')})
- Hào động: Hào {moving_line} (ở {dung_side_vn})
- Cấp độ người dùng: {resolved_level}

2. THỂ DỤNG VÀ QUAN HỆ NGŨ HÀNH:
- Phân định: Dụng quái ở {dung_side_vn} ({dung_tri.get('name_vn')} - {dung_element}), Thể quái ở {the_side_vn} ({the_tri.get('name_vn')} - {the_element}).
- Quẻ Chủ: Thể {the_element}, Dụng {dung_element} -> {p_main.get('relation_type')} (trọng số: {p_main.get('polarity_weight')})
  Diễn giải: {clean_interp(p_main.get('interpretation'))}. Thẻ căn cứ: [Ngũ hành·THE_DUNG_MAIN]
- Quẻ Hỗ - Thượng Hỗ: Thể {the_element}, Dụng {upper_nuclear_element} ({upper_nuclear_trigram_name}) -> {p_unuc.get('relation_type')} (trọng số: {p_unuc.get('polarity_weight')})
  Diễn giải: {clean_interp(p_unuc.get('interpretation'))}. Thẻ căn cứ: [Ngũ hành·THE_UPPER_NUCLEAR]
- Quẻ Hỗ - Hạ Hỗ: Thể {the_element}, Dụng {lower_nuclear_element} ({lower_nuclear_trigram_name}) -> {p_lnuc.get('relation_type')} (trọng số: {p_lnuc.get('polarity_weight')})
  Diễn giải: {clean_interp(p_lnuc.get('interpretation'))}. Thẻ căn cứ: [Ngũ hành·THE_LOWER_NUCLEAR]
- Quẻ Biến: Thể {the_element}, Dụng {transformed_dung_element} ({transformed_dung_trigram_name}) -> {p_trans.get('relation_type')} (trọng số: {p_trans.get('polarity_weight')})
  Diễn giải: {clean_interp(p_trans.get('interpretation'))}. Thẻ căn cứ: [Ngũ hành·THE_TRANSFORMED_DUNG]

3. KẾT LUẬN TỔNG HỢP (TẤT ĐỊNH):
- Điểm tổng hợp: {synthesis.get('score')} (chuẩn hóa: {synthesis.get('normalized_score')})
- Nhãn phân cực: {polarity_label}
- Kết luận sơ bộ: {summary_sentence}
- Ghi chú độ phủ (Coverage): {coverage_note}

4. LUẬT CHUYÊN GIA ĐÃ KÍCH HOẠT:
{rules_section}

5. DIỄN GIẢI CHUYÊN ĐỀ ĐÃ PHÊ DUYỆT:
{interpretations_section}

6. KINH VĂN QUẺ CHỦ (CHỈ CUNG CẤP CỦA QUẺ CHỦ):
- Thoán từ: {t_thoan_tu.get('text_han')} ({thoan_tu_vn_am}) Thẻ căn cứ: [Thoán từ, {t_thoan_tu.get('source_ref')}]
- Thoán truyện: {t_thoan_truyen.get('text_han')} ({thoan_truyen_vn_am}) Thẻ căn cứ: [Thoán truyện, {t_thoan_truyen.get('source_ref')}]
- Đại tượng: {t_dai_tuong.get('text_han')} ({dai_tuong_vn_am}) Thẻ căn cứ: [Đại tượng, {t_dai_tuong.get('source_ref')}]
- Hào từ {moving_line}: {t_hao_tu.get('text_han')} ({hao_tu_vn_am}) Thẻ căn cứ: [Hào từ {moving_line}, {t_hao_tu.get('source_ref')}]
- Tiểu tượng {moving_line}: {t_tieu_tuong.get('text_han')} ({tieu_tuong_vn_am}) Thẻ căn cứ: [Tiểu tượng {moving_line}, {t_tieu_tuong.get('source_ref')}]
(Lưu ý: Quẻ Hỗ và Quẻ Biến không có kinh văn).

7. BÁT QUÁI LOẠI TƯỢNG XÁC THỰC (DỮ KIỆN TƯỢNG QUÁI):
{trigram_section}

8. TẬP HỢP THẺ CĂN CỨ HỢP LỆ (VALID CITATIONS):
{valid_citations_list}

CÂU HỎI CỦA NGƯỜI DÙNG:
\"\"\"
{uq_sanitized}
\"\"\""""

    return Facts(
        user_message=normalize_nfc(user_message),
        valid_citations=valid_citations_fset,
        polarity_label=polarity_label,
        moving_line=moving_line,
        poem_texts=tuple(poem_texts),
        leak_strings=leak_strings,
        rules_empty=rules_empty,
        topic_fallback=topic_fallback,
        hao_tu_is_hung=hao_tu_is_hung,
    )

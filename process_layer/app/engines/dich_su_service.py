#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dich_su_service.py - Trợ lý Dịch sư Service Orchestrator, Post-Validation & Fallback.

This module provides:
1. `build_fallback_interpretation(facts: Facts) -> str`:
   Deterministic 3-section markdown generator guaranteed to pass 100% of post-validation checks.
   Never includes the disclaimer string or forbidden words in the markdown body.
2. `DichSuService`:
   Orchestrates prompt loading, facts generation, LLM communication, retry with exponential
   backoff, global deadline enforcement (45s), post-validation, single repair attempt,
   and deterministic fallback.
"""

from __future__ import annotations

import logging
from pathlib import Path
import re
import time
from typing import Any, Dict, FrozenSet, List, Optional, Tuple
import unicodedata

from process_layer.app.core.config import settings
from process_layer.app.core.prompts import load_dich_su_system_prompt
from process_layer.app.engines.dich_su_facts import (
    Facts,
    build_facts,
    STANDARD_PHRASE_RULES_EMPTY,
    STANDARD_PHRASE_TOPIC_FALLBACK,
    normalize_nfc,
)
from process_layer.app.engines.dich_su_validator import post_validation
from process_layer.app.engines.llm_client import (
    LLMClient,
    get_llm_client,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Helpers for Fallback Generation
# ============================================================================

def _sanitize_forbidden_words(text: str) -> str:
    """
    Tẩy rửa hoặc thay thế các cấu trúc từ ngữ khẳng định tuyệt đối (G6) trong văn bản đầu vào.
    Bảo tồn cấu trúc phủ định hợp lệ như 'không chắc chắn', 'chưa chắc chắn', 'khó chắc chắn'.
    """
    if not text:
        return ""
    t = normalize_nfc(text)
    # Thay thế "chắc chắn" nếu không có tiền tố phủ định
    t = re.sub(
        r"(?:(\b(?:không|chưa|khó))\s+)?\bchắc chắn\b",
        lambda m: m.group(0) if m.group(1) else "rõ rệt",
        t,
        flags=re.IGNORECASE,
    )
    t = re.sub(r"\btất sẽ\b", "sẽ", t, flags=re.IGNORECASE)
    t = re.sub(r"\bchắc 100%(?!\w)", "nhiều khả năng", t, flags=re.IGNORECASE)
    t = re.sub(r"\bnhất định\s+sẽ\b", "có xu hướng", t, flags=re.IGNORECASE)
    t = re.sub(r"\bnhất định\s+phải\b", "nên", t, flags=re.IGNORECASE)
    t = re.sub(r"\bnhất định\s+thành\b", "có cơ hội thành", t, flags=re.IGNORECASE)
    t = re.sub(r"\bnhất định\s+xảy ra\b", "có thể xảy ra", t, flags=re.IGNORECASE)
    t = re.sub(r"\bnhất định\b", "kiên định", t, flags=re.IGNORECASE)
    return t


def _extract_pair_info(user_message: str, pair_code: str) -> str:
    """Trích xuất chuỗi diễn giải quan hệ ngũ hành của cặp Thể Dụng từ user_message."""
    pattern = rf"Diễn giải:\s*(.*?)\.\s*Thẻ căn cứ:\s*\[Ngũ hành·{pair_code}\]"
    m = re.search(pattern, user_message)
    if m:
        return _sanitize_forbidden_words(m.group(1).strip().rstrip("."))
    return "Quan hệ ngũ hành theo thế quẻ Thể Dụng"


def extract_valid_citations_list(text: str, valid_citations: FrozenSet[str]) -> List[str]:
    """Trích xuất danh sách các thẻ căn cứ hợp lệ xuất hiện trong văn bản markdown."""
    found: set[str] = set()
    norm_text = normalize_nfc(text)
    for bm in re.findall(r"\[([^\]]+)\]", norm_text):
        cleaned = re.sub(r"\s+", " ", bm).strip()
        full_tag = f"[{cleaned}]"
        if full_tag in valid_citations:
            found.add(full_tag)
    return sorted(found)


# ============================================================================
# Deterministic Fallback Generator
# ============================================================================

def build_fallback_interpretation(facts: Facts) -> str:
    """
    Sinh văn bản luận giải 3 mục tất định từ đối tượng Facts.

    BẢO ĐẢM TOÁN HỌC: Vượt qua 100% 9 rào chắn của post_validation.
    QUAN TRỌNG: Tuyệt đối không chứa chuỗi disclaimer hay các từ khẳng định tuyệt đối.
    """
    # ------------------ MỤC 1: TỔNG QUAN CƠ DUYÊN THỂ DỤNG ------------------
    sec1_lines = [f"**Kết luận tổng hợp: {facts.polarity_label}**"]

    # 1. Trích xuất kết luận sơ bộ từ user_message
    m_concl = re.search(r"- Kết luận sơ bộ:\s*(.+)", facts.user_message)
    summary_citations = [c for c in sorted(facts.valid_citations) if c.startswith("[Tổng hợp·")]
    summary_tag = summary_citations[0] if summary_citations else "[Ngũ hành·THE_DUNG_MAIN]"

    if m_concl:
        raw_concl = m_concl.group(1).strip()
        cleaned_concl = _sanitize_forbidden_words(raw_concl)
        # Bảo đảm có thẻ căn cứ hợp lệ
        if not any(c in cleaned_concl for c in facts.valid_citations):
            cleaned_concl = f"{cleaned_concl.rstrip('.')} {summary_tag}."
        sec1_lines.append(cleaned_concl)
    else:
        sec1_lines.append(
            f"Vận hội Thể Dụng tương ứng nhãn phân cực {facts.polarity_label}. {summary_tag}"
        )

    # 2. Câu chuẩn định (Rule 8) & Luật chuyên gia
    if facts.rules_empty:
        sec1_lines.append(STANDARD_PHRASE_RULES_EMPTY)
    else:
        # Trích xuất luật chuyên gia đã kích hoạt
        m_rules = re.search(
            r"4\. LUẬT CHUYÊN GIA ĐÃ KÍCH HOẠT:\n(.*?)(?=\n\s*5\. DIỄN GIẢI CHUYÊN ĐỀ)",
            facts.user_message,
            re.DOTALL,
        )
        if m_rules:
            rules_content = m_rules.group(1).strip()
            if rules_content and rules_content != STANDARD_PHRASE_RULES_EMPTY:
                sec1_lines.append(_sanitize_forbidden_words(rules_content))

    if facts.topic_fallback:
        sec1_lines.append(STANDARD_PHRASE_TOPIC_FALLBACK)

    sec1_text = "\n\n".join(sec1_lines)

    # ------------------ MỤC 2: QUÁ TRÌNH CHUYỂN HÓA ------------------
    interp_main = _extract_pair_info(facts.user_message, "THE_DUNG_MAIN")
    interp_unuc = _extract_pair_info(facts.user_message, "THE_UPPER_NUCLEAR")
    interp_lnuc = _extract_pair_info(facts.user_message, "THE_LOWER_NUCLEAR")
    interp_trans = _extract_pair_info(facts.user_message, "THE_TRANSFORMED_DUNG")

    sec2_parts: List[str] = []
    sec2_parts.append(
        f"- Quẻ Chủ (Khởi đầu Thể Dụng): {interp_main}. [Ngũ hành·THE_DUNG_MAIN]\n"
        f"- Quẻ Hỗ (Quá trình chuyển hóa giữa chừng):\n"
        f"  + Thượng Hỗ: {interp_unuc}. [Ngũ hành·THE_UPPER_NUCLEAR]\n"
        f"  + Hạ Hỗ: {interp_lnuc}. [Ngũ hành·THE_LOWER_NUCLEAR]\n"
        f"- Quẻ Biến (Kết quả quy tụ): {interp_trans}. [Ngũ hành·THE_TRANSFORMED_DUNG]"
    )

    # Hào từ và Tiểu tượng của hào động
    m_hao = re.search(rf"- Hào từ {facts.moving_line}:\s*(.+)", facts.user_message)
    m_tieu = re.search(rf"- Tiểu tượng {facts.moving_line}:\s*(.+)", facts.user_message)

    prefix_hao, prefix_tieu = facts.moving_line_citation_prefixes
    tag_hao = next((c for c in sorted(facts.valid_citations) if c.startswith(prefix_hao)), "")
    tag_tieu = next((c for c in sorted(facts.valid_citations) if c.startswith(prefix_tieu)), "")

    hao_text = m_hao.group(1).strip() if m_hao else f"Hào từ {facts.moving_line}. {tag_hao}"
    tieu_text = m_tieu.group(1).strip() if m_tieu else f"Tiểu tượng {facts.moving_line}. {tag_tieu}"

    hao_text = _sanitize_forbidden_words(hao_text)
    if tag_hao and tag_hao not in hao_text:
        hao_text = f"{hao_text.rstrip('.')} {tag_hao}"

    tieu_text = _sanitize_forbidden_words(tieu_text)
    if tag_tieu and tag_tieu not in tieu_text:
        tieu_text = f"{tieu_text.rstrip('.')} {tag_tieu}"

    sec2_parts.append(f"Kinh văn hào động ({facts.moving_line}):\n- {hao_text}\n- {tieu_text}")

    # G5 Vigilance keyword check
    if facts.requires_vigilance_keyword:
        sec2_parts.append(
            f"Về hào động, dù thế quẻ chung đạt mức {facts.polarity_label}, "
            f"hào từ mang ý nghĩa bất lợi là tín hiệu cảnh báo quan trọng. "
            f"Đương số cần giữ tâm thái thận trọng, nâng cao tinh thần cảnh giác và lưu tâm "
            f"đến từng chi tiết nhỏ nhằm phòng ngừa tai ương và giữ thế cân bằng."
        )

    sec2_text = "\n\n".join(sec2_parts)

    # ------------------ MỤC 3: CHIẾN LƯỢC TU THÂN & XU CÁT TỊ HUNG ------------------
    tag_b1 = next((c for c in sorted(facts.valid_citations) if c.startswith("[Đại tượng,")), None)
    if not tag_b1:
        tag_b1 = "[Ngũ hành·THE_DUNG_MAIN]"

    tag_b2 = next((c for c in sorted(facts.valid_citations) if c.startswith(prefix_hao)), None)
    if not tag_b2:
        tag_b2 = next(
            (c for c in sorted(facts.valid_citations) if c.startswith("[Ngũ hành·THE_UPPER_NUCLEAR]")),
            "[Ngũ hành·THE_DUNG_MAIN]",
        )

    tag_b3 = summary_tag if summary_tag else "[Ngũ hành·THE_TRANSFORMED_DUNG]"

    bullet_1 = (
        f"- Tu dưỡng tâm tính và tích đức hành thiện: Luôn giữ tâm niệm chính trực, lấy đức khiêm cung làm gốc "
        f"để thuận ứng thiên thời và chuyển hóa nghịch cảnh. {tag_b1}"
    )
    bullet_2 = (
        f"- Cẩn trọng trong hành vi và lời ăn tiếng nói: Quan sát thấu đáo thời thế, tránh hấp tấp hay cố chấp "
        f"khi đối diện trở ngại ngoại cảnh. {tag_b2}"
    )
    bullet_3 = (
        f"- Chiến lược hành động thuận theo quy luật sinh khắc: Nắm bắt thế cục Thể Dụng chuyển hóa, kiên định với "
        f"mục tiêu đường dài để gặt hái kết quả bền vững. {tag_b3}"
    )

    concluding_sentence = "Quẻ chỉ là tấm gương soi, vận mệnh nằm ở việc tu thân và hành động của chính mình."

    sec3_text = f"{bullet_1}\n{bullet_2}\n{bullet_3}\n\n{concluding_sentence}"

    # Ghép 3 mục chuẩn định
    markdown_output = (
        f"## 1. Tổng quan cơ duyên Thể Dụng\n"
        f"{sec1_text}\n\n"
        f"## 2. Quá trình chuyển hóa (Quẻ Hỗ → Quẻ Biến)\n"
        f"{sec2_text}\n\n"
        f"## 3. Chiến Lược Tu Thân & Xu Cát Tị Hung\n"
        f"{sec3_text}"
    )

    return normalize_nfc(markdown_output)


# ============================================================================
# DichSuService Orchestrator
# ============================================================================

class DichSuService:
    """
    Dịch vụ điều phối Trợ lý Dịch sư:
    - Nạp prompt hệ thống và xây dựng Facts bất biến.
    - Quản lý kết nối LLM với cơ chế retry lũy thừa (tối đa 2 lần).
    - Giám sát thời gian thực thi chạm ngưỡng deadline (45s).
    - Hậu kiểm văn bản theo 9 quy tắc an toàn.
    - Tự động kích hoạt chu trình sửa lỗi (1 lần) nếu vi phạm hậu kiểm.
    - Kích hoạt giải pháp dự phòng tất định (Fallback) khi có lỗi.
    """

    def __init__(
        self,
        client: Optional[LLMClient] = None,
        prompt_path: Optional[Path] = None,
    ):
        self.client = client
        self.prompt_path = prompt_path

    def _resolve_client(self) -> Optional[LLMClient]:
        """Xác định client LLM runtime thích hợp."""
        if self.client is not None:
            return self.client

        provider = getattr(settings, "LLM_PROVIDER", "fake").strip().lower()
        if provider == "anthropic":
            api_key = getattr(settings, "LLM_API_KEY", None)
            if not api_key:
                return None
            try:
                return get_llm_client(provider="anthropic", api_key=api_key)
            except Exception as exc:
                logger.warning("Không thể khởi tạo AnthropicClient: %s", exc)
                return None
        elif provider == "fake":
            try:
                return get_llm_client(provider="fake")
            except Exception as exc:
                logger.warning("Không thể khởi tạo FakeLLMClient: %s", exc)
                return None
        return None

    def interpret(
        self,
        payload: dict,
        user_question: Optional[str] = None,
        user_level: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Thực hiện toàn bộ quy trình luận giải:
        1. Xây dựng Facts & nạp System Prompt.
        2. Sinh lần 1 (với retry kết nối tối đa 2 lần).
        3. Hậu kiểm: nếu đạt -> trả về kết quả.
        4. Nếu không đạt -> sinh lần 2 (Repair) kèm danh sách vi phạm.
        5. Nếu vẫn không đạt hoặc có lỗi -> kích hoạt fallback tất định.
        """
        start_time = time.monotonic()
        total_deadline = float(getattr(settings, "LLM_TOTAL_DEADLINE_S", 45.0))

        # 1. Nạp system prompt và facts
        prompt_text, prompt_version = load_dich_su_system_prompt(self.prompt_path)
        facts = build_facts(payload, user_question=user_question, user_level=user_level)
        disclaimer = payload.get("disclaimer") or (
            "Kết quả suy luận mang tính chất tham khảo văn hóa, triết học và định hướng tư duy "
            "dựa trên hệ thống biểu tượng Kinh Dịch và Mai Hoa Dịch Số cổ truyền. "
            "Hệ thống không đưa ra khẳng định chắc chắn về tương lai."
        )

        # 2. Kiểm tra tính khả dụng của client
        resolved_client = self._resolve_client()
        if resolved_client is None:
            logger.info("LLM Client không khả dụng (hoặc thiếu API key), kích hoạt Fallback tất định.")
            fb_text = build_fallback_interpretation(facts)
            fb_passed, fb_checks = post_validation(fb_text, facts, stop_reason="end_turn")
            return {
                "markdown_text": fb_text,
                "citations": extract_valid_citations_list(fb_text, facts.valid_citations),
                "is_fallback": True,
                "validation_report": {"passed": fb_passed, "checks": fb_checks},
                "disclaimer": disclaimer,
                "prompt_version": prompt_version,
                "model": "deterministic-fallback",
                "attempts": 0,
            }

        client_model = getattr(resolved_client, "model", getattr(settings, "LLM_MODEL", "claude-3-5-sonnet-20241022"))
        attempts = 0

        # Helper gọi generate với retry kết nối (tối đa 2 lần với backoff lũy thừa)
        def _call_generate_with_retries(user_msg: str) -> Optional[Tuple[str, str]]:
            max_connection_retries = 2
            backoff_base = 0.5

            for retry_idx in range(max_connection_retries + 1):
                elapsed = time.monotonic() - start_time
                remaining = total_deadline - elapsed
                if remaining <= 0.2:
                    logger.warning("Đã chạm tổng hạn định deadline (%.1fs).", total_deadline)
                    return None

                call_timeout = min(float(getattr(settings, "LLM_TIMEOUT_S", 30.0)), remaining)
                try:
                    text, stop_reason = resolved_client.generate(
                        system=prompt_text,
                        user=user_msg,
                        temperature=float(getattr(settings, "LLM_TEMPERATURE", 0.3)),
                        max_tokens=int(getattr(settings, "LLM_MAX_TOKENS", 2000)),
                        timeout=call_timeout,
                    )
                    return text, stop_reason
                except (ConnectionError, TimeoutError, OSError) as exc:
                    logger.warning(
                        "Lỗi kết nối LLM (lần thử %d/%d): %s",
                        retry_idx + 1,
                        max_connection_retries + 1,
                        exc,
                    )
                    if retry_idx >= max_connection_retries:
                        return None
                    delay = backoff_base * (2 ** retry_idx)
                    if (time.monotonic() - start_time) + delay >= total_deadline:
                        return None
                    time.sleep(delay)
                except Exception as exc:
                    logger.error("Lỗi không mong muốn khi gọi LLM: %s", exc)
                    return None
            return None

        # ---------------- LẦN 1: Sinh nội dung lần đầu ----------------
        attempts += 1
        gen_result = _call_generate_with_retries(facts.user_message)

        if gen_result is None or not gen_result[0].strip():
            logger.warning("Lần sinh 1 không thành công hoặc trả về rỗng, chuyển sang Fallback tất định.")
            fb_text = build_fallback_interpretation(facts)
            fb_passed, fb_checks = post_validation(fb_text, facts, stop_reason="end_turn")
            return {
                "markdown_text": fb_text,
                "citations": extract_valid_citations_list(fb_text, facts.valid_citations),
                "is_fallback": True,
                "validation_report": {"passed": fb_passed, "checks": fb_checks},
                "disclaimer": disclaimer,
                "prompt_version": prompt_version,
                "model": "deterministic-fallback",
                "attempts": attempts,
            }

        llm_text, stop_reason = gen_result
        passed, checks = post_validation(llm_text, facts, stop_reason=stop_reason)

        if passed:
            return {
                "markdown_text": llm_text,
                "citations": extract_valid_citations_list(llm_text, facts.valid_citations),
                "is_fallback": False,
                "validation_report": {"passed": True, "checks": checks},
                "disclaimer": disclaimer,
                "prompt_version": prompt_version,
                "model": client_model,
                "attempts": attempts,
            }

        # ---------------- LẦN 2: Sinh lại (Repair Attempt) ----------------
        # Kiểm tra deadline trước khi thử lại
        if (time.monotonic() - start_time) >= (total_deadline - 1.0):
            logger.warning("Không đủ thời gian cho lần sửa lỗi (Repair), chuyển sang Fallback.")
            fb_text = build_fallback_interpretation(facts)
            fb_passed, fb_checks = post_validation(fb_text, facts, stop_reason="end_turn")
            return {
                "markdown_text": fb_text,
                "citations": extract_valid_citations_list(fb_text, facts.valid_citations),
                "is_fallback": True,
                "validation_report": {"passed": fb_passed, "checks": fb_checks},
                "disclaimer": disclaimer,
                "prompt_version": prompt_version,
                "model": "deterministic-fallback",
                "attempts": attempts,
            }

        attempts += 1
        failed_descriptions = [
            f"- {c['description']} (Chi tiết vi phạm: {c.get('details')})"
            for c in checks
            if not c["passed"]
        ]
        repair_msg = (
            f"{facts.user_message}\n\n"
            f"---\n"
            f"LƯU Ý SỬA LỖI HẬU KIỂM (LẦN 2):\n"
            f"Bản sinh trước đã vi phạm các quy tắc hậu kiểm sau:\n"
            f"{chr(10).join(failed_descriptions)}\n\n"
            f"Yêu cầu: Hãy sinh lại toàn bộ bản luận giải 3 mục tuân thủ tuyệt đối các quy tắc hậu kiểm trên."
        )

        repair_result = _call_generate_with_retries(repair_msg)
        if repair_result is not None and repair_result[0].strip():
            repair_text, repair_stop = repair_result
            repair_passed, repair_checks = post_validation(repair_text, facts, stop_reason=repair_stop)
            if repair_passed:
                return {
                    "markdown_text": repair_text,
                    "citations": extract_valid_citations_list(repair_text, facts.valid_citations),
                    "is_fallback": False,
                    "validation_report": {"passed": True, "checks": repair_checks},
                    "disclaimer": disclaimer,
                    "prompt_version": prompt_version,
                    "model": client_model,
                    "attempts": attempts,
                }

        # Nếu lần sửa lỗi vẫn thất bại -> Kích hoạt Fallback tất định
        logger.warning("Lần sửa lỗi hậu kiểm thất bại hoặc quá hạn, kích hoạt Fallback tất định.")
        fb_text = build_fallback_interpretation(facts)
        fb_passed, fb_checks = post_validation(fb_text, facts, stop_reason="end_turn")
        return {
            "markdown_text": fb_text,
            "citations": extract_valid_citations_list(fb_text, facts.valid_citations),
            "is_fallback": True,
            "validation_report": {"passed": fb_passed, "checks": fb_checks},
            "disclaimer": disclaimer,
            "prompt_version": prompt_version,
            "model": "deterministic-fallback",
            "attempts": attempts,
        }

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ai_advice_service.py - Orchestrator for AI Advice Layer (PA2' + Gemini/Anthropic + Save Draft).
Provides:
1. `build_fallback_advice`: Deterministic 3-5 bullet advice passing 100% of guardrails.
2. `AIAdviceCache`: In-memory thread-safe cache with TTL and pop-on-save to prevent duplicate submission.
3. `AIAdviceService`: Generation pipeline with retry, repair, validation, and draft caching.
"""
from __future__ import annotations

import collections
import logging
from pathlib import Path
import re
import threading
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from process_layer.app.core.config import settings
from process_layer.app.core.prompts import load_dich_su_advice_prompt
from process_layer.app.engines.dich_su_facts import (
    Facts,
    build_facts,
    normalize_nfc,
)
from process_layer.app.engines.dich_su_service import (
    _extract_pair_info,
    _sanitize_forbidden_words,
    extract_valid_citations_list,
)
from process_layer.app.engines.ai_advice_validator import (
    HEALTH_FINANCE_SAFETY_KEYWORDS,
    post_validation_advice,
)
from process_layer.app.engines.llm_client import (
    LLMClient,
    get_llm_client,
)
from process_layer.app.schemas.dich_su import (
    AIAdviceProvenance,
    AIAdviceResponse,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Deterministic Fallback Generator
# ============================================================================

def build_fallback_advice(facts: Facts, topic: Optional[str] = None) -> str:
    """
    Sinh văn bản lời khuyên hành động tất định (3–5 gạch đầu dòng) từ Facts.
    Đảm bảo 100% vượt qua post_validation_advice.
    """
    bullets: List[str] = []

    # Bullet 1: Nhãn phân cực + Thể Dụng quẻ chủ
    p_main_interp = _extract_pair_info(facts.user_message, "THE_DUNG_MAIN")
    summary_citations = [c for c in sorted(facts.valid_citations) if c.startswith("[Tổng hợp·")]
    tag_main = summary_citations[0] if summary_citations else "[Ngũ hành·THE_DUNG_MAIN]"
    b1_text = f"Về đại cục, vận hội biểu thị nhãn {facts.polarity_label}; {p_main_interp.lower()}."
    b1_clean = _sanitize_forbidden_words(b1_text).rstrip(".")
    bullets.append(f"- {b1_clean} {tag_main}")

    # Bullet 2: Hào động
    prefix_hao, prefix_tieu = facts.moving_line_citation_prefixes
    tag_hao = next((c for c in sorted(facts.valid_citations) if c.startswith(prefix_hao)), "")
    if not tag_hao:
        tag_hao = next((c for c in sorted(facts.valid_citations) if c.startswith(prefix_tieu)), "[Ngũ hành·THE_DUNG_MAIN]")
    b2_text = f"Hào động {facts.moving_line} là tâm điểm chuyển hóa, cần linh hoạt thích ứng thời thế và kiên trì định hướng."
    b2_clean = _sanitize_forbidden_words(b2_text).rstrip(".")
    bullets.append(f"- {b2_clean} {tag_hao}")

    # Bullet 3: Quẻ Biến
    p_trans_interp = _extract_pair_info(facts.user_message, "THE_TRANSFORMED_DUNG")
    tag_trans = next((c for c in sorted(facts.valid_citations) if c.startswith("[Ngũ hành·THE_TRANSFORMED_DUNG]")), tag_main)
    b3_text = f"Hướng về quẻ Biến, kết quả quy tụ phụ thuộc vào khả năng thích nghi: {p_trans_interp.lower()}."
    b3_clean = _sanitize_forbidden_words(b3_text).rstrip(".")
    bullets.append(f"- {b3_clean} {tag_trans}")

    # Bullet 4: Tu thân tích đức / Đại tượng
    tag_dai = next((c for c in sorted(facts.valid_citations) if c.startswith("[Đại tượng,")), tag_main)
    b4_text = "Giữ tâm thái khiêm cung, lấy việc tu dưỡng đạo đức và củng cố nội lực làm gốc rễ cho mọi hành động."
    b4_clean = _sanitize_forbidden_words(b4_text).rstrip(".")
    bullets.append(f"- {b4_clean} {tag_dai}")

    # Bullet 5: Nếu có luật chuyên gia trong dữ kiện
    tag_luat = next((c for c in sorted(facts.valid_citations) if c.startswith("[Luật·")), None)
    if tag_luat:
        b5_text = "Vận dụng quy luật chuyên gia để giữ vững thế chủ động và hóa giải các nguy cơ tiềm ẩn."
        b5_clean = _sanitize_forbidden_words(b5_text).rstrip(".")
        bullets.append(f"- {b5_clean} {tag_luat}")

    # Xử lý an toàn cho chủ đề HEALTH / FINANCE
    eff_topic = (topic or "").strip().upper()
    if eff_topic in ("HEALTH", "FINANCE"):
        topic_vn = "sức khỏe" if eff_topic == "HEALTH" else "tài chính"
        safety_bullet = f"- Đối với vấn đề {topic_vn}, đương số nên chủ động tham vấn chuyên gia và bác sĩ thực tế để có giải pháp an toàn. {tag_main}"
        if len(bullets) >= 5:
            bullets[-1] = safety_bullet
        else:
            bullets.append(safety_bullet)

    # Đảm bảo số dòng nằm trong [3, 5]
    if len(bullets) > 5:
        bullets = bullets[:5]

    return normalize_nfc("\n".join(bullets))


# ============================================================================
# Cache Quản lý Bản thảo (AIAdviceCache)
# ============================================================================

class AIAdviceCache:
    """
    Bộ nhớ đệm lưu trữ bản thảo lời khuyên AI kèm TTL 1 giờ.
    Cung cấp cơ chế pop_cached_draft() để đảm bảo tính Idempotency và chống lưu trùng.
    """

    def __init__(self, max_size: int = 1000, ttl_seconds: float = 3600.0) -> None:
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._cache: collections.OrderedDict[str, Tuple[float, Dict[str, Any]]] = collections.OrderedDict()
        self._lock = threading.Lock()

    def set(self, advice_id: str, entry: Dict[str, Any]) -> None:
        with self._lock:
            if advice_id in self._cache:
                self._cache.move_to_end(advice_id)
            elif len(self._cache) >= self._max_size:
                self._cache.popitem(last=False)
            self._cache[advice_id] = (time.monotonic(), entry)

    def get(self, advice_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if advice_id not in self._cache:
                return None
            created_at, entry = self._cache[advice_id]
            if time.monotonic() - created_at > self._ttl_seconds:
                del self._cache[advice_id]
                return None
            self._cache.move_to_end(advice_id)
            return entry

    def pop(self, advice_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if advice_id not in self._cache:
                return None
            created_at, entry = self._cache.pop(advice_id)
            if time.monotonic() - created_at > self._ttl_seconds:
                return None
            return entry

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


advice_cache = AIAdviceCache()


# ============================================================================
# AIAdviceService Orchestrator
# ============================================================================

class AIAdviceService:
    """
    Dịch vụ điều phối sinh khối Lời khuyên Hành động từ AI (AI Advice Layer):
    - Độc lập với SynthesisEngine (không tác động score/nhãn).
    - Hỗ trợ Gemini, Anthropic và FakeLLM.
    - Hậu kiểm 9-10 rào chắn qua AIAdviceValidator.
    - Cơ chế 1-shot repair khi vi phạm, tự động rơi về Fallback tất định nếu lỗi.
    - Sinh draft_payload và cache phục vụ chuyên gia phê duyệt (Gate 10).
    """

    def __init__(
        self,
        client: Optional[LLMClient] = None,
        prompt_path: Optional[Path] = None,
        cache: Optional[AIAdviceCache] = None,
    ) -> None:
        self.client = client
        self.prompt_path = prompt_path
        self.cache = cache or advice_cache

    def _resolve_client(self) -> Optional[LLMClient]:
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
        elif provider == "gemini":
            api_key = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "LLM_API_KEY", None)
            if not api_key:
                return None
            try:
                return get_llm_client(provider="gemini", api_key=api_key)
            except Exception as exc:
                logger.warning("Không thể khởi tạo GeminiClient: %s", exc)
                return None
        elif provider == "fake":
            try:
                return get_llm_client(provider="fake")
            except Exception as exc:
                logger.warning("Không thể khởi tạo FakeLLMClient: %s", exc)
                return None
        return None

    def generate(
        self,
        payload: Dict[str, Any],
        topic: Optional[str] = None,
        user_question: Optional[str] = None,
        user_level: Optional[str] = "BEGINNER",
    ) -> AIAdviceResponse:
        """
        Quy trình sinh lời khuyên hành động AI:
        1. Xây dựng Facts.
        2. Tải advice prompt.
        3. Gọi LLM với retry & deadline (45s).
        4. Hậu kiểm bằng post_validation_advice.
        5. Thử sửa lỗi 1 lần nếu cần, fallback nếu thất bại.
        6. Chèn safety note nếu là HEALTH / FINANCE.
        7. Đóng gói draft_payload và lưu cache.
        """
        start_time = time.monotonic()
        total_deadline = float(getattr(settings, "LLM_TOTAL_DEADLINE_S", 45.0))

        # Xác định topic
        eff_topic = (
            topic
            or payload.get("topic")
            or payload.get("casting_meta", {}).get("topic")
            or "GENERAL"
        ).strip().upper()

        # 1. Xây dựng Facts
        facts = build_facts(payload, user_question=user_question, user_level=user_level)

        # 2. Tải advice prompt
        try:
            prompt_text, prompt_version = load_dich_su_advice_prompt(self.prompt_path)
        except Exception as exc:
            logger.warning("Không thể đọc advice prompt (%s), dùng fallback", exc)
            prompt_text = ""
            prompt_version = "v1.0"

        disclaimer = payload.get("disclaimer") or (
            "Kết quả suy luận mang tính chất tham khảo văn hóa, triết học và định hướng tư duy "
            "dựa trên hệ thống biểu tượng Kinh Dịch và Mai Hoa Dịch Số cổ truyền. "
            "Hệ thống không đưa ra khẳng định chắc chắn về tương lai."
        )

        resolved_client = self._resolve_client()
        is_fallback = False
        content_text = ""
        validation_report: Dict[str, Any] = {}
        client_model = (
            getattr(resolved_client, "model", None)
            or getattr(settings, "LLM_MODEL", "gemini-2.5-flash")
        )

        # 3. Thực thi nếu client khả dụng
        if resolved_client is None:
            logger.info("LLM Client không khả dụng, dùng Fallback tất định cho AI Advice")
            is_fallback = True
            content_text = build_fallback_advice(facts, topic=eff_topic)
            v_passed, v_checks = post_validation_advice(content_text, facts, topic=eff_topic)
            validation_report = {"passed": v_passed, "checks": v_checks}
        else:
            # Helper gọi LLM có retry
            def _call_llm(user_msg: str) -> Optional[Tuple[str, str]]:
                max_retries = 2
                backoff_base = 0.5
                for retry_idx in range(max_retries + 1):
                    elapsed = time.monotonic() - start_time
                    remaining = total_deadline - elapsed
                    if remaining <= 0.2:
                        return None
                    call_timeout = min(float(getattr(settings, "LLM_TIMEOUT_S", 30.0)), remaining)
                    try:
                        return resolved_client.generate(
                            system=prompt_text,
                            user=user_msg,
                            temperature=float(getattr(settings, "LLM_TEMPERATURE", 0.3)),
                            max_tokens=int(getattr(settings, "LLM_MAX_TOKENS", 1000)),
                            timeout=call_timeout,
                        )
                    except (ConnectionError, TimeoutError, OSError) as exc:
                        if retry_idx >= max_retries:
                            return None
                        delay = backoff_base * (2 ** retry_idx)
                        if (time.monotonic() - start_time) + delay >= total_deadline:
                            return None
                        time.sleep(delay)
                    except Exception:
                        return None
                return None

            # Sinh lần 1
            gen_res = _call_llm(facts.user_message)
            first_text, stop_reason = gen_res if gen_res else ("", "error")

            v_passed = False
            v_checks: List[Dict[str, Any]] = []
            if first_text.strip():
                v_passed, v_checks = post_validation_advice(first_text, facts, stop_reason, topic=eff_topic)

            if v_passed:
                content_text = first_text.strip()
                validation_report = {"passed": True, "checks": v_checks}
            else:
                # Thử sửa lỗi 1 lần (Repair)
                logger.warning("AI Advice lần 1 không đạt hậu kiểm, thử sinh sửa lỗi lần 2")
                failed_rules = [c["rule_id"] for c in v_checks if not c["passed"]]
                repair_prompt = (
                    f"{facts.user_message}\n\n"
                    f"[LƯU Ý SỬA LỖI]: Bản sinh trước đã vi phạm các quy tắc: {', '.join(failed_rules)}.\n"
                    f"Yêu cầu: Sinh đúng 3-5 gạch đầu dòng bắt đầu '- ', mỗi dòng kết thúc bằng 1 thẻ căn cứ hợp lệ, "
                    f"tuyệt đối không dùng từ khẳng định tuyệt đối và không đổi nhãn {facts.polarity_label}."
                )
                repair_res = _call_llm(repair_prompt)
                rep_text, rep_stop = repair_res if repair_res else ("", "error")
                rep_passed = False
                if rep_text.strip():
                    rep_passed, rep_checks = post_validation_advice(rep_text, facts, rep_stop, topic=eff_topic)

                if rep_passed:
                    content_text = rep_text.strip()
                    validation_report = {"passed": True, "checks": rep_checks}
                else:
                    logger.warning("AI Advice sửa lỗi thất bại, chuyển sang Fallback tất định")
                    is_fallback = True
                    content_text = build_fallback_advice(facts, topic=eff_topic)
                    fb_passed, fb_checks = post_validation_advice(content_text, facts, topic=eff_topic)
                    validation_report = {"passed": fb_passed, "checks": fb_checks}

        # 4. Kiểm tra và bổ sung an toàn cho chủ đề HEALTH / FINANCE nếu cần
        if eff_topic in ("HEALTH", "FINANCE"):
            if not HEALTH_FINANCE_SAFETY_KEYWORDS.search(content_text):
                summary_citations = [c for c in sorted(facts.valid_citations) if c.startswith("[Tổng hợp·")]
                tag_main = summary_citations[0] if summary_citations else "[Ngũ hành·THE_DUNG_MAIN]"
                topic_vn = "sức khỏe" if eff_topic == "HEALTH" else "tài chính"
                safety_bullet = f"- Đối với vấn đề {topic_vn}, đương số nên chủ động tham vấn chuyên gia và bác sĩ thực tế để có quyết định an toàn. {tag_main}"
                lines = [l.strip() for l in content_text.splitlines() if l.strip()]
                if len(lines) >= 5:
                    lines[-1] = safety_bullet
                else:
                    lines.append(safety_bullet)
                content_text = "\n".join(lines)

        # 5. Trích xuất thẻ căn cứ
        citations = extract_valid_citations_list(content_text, facts.valid_citations)

        # 6. Chuẩn bị draft_payload cho Gate 10 (Governance review)
        init_hex = payload.get("initial_hexagram", {})
        init_hid = init_hex.get("hexagram_id") or 1
        synthesis_obj = payload.get("synthesis", {})
        raw_score = synthesis_obj.get("score", 0.0)
        try:
            clamped_polarity = max(-2, min(2, int(round(float(raw_score)))))
        except Exception:
            clamped_polarity = 0

        # Rút gọn bullet đầu làm summary
        content_lines = [l.lstrip("- ").strip() for l in content_text.splitlines() if l.strip()]
        first_bullet = content_lines[0] if content_lines else "Lời khuyên hành động"
        summary_clean = re.sub(r"\s*\[[^\]]+\]\s*$", "", first_bullet).strip()
        if len(summary_clean) > 200:
            summary_clean = summary_clean[:197] + "..."
        if len(summary_clean) < 5:
            summary_clean = f"Lời khuyên hành động quẻ {init_hex.get('name_vn', 'Mai Hoa Dịch Số')}"

        draft_payload = {
            "target_type": "LINE",
            "hexagram_id": int(init_hid),
            "line_position": int(facts.moving_line),
            "moving_line_position": None,
            "to_hexagram_id": None,
            "topic": eff_topic,
            "summary": summary_clean,
            "guidance": content_text,
            "polarity": clamped_polarity,
            "source_id": 1,
            "author_type": "AI_DRAFT",
            "author_name": "Trợ lý Dịch sư (AI)",
        }

        advice_id = str(uuid.uuid4())
        title = f"Lời khuyên Hành động ({eff_topic}) — Trợ lý Dịch sư"

        provenance = AIAdviceProvenance(
            source="AI_AUGMENTED_RAG",
            author_type="AI_DRAFT",
            review_status="AI_DRAFT",
            model="deterministic-fallback" if is_fallback else str(client_model),
            prompt_version=prompt_version,
        )

        response_obj = AIAdviceResponse(
            advice_id=advice_id,
            title=title,
            content=content_text,
            citations=citations,
            is_fallback=is_fallback,
            validation_report=validation_report,
            provenance=provenance,
            disclaimer=disclaimer,
            draft_payload=draft_payload,
        )

        # 7. Lưu cache
        self.cache.set(
            advice_id,
            {
                "response": response_obj.model_dump(),
                "draft_payload": draft_payload,
            },
        )

        return response_obj

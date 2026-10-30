#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_ai_advice_service.py - Tests for AIAdviceService, fallback advice, and post_validation_advice.
"""
import pytest

from process_layer.app.engines.ai_advice_service import (
    AIAdviceService,
    AIAdviceCache,
    build_fallback_advice,
)
from process_layer.app.engines.ai_advice_validator import post_validation_advice
from process_layer.app.engines.dich_su_facts import build_facts
from process_layer.app.engines.llm_client import FakeLLMClient


SAMPLE_PAYLOAD = {
    "case_id": "test-ai-case-1",
    "disclaimer": "Tuyên bố miễn trừ trách nhiệm chuẩn.",
    "casting_meta": {
        "casting_method": "MAI_HOA_TIME",
        "user_level": "BEGINNER",
        "pseudonymized_user_hash": "hash_xyz_123",
    },
    "initial_hexagram": {
        "hexagram_id": 1,
        "name_vn": "Thuần Càn",
        "name_han": "乾",
        "binary_code": "111111",
        "upper_trigram": {
            "id": 1,
            "name_vn": "Càn",
            "name_han": "乾",
            "binary_code": "111",
            "five_element": "KIM",
            "nature_symbol": "Thiên",
        },
        "lower_trigram": {
            "id": 1,
            "name_vn": "Càn",
            "name_han": "乾",
            "binary_code": "111",
            "five_element": "KIM",
            "nature_symbol": "Thiên",
        },
    },
    "transformed_hexagram": {
        "hexagram_id": 44,
        "name_vn": "Thiên Phong Cấu",
        "name_han": "姤",
        "binary_code": "111110",
        "upper_trigram": {
            "id": 1,
            "name_vn": "Càn",
            "name_han": "乾",
            "binary_code": "111",
            "five_element": "KIM",
            "nature_symbol": "Thiên",
        },
        "lower_trigram": {
            "id": 5,
            "name_vn": "Tốn",
            "name_han": "巽",
            "binary_code": "011",
            "five_element": "MOC",
            "nature_symbol": "Phong",
        },
    },
    "nuclear_hexagram": {
        "hexagram_id": 1,
        "name_vn": "Thuần Càn",
        "name_han": "乾",
        "binary_code": "111111",
        "upper_trigram": {
            "id": 1,
            "name_vn": "Càn",
            "name_han": "乾",
            "binary_code": "111",
            "five_element": "KIM",
            "nature_symbol": "Thiên",
        },
        "lower_trigram": {
            "id": 1,
            "name_vn": "Càn",
            "name_han": "乾",
            "binary_code": "111",
            "five_element": "KIM",
            "nature_symbol": "Thiên",
        },
    },
    "moving_line": 1,
    "dung_side": "LOWER",
    "the_element": "KIM",
    "dung_element": "KIM",
    "five_element_analysis": [
        {
            "pair": "THE_DUNG_MAIN",
            "primary_element": "KIM",
            "target_element": "KIM",
            "relation_type": "TY_HOA",
            "polarity_weight": 1,
            "interpretation": "Thể Dụng Tỷ Hòa: Cát lợi, đồng thanh tương ứng.",
            "source_id": 15,
        },
        {
            "pair": "THE_UPPER_NUCLEAR",
            "primary_element": "KIM",
            "target_element": "KIM",
            "relation_type": "TY_HOA",
            "polarity_weight": 1,
            "interpretation": "Thể Hỗ Tỷ Hòa.",
            "source_id": 15,
        },
        {
            "pair": "THE_LOWER_NUCLEAR",
            "primary_element": "KIM",
            "target_element": "KIM",
            "relation_type": "TY_HOA",
            "polarity_weight": 1,
            "interpretation": "Thể Hỗ Tỷ Hòa.",
            "source_id": 15,
        },
        {
            "pair": "THE_TRANSFORMED_DUNG",
            "primary_element": "KIM",
            "target_element": "MOC",
            "relation_type": "KHAC_XUAT",
            "polarity_weight": 0,
            "interpretation": "Thể khắc Biến Dụng.",
            "source_id": 15,
        },
    ],
    "rules_fired": [],
    "classic_texts": [
        {
            "text_id": 1,
            "hexagram_id": 1,
            "line_position": None,
            "text_type": "DAI_TUONG",
            "text_han": "天行健，君子以自強不息。",
            "text_vn": "Thiên hành kiện, quân tử dĩ tự cường bất tức.\nDịch. Trời vận động mạnh mẽ...",
            "source_id": 1,
            "source_ref": "p. 10",
        },
        {
            "text_id": 2,
            "hexagram_id": 1,
            "line_position": 1,
            "text_type": "HAO_TU",
            "text_han": "初九：潛龍勿用。",
            "text_vn": "Sơ cửu: Tiềm long vật dụng.\nDịch. Rồng còn ẩn dưới nước, chớ vội hành động...",
            "source_id": 1,
            "source_ref": "p. 11",
        },
    ],
    "interpretations": [],
    "synthesis": {
        "score": 1.2,
        "normalized_score": 0.8,
        "polarity_label": "TIỂU CÁT",
        "primary_conclusion": "Vận trình thuận lợi",
        "advice_blocks": [],
        "decomposition": {"element": 1.0, "rules": 0.0, "interp": 0.2},
    },
    "coverage": {
        "is_complete": True,
        "classic_texts_count": 2,
        "has_custom_topic_interpretation": False,
        "fallback_applied": False,
        "message": "Đầy đủ",
    },
}


def test_fallback_advice_validity():
    facts = build_facts(SAMPLE_PAYLOAD, user_question="Hỏi về công việc", user_level="BEGINNER")
    fallback_text = build_fallback_advice(facts, topic="CAREER")
    passed, checks = post_validation_advice(fallback_text, facts, topic="CAREER")
    assert passed is True
    for c in checks:
        assert c["passed"] is True, f"Check failed: {c['rule_id']}"


def test_validator_fails_on_forbidden_words():
    facts = build_facts(SAMPLE_PAYLOAD)
    bad_text = (
        "- Bạn chắc chắn sẽ thành công rực rỡ trong dự định. [Ngũ hành·THE_DUNG_MAIN]\n"
        "- Hào 1 khuyên nên kiên nhẫn. [Hào từ 1, p. 11]\n"
        "- Giữ tâm thái khiêm tốn. [Đại tượng, p. 10]"
    )
    passed, checks = post_validation_advice(bad_text, facts)
    assert passed is False
    r3 = next(c for c in checks if c["rule_id"] == "CHECK_ADVICE_FORBIDDEN_WORDS")
    assert r3["passed"] is False


def test_validator_fails_on_wrong_label():
    facts = build_facts(SAMPLE_PAYLOAD)
    # facts polarity is TIỂU CÁT, text contains ĐẠI HUNG
    bad_text = (
        "- Thế quẻ gặp ĐẠI HUNG cần hết sức cẩn trọng. [Ngũ hành·THE_DUNG_MAIN]\n"
        "- Hào 1 nhắc nhở tiềm phục. [Hào từ 1, p. 11]\n"
        "- Tu dưỡng đức khiêm cung. [Đại tượng, p. 10]"
    )
    passed, checks = post_validation_advice(bad_text, facts)
    assert passed is False
    r_lock = next(c for c in checks if c["rule_id"] == "CHECK_ADVICE_LABEL_LOCK")
    assert r_lock["passed"] is False


def test_validator_fails_on_invalid_citation():
    facts = build_facts(SAMPLE_PAYLOAD)
    bad_text = (
        "- Lời khuyên 1 với thẻ hợp lệ. [Ngũ hành·THE_DUNG_MAIN]\n"
        "- Lời khuyên 2 với thẻ bịa. [Ngũ hành·THE_DUNG_FAKE]\n"
        "- Lời khuyên 3 tu thân. [Đại tượng, p. 10]"
    )
    passed, checks = post_validation_advice(bad_text, facts)
    assert passed is False
    r_cit = next(c for c in checks if c["rule_id"] == "CHECK_ADVICE_CITATION_VALIDITY")
    assert r_cit["passed"] is False


def test_ai_advice_service_success():
    valid_llm_response = (
        "- Về tổng thể vận trình TIỂU CÁT, bạn nên vững vàng xây dựng nền móng. [Ngũ hành·THE_DUNG_MAIN]\n"
        "- Thời điểm hào sơ cửu nhắc nhở tiềm long vật dụng, chớ nên nóng vội. [Hào từ 1, p. 11]\n"
        "- Quẻ Biến cho thấy cơ hội mở rộng nếu biết khiêm nhường. [Ngũ hành·THE_TRANSFORMED_DUNG]\n"
        "- Lấy đức tự cường bất tức để rèn luyện ý chí và tu dưỡng tâm tính. [Đại tượng, p. 10]"
    )
    fake_client = FakeLLMClient(scripted_responses=[valid_llm_response])
    cache = AIAdviceCache()
    service = AIAdviceService(client=fake_client, cache=cache)

    resp = service.generate(SAMPLE_PAYLOAD, topic="CAREER", user_question="Tôi có nên chuyển việc?")
    assert resp.is_fallback is False
    assert resp.validation_report["passed"] is True
    assert len(resp.citations) >= 3
    assert resp.provenance.source == "AI_AUGMENTED_RAG"
    assert resp.provenance.author_type == "AI_DRAFT"
    assert resp.draft_payload["target_type"] == "LINE"
    assert resp.draft_payload["line_position"] == 1
    assert resp.draft_payload["topic"] == "CAREER"
    assert resp.draft_payload["polarity"] == 1

    # Verify cache
    cached = cache.get(resp.advice_id)
    assert cached is not None
    assert cached["draft_payload"]["line_position"] == 1


def test_ai_advice_service_repair_and_fallback():
    # First response fails (forbidden word), second response also fails -> falls back to deterministic
    invalid_1 = "- Bạn chắc chắn sẽ làm được. [Ngũ hành·THE_DUNG_MAIN]\n- Hào 1. [Hào từ 1, p. 11]\n- Đức khiêm. [Đại tượng, p. 10]"
    invalid_2 = "- Vẫn chắc 100% thành công. [Ngũ hành·THE_DUNG_MAIN]\n- Hào 1. [Hào từ 1, p. 11]\n- Đức khiêm. [Đại tượng, p. 10]"
    fake_client = FakeLLMClient(scripted_responses=[invalid_1, invalid_2])
    service = AIAdviceService(client=fake_client, cache=AIAdviceCache())

    resp = service.generate(SAMPLE_PAYLOAD, topic="CAREER")
    assert resp.is_fallback is True
    assert resp.validation_report["passed"] is True
    assert resp.provenance.model == "deterministic-fallback"


def test_ai_advice_service_health_topic_safety_note():
    valid_llm_response = (
        "- Giữ gìn sinh hoạt điều độ theo thế quẻ. [Ngũ hành·THE_DUNG_MAIN]\n"
        "- Chú ý nghỉ ngơi tĩnh dưỡng ở hào 1. [Hào từ 1, p. 11]\n"
        "- Giữ tâm thái an hòa và tích đức hành thiện. [Đại tượng, p. 10]"
    )
    fake_client = FakeLLMClient(scripted_responses=[valid_llm_response])
    service = AIAdviceService(client=fake_client, cache=AIAdviceCache())

    resp = service.generate(SAMPLE_PAYLOAD, topic="HEALTH")
    assert "chuyên gia" in resp.content.lower() or "bác sĩ" in resp.content.lower()

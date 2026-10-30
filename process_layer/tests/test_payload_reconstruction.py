#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_payload_reconstruction.py - Tests for DivinationRepository.build_payload_from_case.
Verifies that reconstructed payloads match the schema required by build_facts() and DivinationResponse.
"""
import json
import pytest

from process_layer.app.db.repository import DivinationRepository
from process_layer.app.engines.dich_su_facts import build_facts, Facts


MOCK_CASE_ROW = {
    "case_id": "test-uuid-1234",
    "session_time": "2026-10-20T10:00:00",
    "pseudonymized_user_hash": "user_hash_abc",
    "topic": "CAREER",
    "casting_method": "MAI_HOA_TIME",
    "year_branch_num": 7,
    "lunar_month": 9,
    "lunar_day": 10,
    "hour_branch_num": 5,
    "number_upper": None,
    "number_lower": None,
    "system_output_summary": json.dumps({
        "engine_version": "1.0.0",
        "casting_method": "MAI_HOA_TIME",
        "lunar_meta": {"solar_datetime": "2026-10-20T10:00:00"},
        "trigram_analysis": {
            "initial_hex_id": 49,
            "transformed_hex_id": 55,
            "nuclear_hex_id": 44,
            "moving_line": 5,
            "dung_side": "UPPER",
            "the_element": "KIM",
            "dung_element": "HOA",
        },
        "relations_used": [
            {
                "pair": "THE_DUNG_MAIN",
                "primary_element": "KIM",
                "target_element": "HOA",
                "relation_type": "KHAC_NHAP",
                "polarity_weight": -2,
                "interpretation": "Dụng khắc Thể: Đại Hung.",
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
                "target_element": "MOC",
                "relation_type": "KHAC_XUAT",
                "polarity_weight": 0,
                "interpretation": "Thể khắc Hạ Hỗ.",
                "source_id": 15,
            },
            {
                "pair": "THE_TRANSFORMED_DUNG",
                "primary_element": "KIM",
                "target_element": "HOA",
                "relation_type": "KHAC_NHAP",
                "polarity_weight": -2,
                "interpretation": "Biến Dụng khắc Thể.",
                "source_id": 15,
            },
        ],
        "rules_fired": [
            {
                "rule_id": 1,
                "rule_code": "R_PB_01",
                "priority": 10,
                "conclusion": "Luật ưu tiên Thể Dụng",
                "trace": {},
                "condition_description": "Mô tả",
            }
        ],
        "synthesis": {
            "score": -1.2,
            "normalized_score": 0.2,
            "polarity_label": "TIỂU HUNG",
            "primary_conclusion": "Kết luận sơ bộ",
            "advice_blocks": [],
            "decomposition": {"element": -1.2, "rules": 0.0, "interp": 0.0},
        },
        "coverage": {
            "is_complete": True,
            "classic_texts_count": 5,
            "has_custom_topic_interpretation": True,
            "fallback_applied": False,
            "message": "Đầy đủ",
        },
    }),
}

MOCK_EXTENDED_RESULT = {
    "case_id": "test-uuid-1234",
    "casting_method": "MAI_HOA_TIME",
    "topic": "CAREER",
    "upper_n": 3,
    "lower_n": 2,
    "moving_line": 5,
    "initial_hexagram_id": 49,
    "initial_name": "Trạch Hỏa Cách",
    "initial_binary": "011101",
    "transformed_hexagram_id": 55,
    "transformed_name": "Lôi Hỏa Phong",
    "transformed_binary": "101101",
    "nuclear_hexagram_id": 44,
    "nuclear_name": "Thiên Phong Cấu",
    "nuclear_binary": "111110",
    "dung_side": "UPPER",
    "the_element": "HOA",
    "dung_element": "KIM",
    "upper_nuclear_element": "KIM",
    "lower_nuclear_element": "MOC",
    "transformed_dung_element": "MOC",
}

MOCK_TAXONOMY_49 = {
    "hexagram_id": 49,
    "name_vn": "Trạch Hỏa Cách",
    "name_han": "革",
    "name_source": "Trạch Hỏa Cách",
    "binary_code": "011101",
    "upper_id": 2,
    "upper_name_vn": "Đoài",
    "upper_name_han": "兌",
    "upper_binary": "011",
    "upper_element": "KIM",
    "upper_symbol": "Trạch",
    "lower_id": 3,
    "lower_name_vn": "Ly",
    "lower_name_han": "離",
    "lower_binary": "101",
    "lower_element": "HOA",
    "lower_symbol": "Hỏa",
}

MOCK_TAXONOMY_55 = {
    "hexagram_id": 55,
    "name_vn": "Lôi Hỏa Phong",
    "name_han": "豐",
    "name_source": "Lôi Hỏa Phong",
    "binary_code": "101101",
    "upper_id": 4,
    "upper_name_vn": "Chấn",
    "upper_name_han": "震",
    "upper_binary": "100",
    "upper_element": "MOC",
    "upper_symbol": "Lôi",
    "lower_id": 3,
    "lower_name_vn": "Ly",
    "lower_name_han": "離",
    "lower_binary": "101",
    "lower_element": "HOA",
    "lower_symbol": "Hỏa",
}

MOCK_TAXONOMY_44 = {
    "hexagram_id": 44,
    "name_vn": "Thiên Phong Cấu",
    "name_han": "姤",
    "name_source": "Thiên Phong Cấu",
    "binary_code": "111110",
    "upper_id": 1,
    "upper_name_vn": "Càn",
    "upper_name_han": "乾",
    "upper_binary": "111",
    "upper_element": "KIM",
    "upper_symbol": "Thiên",
    "lower_id": 5,
    "lower_name_vn": "Tốn",
    "lower_name_han": "巽",
    "lower_binary": "011",
    "lower_element": "MOC",
    "lower_symbol": "Phong",
}

MOCK_CLASSIC_TEXTS = [
    {
        "text_id": 101,
        "hexagram_id": 49,
        "line_position": None,
        "text_type": "THOAN_TU",
        "text_han": "革：巳日乃孚，元亨利貞，悔亡。",
        "text_vn": "Kỷ nhật nãi phu, nguyên hanh lợi trinh, hối vong.\nDịch. Cách là đổi, đến ngày kỷ mới tin...",
        "source_id": 1,
        "source_ref": "p. 150",
    },
    {
        "text_id": 102,
        "hexagram_id": 49,
        "line_position": 5,
        "text_type": "HAO_TU",
        "text_han": "九五：大人虎變，未占有孚。",
        "text_vn": "Đại nhân hổ biến, vị chiêm hữu phu.\nDịch. Bậc đại nhân thay đổi rực rỡ như lông cọp vằn...",
        "source_id": 1,
        "source_ref": "p. 152",
    },
    {
        "text_id": 103,
        "hexagram_id": 49,
        "line_position": 5,
        "text_type": "TIEU_TUONG",
        "text_han": "象曰：大人虎變，其文炳也。",
        "text_vn": "Tượng rằng: Đại nhân hổ biến, kỳ văn bỉnh dã.\nDịch. Bậc đại nhân biến hóa rực rỡ...",
        "source_id": 1,
        "source_ref": "p. 152",
    },
    {
        "text_id": 104,
        "hexagram_id": 49,
        "line_position": None,
        "text_type": "DAI_TUONG",
        "text_han": "象曰：澤中有火，革；君子以治曆明時。",
        "text_vn": "Trạch trung hữu hỏa, Cách. Quân tử dĩ trị lịch minh thời.\nDịch. Trong đầm có lửa...",
        "source_id": 1,
        "source_ref": "p. 151",
    },
]

MOCK_INTERPRETATIONS = [
    {
        "interpretation_id": 201,
        "target_type": "LINE",
        "hexagram_id": 49,
        "line_position": 5,
        "topic": "CAREER",
        "summary": "Cơ hội đổi mới sự nghiệp mạnh mẽ.",
        "guidance": "Nên chủ động đổi mới phương thức làm việc.",
        "polarity": 1,
        "source_id": 1,
        "source_title": "Mai Hoa Dịch Số",
    }
]


def test_build_payload_not_found(monkeypatch):
    monkeypatch.setattr(DivinationRepository, "get_divination_case_row", lambda cid: None)
    payload = DivinationRepository.build_payload_from_case("non-existent-case")
    assert payload is None


def test_build_payload_success_and_facts_compatibility(monkeypatch):
    def mock_case_row(cid):
        return dict(MOCK_CASE_ROW)

    def mock_extended(cid):
        return dict(MOCK_EXTENDED_RESULT)

    def mock_tax(hid):
        if hid == 49:
            return dict(MOCK_TAXONOMY_49)
        elif hid == 55:
            return dict(MOCK_TAXONOMY_55)
        elif hid == 44:
            return dict(MOCK_TAXONOMY_44)
        return None

    monkeypatch.setattr(DivinationRepository, "get_divination_case_row", mock_case_row)
    monkeypatch.setattr(DivinationRepository, "get_divination_extended_result", mock_extended)
    monkeypatch.setattr(DivinationRepository, "get_hexagram_taxonomy", mock_tax)
    monkeypatch.setattr(DivinationRepository, "get_classic_texts", lambda hid, user_level="EXPERT": list(MOCK_CLASSIC_TEXTS))
    monkeypatch.setattr(DivinationRepository, "get_approved_interpretations", lambda hid, topic="GENERAL": list(MOCK_INTERPRETATIONS))

    payload = DivinationRepository.build_payload_from_case("test-uuid-1234")
    assert payload is not None
    assert payload["case_id"] == "test-uuid-1234"
    assert payload["moving_line"] == 5
    assert payload["dung_side"] == "UPPER"

    # Hexagram structure
    assert payload["initial_hexagram"]["name_vn"] == "Trạch Hỏa Cách"
    assert payload["initial_hexagram"]["upper_trigram"]["name_vn"] == "Đoài"
    assert payload["transformed_hexagram"]["name_vn"] == "Lôi Hỏa Phong"
    assert payload["nuclear_hexagram"]["name_vn"] == "Thiên Phong Cấu"

    # Relations and fired rules
    assert len(payload["five_element_analysis"]) == 4
    assert len(payload["rules_fired"]) == 1
    assert payload["synthesis"]["polarity_label"] == "TIỂU HUNG"

    # Build facts compatibility check
    facts = build_facts(payload, user_question="Tôi có nên chuyển việc không?", user_level="BEGINNER")
    assert isinstance(facts, Facts)
    assert facts.moving_line == 5
    assert facts.polarity_label == "TIỂU HUNG"
    assert len(facts.valid_citations) > 0
    assert any("[Ngũ hành·THE_DUNG_MAIN]" in c for c in facts.valid_citations)
    assert any("[Đại tượng," in c for c in facts.valid_citations)
    assert any("[Hào từ 5," in c for c in facts.valid_citations)

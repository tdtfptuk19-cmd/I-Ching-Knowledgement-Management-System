#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_synthesis_engine.py - Bộ kiểm thử đơn vị cho Synthesis Engine (Mô-đun 3)
Kiểm thử:
1. Tính điểm Ngũ hành 3 chặng (ADR-002: Thể-Dụng 0.50, Thể-Hỗ 0.20, Thể-Biến 0.30).
2. Tính điểm hệ luật kích hoạt (Rule score).
3. Tính điểm diễn giải chuyên gia (Interpretation score).
4. Tổng hợp điểm theo trọng số cấu hình và phân rã điểm (Decomposition).
5. Phân loại nhãn Cát/Hung theo ngưỡng chuẩn (ĐẠI CÁT, TIỂU CÁT, BÌNH HÒA, TIỂU HUNG, ĐẠI HUNG).
6. Cảnh báo an toàn nội dung (HEALTH, FINANCE).
7. Đánh giá độ phủ tri thức (CoverageInfo) và cơ chế fallback.
"""
import pytest
from process_layer.app.schemas.divination import (
    FiveElementRelationAnalysis,
    RuleFiredInfo,
    Topic,
)
from process_layer.app.engines.synthesis_engine import SynthesisEngine
from process_layer.app.core.config import settings


def test_element_score_calculation():
    five_analysis = [
        FiveElementRelationAnalysis(
            pair="THE_DUNG_MAIN",
            primary_element="KIM",
            target_element="THO",
            relation_type="SINH_NHAP",
            polarity_weight=2,
            interpretation="Dụng sinh Thể",
        ),
        FiveElementRelationAnalysis(
            pair="THE_UPPER_NUCLEAR",
            primary_element="KIM",
            target_element="KIM",
            relation_type="TY_HOA",
            polarity_weight=1,
            interpretation="Tỷ hòa",
        ),
        FiveElementRelationAnalysis(
            pair="THE_LOWER_NUCLEAR",
            primary_element="KIM",
            target_element="THO",
            relation_type="SINH_NHAP",
            polarity_weight=2,
            interpretation="Dụng sinh Thể",
        ),
        FiveElementRelationAnalysis(
            pair="THE_TRANSFORMED_DUNG",
            primary_element="KIM",
            target_element="THO",
            relation_type="SINH_NHAP",
            polarity_weight=2,
            interpretation="Dụng sinh Thể",
        ),
    ]

    # S_elem = 0.50 * 2 + 0.20 * (1 + 2)/2 + 0.30 * 2 = 1.0 + 0.30 + 0.60 = 1.90
    score = SynthesisEngine.calculate_element_score(five_analysis)
    assert score == pytest.approx(1.90, 0.01)


def test_synthesis_full_three_pillars():
    five_analysis = [
        FiveElementRelationAnalysis(
            pair="THE_DUNG_MAIN",
            primary_element="KIM",
            target_element="KIM",
            relation_type="TY_HOA",
            polarity_weight=1,
            interpretation="Tỷ hòa",
        ),
        FiveElementRelationAnalysis(
            pair="THE_UPPER_NUCLEAR",
            primary_element="KIM",
            target_element="KIM",
            relation_type="TY_HOA",
            polarity_weight=1,
            interpretation="Tỷ hòa",
        ),
        FiveElementRelationAnalysis(
            pair="THE_LOWER_NUCLEAR",
            primary_element="KIM",
            target_element="KIM",
            relation_type="TY_HOA",
            polarity_weight=1,
            interpretation="Tỷ hòa",
        ),
        FiveElementRelationAnalysis(
            pair="THE_TRANSFORMED_DUNG",
            primary_element="KIM",
            target_element="KIM",
            relation_type="TY_HOA",
            polarity_weight=1,
            interpretation="Tỷ hòa",
        ),
    ]

    fired_rules = [
        RuleFiredInfo(
            rule_id=1,
            rule_code="PB_CORE_TY_HOA",
            priority=90,
            conclusion="Thể Dụng Tỷ Hòa",
            trace={},
        )
    ]

    interpretations = [
        {
            "interpretation_id": 1,
            "topic": "CAREER",
            "polarity": 2,
            "summary": "Thời vận thăng tiến",
            "guidance": "Tiếp tục phát huy",
        }
    ]

    classic_texts = [{"text_id": 1, "text_type": "THOAN_TU", "text_vn": "Nguyên Hanh Lợi Trinh"}]

    res, cov = SynthesisEngine.synthesize(
        topic=Topic.CAREER,
        initial_name="Thuần Càn",
        moving_line=2,
        transformed_name="Thiên Hỏa Đồng Nhân",
        the_element="KIM",
        dung_element="KIM",
        five_analysis=five_analysis,
        fired_rules=fired_rules,
        interpretations=interpretations,
        classic_texts=classic_texts,
    )

    # Score decomposition:
    # S_elem = 1.00
    # S_rules = 1.00
    # S_interp = 2.00
    # S_total = 0.40 * 1.0 + 0.35 * 1.0 + 0.25 * 2.0 = 0.40 + 0.35 + 0.50 = 1.25
    assert res.score == pytest.approx(1.25, 0.05)
    assert res.polarity_label == "ĐẠI CÁT"
    assert "decomposition" in res.model_dump()
    assert res.decomposition["element_score"] == 1.00
    assert res.decomposition["rule_score"] == 1.00
    assert res.decomposition["interpretation_score"] == 2.00

    # Coverage
    assert cov.has_custom_topic_interpretation is True
    assert cov.fallback_applied is False


def test_polarity_labels_and_safety_warnings():
    # Test Cảnh báo Sức khỏe
    res_h, _ = SynthesisEngine.synthesize(
        topic=Topic.HEALTH,
        initial_name="Thuần Càn",
        moving_line=1,
        transformed_name="Thiên Phong Cấu",
        the_element="KIM",
        dung_element="KIM",
        five_analysis=[],
        fired_rules=[],
        interpretations=[],
        classic_texts=[],
    )
    assert any("Cảnh báo Sức khỏe" in b["title"] for b in res_h.advice_blocks)

    # Test Cảnh báo Tài chính
    res_f, _ = SynthesisEngine.synthesize(
        topic=Topic.FINANCE,
        initial_name="Thuần Càn",
        moving_line=1,
        transformed_name="Thiên Phong Cấu",
        the_element="KIM",
        dung_element="KIM",
        five_analysis=[],
        fired_rules=[],
        interpretations=[],
        classic_texts=[],
    )
    assert any("Cảnh báo Tài chính" in b["title"] for b in res_f.advice_blocks)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_rule_engine.py - Bộ kiểm thử đơn vị cho Rule Engine (Mô-đun 2)
Kiểm thử:
1. Đánh giá biểu thức Predicate (eq, ne, in, not_in, gte, lte, gt, lt).
2. Hợp nhất logic (all, any, not).
3. Giới hạn độ sâu AST (max_depth = 3).
4. Định dạng conclusion_template an toàn.
5. Giải quyết xung đột theo priority.
6. Chặn các trường và toán tử ngoài whitelist.
"""
import pytest
from process_layer.app.engines.rule_engine import (
    evaluate_rule_expression,
    RuleEngine,
)
from process_layer.app.core.errors import ValidationError


def test_predicate_operators():
    context = {
        "the_element": "KIM",
        "dung_element": "THO",
        "relation_type": "SINH_NHAP",
        "polarity_weight": 2,
        "moving_line": 5,
        "topic": "CAREER",
    }

    # eq
    expr_eq = {
        "dsl_version": 1,
        "condition": {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"},
    }
    matched, _ = evaluate_rule_expression(expr_eq, context)
    assert matched is True

    # ne
    expr_ne = {
        "dsl_version": 1,
        "condition": {"field": "relation_type", "op": "ne", "value": "KHAC_NHAP"},
    }
    matched, _ = evaluate_rule_expression(expr_ne, context)
    assert matched is True

    # in
    expr_in = {
        "dsl_version": 1,
        "condition": {"field": "moving_line", "op": "in", "value": [2, 5]},
    }
    matched, _ = evaluate_rule_expression(expr_in, context)
    assert matched is True

    # not_in
    expr_nin = {
        "dsl_version": 1,
        "condition": {"field": "moving_line", "op": "not_in", "value": [1, 6]},
    }
    matched, _ = evaluate_rule_expression(expr_nin, context)
    assert matched is True

    # gte, lte, gt, lt
    assert evaluate_rule_expression(
        {"dsl_version": 1, "condition": {"field": "polarity_weight", "op": "gte", "value": 2}},
        context,
    )[0] is True
    assert evaluate_rule_expression(
        {"dsl_version": 1, "condition": {"field": "polarity_weight", "op": "lte", "value": 2}},
        context,
    )[0] is True
    assert evaluate_rule_expression(
        {"dsl_version": 1, "condition": {"field": "polarity_weight", "op": "gt", "value": 1}},
        context,
    )[0] is True
    assert evaluate_rule_expression(
        {"dsl_version": 1, "condition": {"field": "polarity_weight", "op": "lt", "value": 3}},
        context,
    )[0] is True


def test_composite_logic():
    context = {
        "the_element": "MOC",
        "dung_element": "KIM",
        "relation_type": "KHAC_NHAP",
        "topic": "HEALTH",
        "moving_line": 1,
    }

    # all (AND)
    expr_all = {
        "dsl_version": 1,
        "condition": {
            "all": [
                {"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"},
                {"field": "topic", "op": "eq", "value": "HEALTH"},
            ]
        },
    }
    matched, trace = evaluate_rule_expression(expr_all, context)
    assert matched is True
    assert trace["op"] == "all"
    assert len(trace["children"]) == 2

    # any (OR)
    expr_any = {
        "dsl_version": 1,
        "condition": {
            "any": [
                {"field": "topic", "op": "eq", "value": "FINANCE"},
                {"field": "the_element", "op": "eq", "value": "MOC"},
            ]
        },
    }
    matched, _ = evaluate_rule_expression(expr_any, context)
    assert matched is True

    # not
    expr_not = {
        "dsl_version": 1,
        "condition": {"not": {"field": "topic", "op": "eq", "value": "FINANCE"}},
    }
    matched, _ = evaluate_rule_expression(expr_not, context)
    assert matched is True


def test_whitelist_and_depth_guards():
    context = {"the_element": "KIM"}

    # Truong khong hop le
    expr_bad_field = {
        "dsl_version": 1,
        "condition": {"field": "malicious_field", "op": "eq", "value": "xyz"},
    }
    with pytest.raises(ValidationError):
        evaluate_rule_expression(expr_bad_field, context)

    # Toan tu khong hop le
    expr_bad_op = {
        "dsl_version": 1,
        "condition": {"field": "the_element", "op": "regex_match", "value": ".*"},
    }
    with pytest.raises(ValidationError):
        evaluate_rule_expression(expr_bad_op, context)

    # Do sau vuot qua 3 tang
    expr_too_deep = {
        "dsl_version": 1,
        "condition": {
            "all": [
                {
                    "any": [
                        {
                            "all": [
                                {
                                    "not": {
                                        "field": "the_element",
                                        "op": "eq",
                                        "value": "KIM",
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
    }
    with pytest.raises(ValidationError):
        evaluate_rule_expression(expr_too_deep, context)


def test_rule_engine_conflict_resolution():
    rules = [
        {
            "rule_id": 1,
            "rule_code": "LOW_PRIORITY",
            "priority": 50,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"},
            },
            "conclusion_template": "Ket luan muc do vua {the_element}",
        },
        {
            "rule_id": 2,
            "rule_code": "HIGH_PRIORITY",
            "priority": 100,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {"field": "the_element", "op": "eq", "value": "KIM"},
            },
            "conclusion_template": "Ket luan uu tien cao cho {the_element} voi {dung_element}",
        },
        {
            "rule_id": 3,
            "rule_code": "UNMATCHED",
            "priority": 999,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {"field": "the_element", "op": "eq", "value": "HOA"},
            },
            "conclusion_template": "Khong bao gio khop",
        },
    ]

    context = {
        "the_element": "KIM",
        "dung_element": "THO",
        "relation_type": "SINH_NHAP",
    }

    fired = RuleEngine.evaluate_rules(rules, context)
    assert len(fired) == 2
    # Luat priority 100 phai dung dau tien
    assert fired[0].rule_code == "HIGH_PRIORITY"
    assert fired[0].conclusion == "Ket luan uu tien cao cho KIM voi THO"
    assert fired[1].rule_code == "LOW_PRIORITY"


def test_condition_description_runtime_propagation():
    """Kiểm thử việc truyền tải condition_description qua RuleEngine khi luật được kích hoạt."""
    rules = [
        {
            "rule_id": 10,
            "rule_code": "RULE_THE_KHAC_DUNG",
            "priority": 90,
            "condition_description": "Thể ngũ hành khắc Dụng ngũ hành trong quẻ Chủ",
            "condition_expression": {
                "dsl_version": 1,
                "condition": {"field": "the_element", "op": "eq", "value": "KIM"},
            },
            "conclusion_template": "Chủ thể {the_element} nắm quyền chủ động",
        }
    ]
    context = {"the_element": "KIM", "dung_element": "MOC"}
    fired = RuleEngine.evaluate_rules(rules, context)
    assert len(fired) == 1
    assert fired[0].rule_id == 10
    assert fired[0].rule_code == "RULE_THE_KHAC_DUNG"
    assert fired[0].condition_description == "Thể ngũ hành khắc Dụng ngũ hành trong quẻ Chủ"


def test_domain_specific_inference_rules():
    """Kiểm thử việc kích hoạt các quy tắc chuyên gia theo từng chuyên đề (CAREER, FINANCE, RELATIONSHIP, HEALTH, ACADEMIC)."""
    domain_rules = [
        {
            "rule_id": 1,
            "rule_code": "PB_CORE_SINH_NHAP",
            "priority": 100,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"},
            },
            "conclusion_template": "Dụng ({dung_element}) sinh Thể ({the_element}): Điềm Đại Cát.",
        },
        {
            "rule_id": 8,
            "rule_code": "PB_CAREER_SINH_NHAP",
            "priority": 120,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {
                    "all": [
                        {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"},
                        {"field": "topic", "op": "eq", "value": "CAREER"},
                    ]
                },
            },
            "conclusion_template": "Sự nghiệp (CAREER): Thời vận hanh thông, cấp trên nâng đỡ.",
        },
        {
            "rule_id": 17,
            "rule_code": "PB_FINANCE_KHAC_NHAP",
            "priority": 120,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {
                    "all": [
                        {"field": "relation_type", "op": "eq", "value": "KHAC_NHAP"},
                        {"field": "topic", "op": "eq", "value": "FINANCE"},
                    ]
                },
            },
            "conclusion_template": "Tài chính (FINANCE): Nguy cơ thâm hụt tài chính.",
        },
        {
            "rule_id": 19,
            "rule_code": "PB_RELATIONSHIP_TY_HOA",
            "priority": 115,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {
                    "all": [
                        {"field": "relation_type", "op": "eq", "value": "TY_HOA"},
                        {"field": "topic", "op": "eq", "value": "RELATIONSHIP"},
                    ]
                },
            },
            "conclusion_template": "Quan hệ (RELATIONSHIP): Đôi bên đồng điệu tâm hồn.",
        },
        {
            "rule_id": 23,
            "rule_code": "PB_HEALTH_SINH_NHAP",
            "priority": 120,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {
                    "all": [
                        {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"},
                        {"field": "topic", "op": "eq", "value": "HEALTH"},
                    ]
                },
            },
            "conclusion_template": "Sức khỏe (HEALTH): Chính khí dồi dào, gặp thầy gặp thuốc.",
        },
        {
            "rule_id": 28,
            "rule_code": "PB_ACADEMIC_SINH_NHAP",
            "priority": 120,
            "condition_expression": {
                "dsl_version": 1,
                "condition": {
                    "all": [
                        {"field": "relation_type", "op": "eq", "value": "SINH_NHAP"},
                        {"field": "topic", "op": "eq", "value": "ACADEMIC"},
                    ]
                },
            },
            "conclusion_template": "Học vấn (ACADEMIC): Trí tuệ hanh thông, bài thi đúng sở trường.",
        },
    ]

    # 1. Kiểm thử CAREER + SINH_NHAP: Luật chuyên gia phải xếp trên luật cốt lõi (priority 120 > 100)
    context_career = {
        "the_element": "KIM",
        "dung_element": "THO",
        "relation_type": "SINH_NHAP",
        "topic": "CAREER",
    }
    fired_career = RuleEngine.evaluate_rules(domain_rules, context_career)
    assert len(fired_career) == 2
    assert fired_career[0].rule_code == "PB_CAREER_SINH_NHAP"
    assert "Sự nghiệp (CAREER)" in fired_career[0].conclusion
    assert fired_career[1].rule_code == "PB_CORE_SINH_NHAP"

    # 2. Kiểm thử FINANCE + KHAC_NHAP
    context_finance = {
        "the_element": "MOC",
        "dung_element": "KIM",
        "relation_type": "KHAC_NHAP",
        "topic": "FINANCE",
    }
    fired_finance = RuleEngine.evaluate_rules(domain_rules, context_finance)
    assert len(fired_finance) == 1
    assert fired_finance[0].rule_code == "PB_FINANCE_KHAC_NHAP"

    # 3. Kiểm thử RELATIONSHIP + TY_HOA
    context_rel = {
        "the_element": "THUY",
        "dung_element": "THUY",
        "relation_type": "TY_HOA",
        "topic": "RELATIONSHIP",
    }
    fired_rel = RuleEngine.evaluate_rules(domain_rules, context_rel)
    assert len(fired_rel) == 1
    assert fired_rel[0].rule_code == "PB_RELATIONSHIP_TY_HOA"

    # 4. Kiểm thử HEALTH + SINH_NHAP
    context_health = {
        "the_element": "MOC",
        "dung_element": "THUY",
        "relation_type": "SINH_NHAP",
        "topic": "HEALTH",
    }
    fired_health = RuleEngine.evaluate_rules(domain_rules, context_health)
    assert len(fired_health) == 2
    assert fired_health[0].rule_code == "PB_HEALTH_SINH_NHAP"

    # 5. Kiểm thử ACADEMIC + SINH_NHAP
    context_academic = {
        "the_element": "HOA",
        "dung_element": "MOC",
        "relation_type": "SINH_NHAP",
        "topic": "ACADEMIC",
    }
    fired_academic = RuleEngine.evaluate_rules(domain_rules, context_academic)
    assert len(fired_academic) == 2
    assert fired_academic[0].rule_code == "PB_ACADEMIC_SINH_NHAP"


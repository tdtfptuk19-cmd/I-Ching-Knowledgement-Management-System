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

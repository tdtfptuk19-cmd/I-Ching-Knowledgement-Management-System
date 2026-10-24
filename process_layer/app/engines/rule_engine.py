#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
rule_engine.py - Bộ suy luận luật (Rule Engine / Production System) cho KinhDich_KB
Hiện thực hóa:
- Đọc và phân tích cây cú pháp AST của biểu thức logic JSON (Rule DSL v1).
- Đánh giá luật tất định, giải thích được (Explainable & Deterministic).
- Tuyệt đối không dùng eval() hay exec() (Bảo mật ADR-004).
- Truy vết chi tiết (Traceability) phục vụ kiểm duyệt và Double-loop learning.
"""
from typing import Dict, Any, List, Tuple, Optional
import json
import string
from process_layer.app.schemas.divination import RuleFiredInfo
from process_layer.app.core.errors import ValidationError


# Whitelist các trường ngữ cảnh cho phép trong Rule DSL
ALLOWED_FIELDS = {
    "the_element",
    "dung_element",
    "relation_type",
    "polarity_weight",
    "moving_line",
    "dung_side",
    "initial_hexagram_id",
    "transformed_hexagram_id",
    "nuclear_hexagram_id",
    "upper_trigram",
    "lower_trigram",
    "upper_nuclear_trigram",
    "lower_nuclear_trigram",
    "topic",
}

# Whitelist các toán tử so sánh
ALLOWED_OPERATORS = {
    "eq",
    "ne",
    "in",
    "not_in",
    "gte",
    "lte",
    "gt",
    "lt",
}

MAX_AST_DEPTH = 3


class SafeTemplateFormatter(string.Formatter):
    """Bộ format chuỗi an toàn, bỏ qua các placeholder không có trong context thay vì ném KeyError."""

    def get_value(self, key, args, kwargs):
        if isinstance(key, str):
            return kwargs.get(key, f"{{{key}}}")
        return super().get_value(key, args, kwargs)


formatter = SafeTemplateFormatter()


def evaluate_predicate(
    node: Dict[str, Any], context: Dict[str, Any]
) -> Tuple[bool, Dict[str, Any]]:
    """
    Đánh giá một Predicate Node cơ sở: {field, op, value}
    Trả về (kết quả boolean, trace chi tiết).
    """
    field = node.get("field")
    op = node.get("op")
    expected_value = node.get("value")

    if not field or not op:
        raise ValidationError(f"Predicate Node thieu 'field' hoac 'op': {node}")

    if field not in ALLOWED_FIELDS:
        raise ValidationError(f"Truong '{field}' khong nam trong whitelist cho phep cua Rule DSL")

    if op not in ALLOWED_OPERATORS:
        raise ValidationError(f"Toan tu '{op}' khong nam trong whitelist cho phep cua Rule DSL")

    actual_value = context.get(field)
    matched = False

    if op == "eq":
        matched = actual_value == expected_value
    elif op == "ne":
        matched = actual_value != expected_value
    elif op == "in":
        if isinstance(expected_value, list):
            matched = actual_value in expected_value
        else:
            matched = False
    elif op == "not_in":
        if isinstance(expected_value, list):
            matched = actual_value not in expected_value
        else:
            matched = True
    elif op == "gte":
        matched = actual_value is not None and actual_value >= expected_value
    elif op == "lte":
        matched = actual_value is not None and actual_value <= expected_value
    elif op == "gt":
        matched = actual_value is not None and actual_value > expected_value
    elif op == "lt":
        matched = actual_value is not None and actual_value < expected_value

    trace = {
        "field": field,
        "op": op,
        "expected": expected_value,
        "actual": actual_value,
        "matched": matched,
    }
    return matched, trace


def evaluate_ast_node(
    node: Dict[str, Any], context: Dict[str, Any], depth: int = 1
) -> Tuple[bool, Dict[str, Any]]:
    """
    Đánh giá đệ quy cây cú pháp AST (Hỗ trợ all, any, not, predicate).
    Giới hạn độ sâu tối đa 3 tầng để chống đệ quy sâu.
    """
    if depth > MAX_AST_DEPTH:
        raise ValidationError(f"Do sau cay AST vuot qua gioi han cho phep ({MAX_AST_DEPTH})")

    if "all" in node:
        sub_nodes = node["all"]
        sub_traces = []
        all_matched = True
        for sub in sub_nodes:
            m, t = evaluate_ast_node(sub, context, depth + 1)
            sub_traces.append(t)
            if not m:
                all_matched = False
        return all_matched, {"op": "all", "matched": all_matched, "children": sub_traces}

    elif "any" in node:
        sub_nodes = node["any"]
        sub_traces = []
        any_matched = False
        for sub in sub_nodes:
            m, t = evaluate_ast_node(sub, context, depth + 1)
            sub_traces.append(t)
            if m:
                any_matched = True
        return any_matched, {"op": "any", "matched": any_matched, "children": sub_traces}

    elif "not" in node:
        sub = node["not"]
        m, t = evaluate_ast_node(sub, context, depth + 1)
        not_matched = not m
        return not_matched, {"op": "not", "matched": not_matched, "child": t}

    else:
        # Predicate Node
        return evaluate_predicate(node, context)


def evaluate_rule_expression(
    expression: Any, context: Dict[str, Any]
) -> Tuple[bool, Dict[str, Any]]:
    """
    Tiếp nhận biểu thức condition_expression (chuỗi JSON hoặc Dict)
    và đánh giá trên ngữ cảnh thực thi.
    """
    if isinstance(expression, str):
        try:
            expr_dict = json.loads(expression)
        except Exception as e:
            raise ValidationError(f"condition_expression khong phai JSON hop le: {e}")
    elif isinstance(expression, dict):
        expr_dict = expression
    else:
        raise ValidationError("condition_expression phai la chuoi JSON hoac Dict")

    dsl_version = expr_dict.get("dsl_version", 1)
    if dsl_version != 1:
        raise ValidationError(f"Phien ban DSL khong duoc ho tro: {dsl_version}")

    condition_node = expr_dict.get("condition")
    if not condition_node:
        raise ValidationError("Bieu thuc Rule DSL thieu truong 'condition'")

    return evaluate_ast_node(condition_node, context, depth=1)


class RuleEngine:
    """Bộ điều phối thực thi tập luật suy luận."""

    @staticmethod
    def evaluate_rules(
        rules: List[Dict[str, Any]], context: Dict[str, Any]
    ) -> List[RuleFiredInfo]:
        """
        Duyệt qua danh sách các luật, đánh giá điều kiện,
        sắp xếp theo priority DESC, rule_id ASC và sinh kết luận an toàn.
        """
        fired_rules: List[RuleFiredInfo] = []

        for r in rules:
            rule_id = r.get("rule_id", 0)
            rule_code = r.get("rule_code", "")
            priority = r.get("priority", 0)
            cond_expr = r.get("condition_expression")
            conclusion_tmpl = r.get("conclusion_template", "")

            try:
                matched, trace = evaluate_rule_expression(cond_expr, context)
            except Exception as ex:
                # Nếu một luật bị lỗi cú pháp, ghi log và bỏ qua, không làm chết cả luồng
                continue

            if matched:
                formatted_conclusion = formatter.format(conclusion_tmpl, **context)
                fired_rules.append(
                    RuleFiredInfo(
                        rule_id=rule_id,
                        rule_code=rule_code,
                        priority=priority,
                        conclusion=formatted_conclusion,
                        trace=trace,
                    )
                )

        # Giải quyết xung đột theo priority DESC, rule_id ASC (ADR-004)
        fired_rules.sort(key=lambda x: (x.priority, -x.rule_id), reverse=True)
        return fired_rules

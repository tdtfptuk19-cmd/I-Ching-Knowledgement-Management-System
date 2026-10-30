#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
synthesis_engine.py - Bộ tổng hợp tri thức (Synthesis Engine) cho KinhDich_KB
Hiện thực hóa:
- Kết hợp 3 trụ cột tri thức theo ADR-002:
    S_total = W_elem * S_elem + W_rules * S_rules + W_interp * S_interp
- Phân rã điểm minh bạch (Decomposition)
- Phân loại nhãn Cát / Hung theo ngưỡng định nghĩa
- Xử lý an toàn nội dung cho các chủ đề nhạy cảm (HEALTH, FINANCE)
- Quản lý trạng thái độ phủ tri thức (CoverageInfo) và cơ chế fallback
"""
from typing import List, Dict, Any, Optional
from process_layer.app.schemas.divination import (
    FiveElementRelationAnalysis,
    RuleFiredInfo,
    SynthesisResult,
    CoverageInfo,
    Topic,
)
from process_layer.app.core.config import settings


class SynthesisEngine:
    """Bộ điều phối tổng hợp tri thức và đánh giá Cát/Hung."""

    @staticmethod
    def calculate_element_score(
        five_analysis: List[FiveElementRelationAnalysis],
    ) -> float:
        """
        Tính điểm Ngũ hành 3 chặng (ADR-002):
        S_elem = w_main * P_main + w_nuc * ((P_unuc + P_lnuc) / 2) + w_trans * P_trans
        """
        p_main = 0.0
        p_unuc = 0.0
        p_lnuc = 0.0
        p_trans = 0.0

        for a in five_analysis:
            if a.pair == "THE_DUNG_MAIN":
                p_main = float(a.polarity_weight)
            elif a.pair == "THE_UPPER_NUCLEAR":
                p_unuc = float(a.polarity_weight)
            elif a.pair == "THE_LOWER_NUCLEAR":
                p_lnuc = float(a.polarity_weight)
            elif a.pair == "THE_TRANSFORMED_DUNG":
                p_trans = float(a.polarity_weight)

        p_nuc = (p_unuc + p_lnuc) / 2.0
        score_elem = (
            settings.WEIGHT_ELEM_MAIN * p_main
            + settings.WEIGHT_ELEM_NUCLEAR * p_nuc
            + settings.WEIGHT_ELEM_TRANSFORMED * p_trans
        )
        return max(-2.0, min(2.0, score_elem))

    @staticmethod
    def calculate_rule_score(fired_rules: List[RuleFiredInfo]) -> float:
        """
        Tính điểm đóng góp từ các quy tắc suy luận đã kích hoạt.
        Nếu không có luật nào kích hoạt, trả về 0.0.
        """
        if not fired_rules:
            return 0.0

        # Ưu tiên luật có priority cao nhất
        # Điểm luật được tính dựa trên số lượng luật cát/hung hoặc trọng số luật
        # Nếu luật liên quan đến sinh nhập/tỷ hòa -> dương; khắc nhập/sinh xuất -> âm
        rule_scores = []
        for r in fired_rules:
            code = r.rule_code.upper()
            if "SINH_NHAP" in code:
                rule_scores.append(2.0)
            elif "TY_HOA" in code:
                rule_scores.append(1.0)
            elif "KHAC_XUAT" in code:
                rule_scores.append(0.0)
            elif "SINH_XUAT" in code:
                rule_scores.append(-1.0)
            elif "KHAC_NHAP" in code:
                rule_scores.append(-2.0)
            else:
                rule_scores.append(0.0)

        if not rule_scores:
            return 0.0
        return sum(rule_scores) / len(rule_scores)

    @staticmethod
    def calculate_interpretation_score(
        interpretations: List[Dict[str, Any]], target_topic: str
    ) -> float:
        """
        Tính điểm trung bình từ các diễn giải chuyên gia đã duyệt.
        Ưu tiên diễn giải đúng topic, fallback sang GENERAL.
        """
        if not interpretations:
            return 0.0

        topic_pols = [
            float(i.get("polarity", 0))
            for i in interpretations
            if i.get("topic") == target_topic
        ]
        if topic_pols:
            return sum(topic_pols) / len(topic_pols)

        general_pols = [
            float(i.get("polarity", 0))
            for i in interpretations
            if i.get("topic") == "GENERAL"
        ]
        if general_pols:
            return sum(general_pols) / len(general_pols)

        return 0.0

    @classmethod
    def synthesize(
        cls,
        topic: Topic,
        initial_name: str,
        moving_line: int,
        transformed_name: str,
        the_element: str,
        dung_element: str,
        five_analysis: List[FiveElementRelationAnalysis],
        fired_rules: List[RuleFiredInfo],
        interpretations: List[Dict[str, Any]],
        classic_texts: List[Dict[str, Any]],
    ) -> tuple[SynthesisResult, CoverageInfo]:
        """
        Tổng hợp toàn diện 3 trụ cột tri thức, sinh lời khuyên và đánh giá độ phủ.
        """
        score_elem = cls.calculate_element_score(five_analysis)
        score_rules = cls.calculate_rule_score(fired_rules)
        score_interp = cls.calculate_interpretation_score(interpretations, topic.value)

        # Tính tổng hợp theo trọng số ADR-002
        has_rules = len(fired_rules) > 0
        has_interp = len(interpretations) > 0

        # Nếu thiếu rules hoặc interpretations đã duyệt (ví dụ đang ở PENDING),
        # tự động điều chỉnh tỷ trọng để đảm bảo tính tất định và không làm méo mó điểm
        if has_rules and has_interp:
            total_score = (
                settings.WEIGHT_ELEMENT * score_elem
                + settings.WEIGHT_RULES * score_rules
                + settings.WEIGHT_INTERPRETATION * score_interp
            )
        elif has_rules and not has_interp:
            norm_factor = settings.WEIGHT_ELEMENT + settings.WEIGHT_RULES
            total_score = (
                (settings.WEIGHT_ELEMENT / norm_factor) * score_elem
                + (settings.WEIGHT_RULES / norm_factor) * score_rules
            )
        elif not has_rules and has_interp:
            norm_factor = settings.WEIGHT_ELEMENT + settings.WEIGHT_INTERPRETATION
            total_score = (
                (settings.WEIGHT_ELEMENT / norm_factor) * score_elem
                + (settings.WEIGHT_INTERPRETATION / norm_factor) * score_interp
            )
        else:
            # Chỉ có điểm ngũ hành (fallback hoàn toàn)
            total_score = score_elem

        total_score = max(-2.0, min(2.0, round(total_score, 2)))

        # Nhãn phân cực (ADR-002)
        if total_score >= 1.20:
            pol_label = "ĐẠI CÁT"
        elif total_score >= 0.40:
            pol_label = "TIỂU CÁT"
        elif total_score >= -0.40:
            pol_label = "BÌNH HÒA"
        elif total_score >= -1.20:
            pol_label = "TIỂU HUNG"
        else:
            pol_label = "ĐẠI HUNG"

        # Sinh lời khuyên chính và các khối tư vấn
        main_rel = five_analysis[0] if five_analysis else None
        main_desc = main_rel.interpretation if main_rel else ""

        primary_conclusion = (
            f"Quẻ {initial_name} động hào {moving_line} biến {transformed_name}. "
            f"Chủ thể (Thể: {the_element}) và Ngoại cảnh (Dụng: {dung_element}). {main_desc}"
        )

        advice_blocks = [
            {
                "title": f"Định hướng {pol_label} cho Quẻ {initial_name}",
                "content": primary_conclusion,
                "provenance": {"source_id": 15, "rule_ref": "MAI_HOA_THE_DUNG"},
            }
        ]

        # Bổ sung kết luận từ luật ưu tiên cao nhất
        if fired_rules:
            top_rule = fired_rules[0]
            advice_blocks.append(
                {
                    "title": f"Quy tắc suy luận: {top_rule.rule_code}",
                    "content": top_rule.conclusion,
                    "provenance": {
                        "rule_id": top_rule.rule_id,
                        "rule_code": top_rule.rule_code,
                        "priority": top_rule.priority,
                    },
                }
            )

        # Bổ sung diễn giải bối cảnh chuyên đề nếu có
        for interp in interpretations:
            if interp.get("topic") == topic.value:
                advice_blocks.append(
                    {
                        "title": f"Diễn giải chuyên đề ({topic.value})",
                        "content": f"{interp.get('summary', '')} - Lời khuyên: {interp.get('guidance', '')}",
                        "provenance": {
                            "interpretation_id": interp.get("interpretation_id"),
                            "author_type": interp.get("author_type"),
                        },
                    }
                )
                break

        # An toàn nội dung cho HEALTH và FINANCE
        if topic == Topic.HEALTH:
            advice_blocks.append(
                {
                    "title": "Cảnh báo Sức khỏe",
                    "content": "Ý nghĩa biểu tượng ngũ hành thể hiện trạng thái quân bình. Mọi vấn đề thể chất cần tham vấn trực tiếp với bác sĩ chuyên khoa.",
                    "provenance": {"note": "CONTENT_SAFETY_HEALTH"},
                }
            )
        elif topic == Topic.FINANCE:
            advice_blocks.append(
                {
                    "title": "Cảnh báo Tài chính",
                    "content": "Lời khuyên mang tính triết học về thời cơ và quản lý rủi ro, không phải khuyến nghị đầu tư tài chính.",
                    "provenance": {"note": "CONTENT_SAFETY_FINANCE"},
                }
            )

        synthesis_result = SynthesisResult(
            score=total_score,
            normalized_score=round((total_score + 2.0) / 4.0, 2),
            polarity_label=pol_label,
            primary_conclusion=primary_conclusion,
            advice_blocks=advice_blocks,
            decomposition={
                "element_score": round(score_elem, 2),
                "rule_score": round(score_rules, 2),
                "interpretation_score": round(score_interp, 2),
            },
        )

        # Quản lý độ phủ tri thức (CoverageInfo)
        has_custom_topic = any(i.get("topic") == topic.value for i in interpretations)
        fallback_applied = (not has_rules) or (not has_custom_topic and topic != Topic.GENERAL)
        is_complete = len(classic_texts) > 0 and (has_custom_topic or topic == Topic.GENERAL) and has_rules

        if not fallback_applied:
            coverage_msg = "Độ phủ tri thức hoàn chỉnh từ Data Layer (đầy đủ 3 trụ cột)."
        else:
            missing_pillars = []
            if not has_rules:
                missing_pillars.append("chưa có luật suy luận APPROVED trong CSDL")
            if not has_custom_topic and topic != Topic.GENERAL:
                missing_pillars.append(f"chưa có diễn giải chuyên đề ({topic.value}) đã duyệt")
            reason_str = " và ".join(missing_pillars) if missing_pillars else "dữ liệu tri thức chưa hoàn chỉnh"
            coverage_msg = f"Đang áp dụng tái chuẩn hóa dự phòng (fallback) do {reason_str}."

        coverage_info = CoverageInfo(
            is_complete=is_complete,
            classic_texts_count=len(classic_texts),
            has_custom_topic_interpretation=has_custom_topic,
            fallback_applied=fallback_applied,
            message=coverage_msg,
        )

        return synthesis_result, coverage_info

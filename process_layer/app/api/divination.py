#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
divination.py - API Router cho dịch vụ gieo quẻ Mai Hoa Dịch Số
Hiện thực hóa:
- POST /api/v1/divination
- GET /api/v1/lunar/convert
"""
from fastapi import APIRouter, Query, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional

from process_layer.app.schemas.divination import (
    DivinationRequest,
    DivinationResponse,
    CastingMethod,
    RatHourRule,
    UserLevel,
    Topic,
    HexagramInfo,
    TrigramInfo,
    FiveElementRelationAnalysis,
    RuleFiredInfo,
    SynthesisResult,
    CoverageInfo,
)
from process_layer.app.engines.casting_engine import (
    cast_mai_hoa_time,
    cast_mai_hoa_number,
)
from process_layer.app.engines.lunar_calendar import convert_datetime_for_casting
from process_layer.app.engines.rule_engine import RuleEngine
from process_layer.app.engines.synthesis_engine import SynthesisEngine
from process_layer.app.core.security import hash_user_id
from process_layer.app.db.repository import DivinationRepository
from process_layer.app.core.config import settings
from process_layer.app.core.errors import ValidationError

router = APIRouter(prefix="", tags=["Divination"])

DISCLAIMER_TEXT = (
    "Kết quả suy luận mang tính chất tham khảo văn hóa, triết học và định hướng tư duy "
    "dựa trên hệ thống biểu tượng Kinh Dịch và Mai Hoa Dịch Số cổ truyền. "
    "Hệ thống không đưa ra khẳng định chắc chắn về tương lai."
)


@router.post("/divination", response_model=DivinationResponse)
def post_divination(req: DivinationRequest):
    """
    Tiếp nhận dữ kiện gieo quẻ, phân định Thể - Dụng, lập quẻ Chủ/Hỗ/Biến,
    truy vấn kinh văn nguyên tử và tổng hợp kết quả có truy vết nguồn.
    """
    # 1. Thực hiện lập quẻ (Sense-making)
    if req.casting_method == CastingMethod.MAI_HOA_TIME:
        if req.solar_datetime:
            try:
                dt = datetime.fromisoformat(req.solar_datetime)
            except Exception:
                raise HTTPException(
                    status_code=422,
                    detail={"code": "VALIDATION_ERROR", "message": "solar_datetime không đúng định dạng ISO 8601"},
                )
        else:
            dt = datetime.now(timezone(timedelta(hours=7)))

        rat_rule = req.rat_hour_rule.value if req.rat_hour_rule else settings.DEFAULT_RAT_HOUR_RULE
        casting_res = cast_mai_hoa_time(dt, rat_hour_rule=rat_rule)

    elif req.casting_method == CastingMethod.MAI_HOA_NUMBER:
        if req.number_upper is None or req.number_lower is None:
            raise HTTPException(
                status_code=422,
                detail={"code": "VALIDATION_ERROR", "message": "Phương pháp MAI_HOA_NUMBER yêu cầu number_upper và number_lower >= 1"},
            )
        casting_res = cast_mai_hoa_number(req.number_upper, req.number_lower)
    else:
        raise HTTPException(
            status_code=422,
            detail={"code": "VALIDATION_ERROR", "message": "casting_method không hợp lệ"},
        )

    # 2. Ẩn danh hóa người dùng bằng HMAC-SHA256
    user_hash = hash_user_id(req.user_id)

    # 3. Phân tích quan hệ Ngũ hành cơ sở từ Mai Hoa Dịch Số (Thiệu Ung)
    # Xác định quan hệ Thể - Dụng Quẻ Chủ
    the_elem = casting_res["the_element"]
    dung_elem = casting_res["dung_element"]

    # Xác định loại quan hệ và polarity_weight theo ADR-002
    elem_order = ["MOC", "HOA", "THO", "KIM", "THUY"]
    # Sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc
    # Khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc
    sinh_map = {"MOC": "HOA", "HOA": "THO", "THO": "KIM", "KIM": "THUY", "THUY": "MOC"}
    khac_map = {"MOC": "THO", "THO": "THUY", "THUY": "HOA", "HOA": "KIM", "KIM": "MOC"}

    def get_relation(the: str, dung: str) -> tuple:
        if the == dung:
            return ("TY_HOA", 1, "Thể Dụng Tỷ Hòa: Cát, đồng thanh tương ứng, đồng khí tương cầu.")
        if sinh_map.get(dung) == the:
            return ("SINH_NHAP", 2, "Dụng sinh Thể: Đại Cát, việc đến bồi đắp cho mình, thuận lợi tiến ích.")
        if sinh_map.get(the) == dung:
            return ("SINH_XUAT", -1, "Thể sinh Dụng: Tiểu Hung, chủ sinh xuất tiết khí, hao tài tốn lực.")
        if khac_map.get(the) == dung:
            return ("KHAC_XUAT", 0, "Thể khắc Dụng: Bình hòa, chế ngự được sự việc nhưng tổn hao sức lực, việc thành nhưng trì trệ.")
        if khac_map.get(dung) == the:
            return ("KHAC_NHAP", -2, "Dụng khắc Thể: Đại Hung, nghịch cảnh đè nén, tổn hại chủ thể.")
        return ("TY_HOA", 0, "Quan hệ trung tính.")

    rel_main_type, rel_main_weight, rel_main_desc = get_relation(the_elem, dung_elem)
    five_analysis = [
        FiveElementRelationAnalysis(
            pair="THE_DUNG_MAIN",
            primary_element=the_elem,
            target_element=dung_elem,
            relation_type=rel_main_type,
            polarity_weight=rel_main_weight,
            interpretation=rel_main_desc,
            source_id=15,
        )
    ]

    # Phân tích quan hệ Thể - Quẻ Hỗ
    upper_nuc_elem = casting_res["nuclear_elements"]["upper_nuclear_element"]
    lower_nuc_elem = casting_res["nuclear_elements"]["lower_nuclear_element"]
    rel_unuc_type, rel_unuc_weight, rel_unuc_desc = get_relation(the_elem, upper_nuc_elem)
    rel_lnuc_type, rel_lnuc_weight, rel_lnuc_desc = get_relation(the_elem, lower_nuc_elem)
    five_analysis.append(
        FiveElementRelationAnalysis(
            pair="THE_UPPER_NUCLEAR",
            primary_element=the_elem,
            target_element=upper_nuc_elem,
            relation_type=rel_unuc_type,
            polarity_weight=rel_unuc_weight,
            interpretation=f"Thượng Hỗ: {rel_unuc_desc}",
            source_id=15,
        )
    )
    five_analysis.append(
        FiveElementRelationAnalysis(
            pair="THE_LOWER_NUCLEAR",
            primary_element=the_elem,
            target_element=lower_nuc_elem,
            relation_type=rel_lnuc_type,
            polarity_weight=rel_lnuc_weight,
            interpretation=f"Hạ Hỗ: {rel_lnuc_desc}",
            source_id=15,
        )
    )

    # Phân tích quan hệ Thể - Dụng Quẻ Biến
    trans_dung_elem = casting_res["transformed_elements"]["transformed_dung_element"]
    rel_trans_type, rel_trans_weight, rel_trans_desc = get_relation(the_elem, trans_dung_elem)
    five_analysis.append(
        FiveElementRelationAnalysis(
            pair="THE_TRANSFORMED_DUNG",
            primary_element=the_elem,
            target_element=trans_dung_elem,
            relation_type=rel_trans_type,
            polarity_weight=rel_trans_weight,
            interpretation=f"Biến Quái (Kết quả): {rel_trans_desc}",
            source_id=15,
        )
    )

    # 4. Thực thi Hệ luật suy luận (Rule Engine)
    init_hid = casting_res["initial_hexagram"]["hexagram_id"]
    rule_context = {
        "the_element": the_elem,
        "dung_element": dung_elem,
        "relation_type": rel_main_type,
        "polarity_weight": rel_main_weight,
        "moving_line": casting_res["moving_line"],
        "dung_side": casting_res["dung_side"],
        "initial_hexagram_id": init_hid,
        "transformed_hexagram_id": casting_res["transformed_hexagram"]["hexagram_id"],
        "nuclear_hexagram_id": casting_res["nuclear_hexagram"]["hexagram_id"],
        "upper_trigram": casting_res["initial_hexagram"]["upper_trigram"]["name_vn"],
        "lower_trigram": casting_res["initial_hexagram"]["lower_trigram"]["name_vn"],
        "upper_nuclear_trigram": upper_nuc_elem,
        "lower_nuclear_trigram": lower_nuc_elem,
        "topic": req.topic.value,
    }

    try:
        approved_rules = DivinationRepository.get_approved_inference_rules(school="PLUM_BLOSSOM")
    except Exception:
        approved_rules = []

    fired_rules = RuleEngine.evaluate_rules(approved_rules, rule_context)

    # 5. Truy vấn kinh văn và diễn giải từ CSDL qua View
    u_level = req.user_level.value if req.user_level else "NOVICE"

    try:
        classic_texts = DivinationRepository.get_classic_texts(init_hid, user_level=u_level)
    except Exception:
        classic_texts = []

    try:
        interps = DivinationRepository.get_approved_interpretations(init_hid, topic=req.topic.value)
    except Exception:
        interps = []

    # 6. Tổng hợp tri thức 3 trụ cột qua Synthesis Engine (ADR-002)
    synthesis, coverage = SynthesisEngine.synthesize(
        topic=req.topic,
        initial_name=casting_res["initial_hexagram"]["name_vn"],
        moving_line=casting_res["moving_line"],
        transformed_name=casting_res["transformed_hexagram"]["name_vn"],
        the_element=the_elem,
        dung_element=dung_elem,
        five_analysis=five_analysis,
        fired_rules=fired_rules,
        interpretations=interps,
        classic_texts=classic_texts,
    )

    # 7. Đối tượng lưu vào system_output_summary (Double-loop learning ADR-005)
    summary_obj = {
        "engine_version": settings.VERSION,
        "casting_method": req.casting_method.value,
        "lunar_meta": casting_res.get("lunar_meta"),
        "trigram_analysis": {
            "initial_hex_id": init_hid,
            "transformed_hex_id": casting_res["transformed_hexagram"]["hexagram_id"],
            "nuclear_hex_id": casting_res["nuclear_hexagram"]["hexagram_id"],
            "moving_line": casting_res["moving_line"],
            "dung_side": casting_res["dung_side"],
            "the_element": the_elem,
            "dung_element": dung_elem,
        },
        "relations_used": [a.model_dump() for a in five_analysis],
        "rules_fired": [r.model_dump() for r in fired_rules],
        "interpretation_ids": [i.get("interpretation_id") for i in interps if i.get("interpretation_id")],
        "classic_text_ids": [t.get("text_id") for t in classic_texts if t.get("text_id")],
        "synthesis": synthesis.model_dump(),
    }

    # 8. Ghi nhận ca gieo vào DB qua sp_create_case
    try:
        l_info = casting_res.get("lunar_meta") or {}
        case_id = DivinationRepository.create_case(
            pseudonymized_user_hash=user_hash,
            topic=req.topic.value,
            casting_method=req.casting_method.value,
            session_time=l_info.get("solar_datetime"),
            year_branch_num=l_info.get("year_branch_num"),
            lunar_month=l_info.get("lunar_month"),
            lunar_day=l_info.get("lunar_day"),
            hour_branch_num=l_info.get("hour_branch_num"),
            number_upper=casting_res.get("raw_numbers", {}).get("number_upper"),
            number_lower=casting_res.get("raw_numbers", {}).get("number_lower"),
            system_output_summary=summary_obj,
        )
    except Exception as e:
        # Fallback offline case ID nếu DB không khả dụng trong test
        import uuid
        case_id = str(uuid.uuid4())

    return DivinationResponse(
        case_id=case_id,
        disclaimer=DISCLAIMER_TEXT,
        casting_meta={
            "casting_method": req.casting_method.value,
            "user_level": u_level,
            "pseudonymized_user_hash": user_hash,
            "lunar_meta": casting_res.get("lunar_meta"),
            "raw_numbers": casting_res.get("raw_numbers"),
        },
        initial_hexagram=casting_res["initial_hexagram"],
        transformed_hexagram=casting_res["transformed_hexagram"],
        nuclear_hexagram=casting_res["nuclear_hexagram"],
        moving_line=casting_res["moving_line"],
        dung_side=casting_res["dung_side"],
        the_element=the_elem,
        dung_element=dung_elem,
        five_element_analysis=five_analysis,
        rules_fired=fired_rules,
        classic_texts=classic_texts,
        interpretations=interps,
        synthesis=synthesis,
        coverage=coverage,
    )


@router.get("/lunar/convert")
def get_lunar_convert(
    solar_date: str = Query(..., description="Thời điểm dương lịch ISO 8601, ví dụ: 2026-10-20T23:30:00+07:00"),
    rat_hour_rule: RatHourRule = Query(RatHourRule.NEXT_DAY, description="Quy ước Giờ Tý: NEXT_DAY hoặc SAME_DAY"),
):
    """Tiện ích quy đổi lịch âm dương phục vụ UI xác nhận trước khi gieo quẻ."""
    try:
        dt = datetime.fromisoformat(solar_date)
    except Exception:
        raise HTTPException(status_code=422, detail="solar_date không đúng định dạng ISO 8601")

    res = convert_datetime_for_casting(dt, rat_hour_rule=rat_hour_rule.value)
    return res

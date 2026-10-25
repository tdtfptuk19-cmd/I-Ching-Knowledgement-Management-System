#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
divination.py - API Router cho dịch vụ gieo quẻ Mai Hoa Dịch Số
Hiện thực hóa:
- POST /api/v1/divination
- GET /api/v1/lunar/convert
"""
import collections
from datetime import datetime, timezone, timedelta
import hashlib
import json
import threading
import time
from typing import Any, Dict, List, Optional, Tuple
import unicodedata

from fastapi import APIRouter, Query, HTTPException, Depends

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
from process_layer.app.schemas.dich_su import (
    InterpretRequest,
    InterpretResponse,
    UserLevelEnum,
)
from process_layer.app.engines.casting_engine import (
    cast_mai_hoa_time,
    cast_mai_hoa_number,
)
from process_layer.app.engines.lunar_calendar import convert_datetime_for_casting
from process_layer.app.engines.rule_engine import RuleEngine
from process_layer.app.engines.synthesis_engine import SynthesisEngine
from process_layer.app.engines.dich_su_service import DichSuService
from process_layer.app.core.security import hash_user_id
from process_layer.app.db.repository import DivinationRepository
from process_layer.app.core.config import settings
from process_layer.app.core.errors import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)

router = APIRouter(prefix="", tags=["Divination"])

DISCLAIMER_TEXT = (
    "Kết quả suy luận mang tính chất tham khảo văn hóa, triết học và định hướng tư duy "
    "dựa trên hệ thống biểu tượng Kinh Dịch và Mai Hoa Dịch Số cổ truyền. "
    "Hệ thống không đưa ra khẳng định chắc chắn về tương lai."
)


class InterpretationCache:
    """
    In-memory LRU cache with TTL expiration and thread-safe locking.
    Satisfies R4 and AC-15 requirements.
    """
    def __init__(self, max_size: int = 1000, ttl_seconds: float = 3600.0):
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._cache: collections.OrderedDict[str, Tuple[float, Dict[str, Any]]] = collections.OrderedDict()
        self._lock = threading.Lock()

    def generate_key(
        self,
        case_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        user_level: Optional[str] = None,
        user_question: Optional[str] = None,
    ) -> str:
        """Sinh mã băm SHA-256 xác định cho bộ khóa (source, level, question)."""
        if case_id:
            src_part = f"case:{case_id.strip()}"
        elif payload:
            norm_payload = json.dumps(payload, sort_keys=True, ensure_ascii=False)
            src_part = f"payload:{hashlib.sha256(norm_payload.encode('utf-8')).hexdigest()}"
        else:
            src_part = "empty"

        lvl_part = str(user_level or "BEGINNER").strip().upper()
        if lvl_part == "NOVICE":
            lvl_part = "BEGINNER"
        elif lvl_part == "PRACTITIONER":
            lvl_part = "INTERMEDIATE"

        q_clean = unicodedata.normalize("NFC", str(user_question or "").strip())
        raw_str = f"{src_part}::{lvl_part}::{q_clean}"
        return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Truy vấn cache, kiểm tra TTL, cập nhật vị trí LRU."""
        with self._lock:
            if key not in self._cache:
                return None

            created_at, response_data = self._cache[key]
            if time.monotonic() - created_at > self._ttl_seconds:
                del self._cache[key]
                return None

            self._cache.move_to_end(key)
            return response_data

    def set(self, key: str, response_data: Dict[str, Any]) -> None:
        """Ghi vào cache, thực hiện thu hồi LRU nếu vượt ngưỡng max_size."""
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            elif len(self._cache) >= self._max_size:
                self._cache.popitem(last=False)

            self._cache[key] = (time.monotonic(), response_data)

    def clear(self) -> None:
        """Xóa toàn bộ cache (hỗ trợ kiểm thử cô lập)."""
        with self._lock:
            self._cache.clear()


# Module-level singletons
interpretation_cache = InterpretationCache()
_CASE_STORE: Dict[str, Any] = {}


def get_dich_su_service() -> DichSuService:
    """FastAPI dependency provider cho DichSuService."""
    return DichSuService()



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

    response_obj = DivinationResponse(
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
    _CASE_STORE[case_id] = response_obj.model_dump()
    return response_obj


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


@router.post(
    "/divination/interpret",
    response_model=InterpretResponse,
    summary="Luận giải quẻ Mai Hoa Dịch Số qua Trợ lý Dịch sư (R4)",
    tags=["Divination"],
)
def post_interpret_divination(
    req: InterpretRequest,
    service: DichSuService = Depends(get_dich_su_service),
) -> InterpretResponse:
    """
    Tiếp nhận yêu cầu luận giải, tra cứu case_id hoặc nhận divination_payload,
    kiểm tra cache LRU/TTL, và thực hiện luận giải 3 mục chuẩn Mai Hoa Dịch Số.
    """
    # 1. Tra cứu và bảo mật nguồn dữ kiện
    if req.case_id:
        payload = _CASE_STORE.get(req.case_id)
        if payload is None:
            try:
                ext = DivinationRepository.get_divination_extended_result(req.case_id)
                if ext:
                    payload = ext
            except Exception:
                pass
        if payload is None:
            raise NotFoundError("Không tìm thấy ca gieo quẻ với case_id đã cho.")
    elif req.divination_payload:
        if not settings.ALLOW_CLIENT_PAYLOAD:
            raise PermissionDeniedError(
                "Chế độ gửi trực tiếp divination_payload bị vô hiệu hóa (ALLOW_CLIENT_PAYLOAD=False). Vui lòng cung cấp case_id."
            )
        payload = req.divination_payload
    else:
        raise ValidationError("Cần cung cấp ít nhất 'case_id' hoặc 'divination_payload'.")

    # 2. Tra cứu bộ nhớ đệm (LRU + TTL Caching)
    cache_key = interpretation_cache.generate_key(
        case_id=req.case_id,
        payload=payload,
        user_level=req.user_level,
        user_question=req.user_question,
    )
    cached_dict = interpretation_cache.get(cache_key)
    if cached_dict is not None:
        return InterpretResponse(**cached_dict)

    # 3. Thực hiện luận giải qua DichSuService
    result_dict = service.interpret(
        payload=payload,
        user_question=req.user_question,
        user_level=req.user_level,
    )

    # 4. Ghi nhận kết quả vào bộ nhớ đệm
    interpretation_cache.set(cache_key, result_dict)

    return InterpretResponse(**result_dict)


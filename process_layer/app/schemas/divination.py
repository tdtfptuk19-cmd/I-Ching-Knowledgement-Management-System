#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
divination.py - Schema Pydantic v2 cho các endpoint Gieo quẻ Mai Hoa
"""
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class CastingMethod(str, Enum):
    MAI_HOA_TIME = "MAI_HOA_TIME"
    MAI_HOA_NUMBER = "MAI_HOA_NUMBER"


class Topic(str, Enum):
    CAREER = "CAREER"
    RELATIONSHIP = "RELATIONSHIP"
    FINANCE = "FINANCE"
    HEALTH = "HEALTH"
    ACADEMIC = "ACADEMIC"
    GENERAL = "GENERAL"


class UserLevel(str, Enum):
    NOVICE = "NOVICE"
    PRACTITIONER = "PRACTITIONER"
    EXPERT = "EXPERT"


class RatHourRule(str, Enum):
    NEXT_DAY = "NEXT_DAY"
    SAME_DAY = "SAME_DAY"


class DivinationRequest(BaseModel):
    casting_method: CastingMethod = Field(..., description="Phương pháp gieo: MAI_HOA_TIME hoặc MAI_HOA_NUMBER")
    topic: Topic = Field(Topic.GENERAL, description="Chủ đề quan tâm cần chiêm đoán")
    solar_datetime: Optional[str] = Field(None, description="Thời điểm dương lịch ISO 8601 (cho MAI_HOA_TIME)")
    rat_hour_rule: Optional[RatHourRule] = Field(RatHourRule.NEXT_DAY, description="Quy ước giờ Tý: NEXT_DAY (mặc định) hoặc SAME_DAY")
    number_upper: Optional[int] = Field(None, ge=1, description="Số thứ nhất gieo quẻ Thượng (cho MAI_HOA_NUMBER)")
    number_lower: Optional[int] = Field(None, ge=1, description="Số thứ hai gieo quẻ Hạ (cho MAI_HOA_NUMBER)")
    user_id: Optional[str] = Field("anonymous_guest", description="Định danh người dùng (được băm HMAC-SHA256)")
    user_level: Optional[UserLevel] = Field(UserLevel.NOVICE, description="Trình độ người dùng để cá nhân hóa kết quả")


class TrigramInfo(BaseModel):
    id: int
    name_vn: str
    name_han: str
    binary_code: str
    five_element: str
    nature_symbol: str


class HexagramInfo(BaseModel):
    hexagram_id: int
    name_vn: str
    name_han: str
    binary_code: str
    upper_trigram: TrigramInfo
    lower_trigram: TrigramInfo


class FiveElementRelationAnalysis(BaseModel):
    pair: str
    primary_element: str
    target_element: str
    relation_type: str
    polarity_weight: int
    interpretation: str
    source_id: int = 15


class RuleFiredInfo(BaseModel):
    rule_id: int
    rule_code: str
    priority: int
    conclusion: str
    trace: Dict[str, Any]


class SynthesisResult(BaseModel):
    score: float
    normalized_score: float
    polarity_label: str
    primary_conclusion: str
    advice_blocks: List[Dict[str, Any]]
    decomposition: Dict[str, float]


class CoverageInfo(BaseModel):
    is_complete: bool
    classic_texts_count: int
    has_custom_topic_interpretation: bool
    fallback_applied: bool
    message: str


class DivinationResponse(BaseModel):
    case_id: str
    disclaimer: str
    casting_meta: Dict[str, Any]
    initial_hexagram: HexagramInfo
    transformed_hexagram: HexagramInfo
    nuclear_hexagram: HexagramInfo
    moving_line: int
    dung_side: str
    the_element: str
    dung_element: str
    five_element_analysis: List[FiveElementRelationAnalysis]
    rules_fired: List[RuleFiredInfo]
    classic_texts: List[Dict[str, Any]]
    interpretations: List[Dict[str, Any]]
    synthesis: SynthesisResult
    coverage: CoverageInfo

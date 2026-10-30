#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
governance.py - Schema Pydantic v2 cho Cổng Kiểm duyệt & Vòng lặp Học tập Đôi (Mô-đun 5 & 6)
"""
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class ReviewStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class AuthorType(str, Enum):
    CLASSIC = "CLASSIC"
    EXPERT = "EXPERT"
    AI_DRAFT = "AI_DRAFT"


class TargetType(str, Enum):
    HEXAGRAM = "HEXAGRAM"
    LINE = "LINE"
    TRANSFORMATION = "TRANSFORMATION"


class InterpretationSubmissionRequest(BaseModel):
    target_type: TargetType = Field(..., description="Cấp độ diễn giải: HEXAGRAM, LINE hoặc TRANSFORMATION")
    hexagram_id: int = Field(..., ge=1, le=64, description="Mã quẻ kép (1–64)")
    line_position: Optional[int] = Field(None, ge=1, le=7, description="Vị trí hào (1–7) nếu target_type = LINE")
    moving_line_position: Optional[int] = Field(None, ge=1, le=6, description="Hào động (1–6) nếu target_type = TRANSFORMATION")
    to_hexagram_id: Optional[int] = Field(None, ge=1, le=64, description="Mã quẻ biến nếu target_type = TRANSFORMATION")
    topic: str = Field(..., description="Chủ đề: CAREER, RELATIONSHIP, FINANCE, HEALTH, ACADEMIC, GENERAL")
    summary: str = Field(..., min_length=5, description="Tóm tắt ý nghĩa diễn giải")
    guidance: str = Field(..., min_length=5, description="Lời khuyên hành động thực tiễn")
    polarity: int = Field(..., ge=-2, le=2, description="Điểm định hướng Cát/Hung (-2 đến 2)")
    source_id: int = Field(..., ge=1, description="Mã nguồn tham chiếu")
    author_type: AuthorType = Field(..., description="Phân loại tác quyền: CLASSIC, EXPERT, hoặc AI_DRAFT")
    author_name: Optional[str] = Field("Expert_Contributor", description="Tên định danh tác giả đóng góp")


class SubmissionResponse(BaseModel):
    interpretation_id: int
    review_status: str
    message: str


class ReviewRequest(BaseModel):
    reviewer: str = Field(..., min_length=2, description="Tên định danh của chuyên gia kiểm duyệt")
    new_status: str = Field(..., description="Trạng thái phê duyệt: APPROVED hoặc REJECTED")
    comment: Optional[str] = Field(None, description="Nhận xét của chuyên gia kiểm duyệt")


class ReviewResponse(BaseModel):
    interpretation_id: int
    review_status: str
    reviewed_by: str
    message: str


class FeedbackRequest(BaseModel):
    verified_outcome: str = Field(..., min_length=5, description="Kết quả thực tế diễn ra trong đời sống")
    is_reviewed_for_best_practice: bool = Field(False, description="Gắn cờ ca gieo quẻ mẫu mực")


class FeedbackResponse(BaseModel):
    case_id: str
    verified_outcome: str
    is_reviewed_for_best_practice: bool
    message: str


class GovernanceStatsResponse(BaseModel):
    classic_texts_coverage: Dict[str, Any]
    review_queue: Dict[str, Any]
    sources_breakdown: Dict[str, Any]
    double_loop_learning: Dict[str, Any]
    inference_rules: Optional[Dict[str, Any]] = None
    knowledge_kpi: Optional[Dict[str, Any]] = None


class DoubleLoopLearnRequest(BaseModel):
    learning_rate: float = Field(
        0.05, ge=0.01, le=0.5, description="Hệ số học tập an toàn để điều chỉnh trọng số (eta)"
    )
    dry_run: bool = Field(
        False, description="Chế độ mô phỏng kiểm toán: True chỉ tính toán mà không ghi đè DB"
    )


class RuleWeightUpdateDetail(BaseModel):
    rule_id: int
    rule_code: str
    old_weight: float
    new_weight: float
    delta: float
    matched_cases_count: int


class DoubleLoopLearnResponse(BaseModel):
    best_practices_analyzed: int
    rules_evaluated: int
    rules_updated: List[RuleWeightUpdateDetail]
    dry_run: bool
    generated_candidate_interpretations: int
    message: str


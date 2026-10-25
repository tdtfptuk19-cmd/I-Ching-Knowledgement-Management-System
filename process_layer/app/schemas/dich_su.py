#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dich_su.py - Pydantic v2 schemas for Trợ lý Dịch sư (LLM Assistant) Endpoint (R4).
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class UserLevelEnum(str, Enum):
    """Cấp độ người dùng hợp lệ theo R1, R2, R4."""
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    EXPERT = "EXPERT"
    # Tương thích ngược với alias:
    NOVICE = "NOVICE"
    PRACTITIONER = "PRACTITIONER"


class InterpretRequest(BaseModel):
    """
    Schema yêu cầu luận giải quẻ Mai Hoa Dịch Số từ Trợ lý Dịch sư.
    """
    case_id: Optional[str] = Field(
        None,
        description="Định danh ca gieo quẻ UUID để tra cứu dữ kiện server-side.",
    )
    divination_payload: Optional[Dict[str, Any]] = Field(
        None,
        description="Dữ kiện kết quả gieo quẻ trực tiếp (chỉ nhận khi ALLOW_CLIENT_PAYLOAD=True).",
    )
    user_question: Optional[str] = Field(
        None,
        max_length=500,
        description="Câu hỏi hoặc bối cảnh cần chiêm đoán của người dùng (tối đa 500 ký tự).",
    )
    user_level: Optional[str] = Field(
        "BEGINNER",
        description="Cấp độ người dùng: BEGINNER, INTERMEDIATE, EXPERT (hoặc NOVICE, PRACTITIONER).",
    )

    @field_validator("user_question")
    @classmethod
    def validate_user_question_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("user_question không được vượt quá 500 ký tự (HTTP 422).")
        return v

    @field_validator("user_level", mode="before")
    @classmethod
    def validate_user_level(cls, v: Any) -> Optional[str]:
        if v is None or str(v).strip() == "":
            return "BEGINNER"
        lvl_str = str(v).strip().upper()
        allowed = {"BEGINNER", "INTERMEDIATE", "EXPERT", "NOVICE", "PRACTITIONER"}
        if lvl_str not in allowed:
            raise ValueError(
                f"user_level '{v}' không hợp lệ (HTTP 422). Các cấp độ hợp lệ: BEGINNER, INTERMEDIATE, EXPERT."
            )
        # Chuẩn hóa alias
        if lvl_str == "NOVICE":
            return "BEGINNER"
        if lvl_str == "PRACTITIONER":
            return "INTERMEDIATE"
        return lvl_str

    @model_validator(mode="after")
    def validate_input_source(self) -> "InterpretRequest":
        if not self.case_id and not self.divination_payload:
            raise ValueError(
                "Yêu cầu không hợp lệ (HTTP 422): Phải cung cấp ít nhất 'case_id' hoặc 'divination_payload'."
            )
        return self


class InterpretResponse(BaseModel):
    """
    Schema phản hồi luận giải hoàn chỉnh từ Trợ lý Dịch sư (R4).
    """
    markdown_text: str = Field(
        ...,
        description="Văn bản luận giải 3 mục hoàn chỉnh theo chuẩn định dạng Mai Hoa Dịch Số.",
    )
    citations: List[str] = Field(
        default_factory=list,
        description="Danh sách các thẻ căn cứ hợp lệ được sử dụng trong bài luận giải.",
    )
    is_fallback: bool = Field(
        ...,
        description="Cờ xác định kết quả sinh từ Fallback tất định (True) hay từ mô hình LLM (False).",
    )
    validation_report: Dict[str, Any] = Field(
        default_factory=dict,
        description="Báo cáo kết quả hậu kiểm chi tiết gồm cờ passed và danh sách checks.",
    )
    disclaimer: str = Field(
        ...,
        description="Tuyên bố miễn trừ trách nhiệm lấy từ dữ liệu gốc để tầng UI hiển thị.",
    )
    prompt_version: str = Field(
        ...,
        description="Phiên bản của bản system prompt được nạp (ví dụ 'v3.0').",
    )
    model: str = Field(
        ...,
        description="Tên mô hình LLM đã sinh văn bản hoặc 'deterministic-fallback'.",
    )
    attempts: int = Field(
        ...,
        description="Số lượt sinh đã thực hiện (0, 1 hoặc 2).",
    )

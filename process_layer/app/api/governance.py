#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
governance.py - API Router cho Cổng Kiểm duyệt & Vòng lặp Học tập Đôi (Mô-đun 5 & 6)
Endpoints:
- POST /api/v1/interpretations
- GET /api/v1/review/queue
- PUT /api/v1/interpretations/{id}/review
- PUT /api/v1/divination/{case_id}/feedback
- GET /api/v1/governance/stats
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Path, HTTPException, status

from process_layer.app.schemas.governance import (
    InterpretationSubmissionRequest,
    SubmissionResponse,
    ReviewRequest,
    ReviewResponse,
    FeedbackRequest,
    FeedbackResponse,
    GovernanceStatsResponse,
    DoubleLoopLearnRequest,
    DoubleLoopLearnResponse,
)
from process_layer.app.engines.governance_service import GovernanceService
from process_layer.app.core.errors import AppError

router = APIRouter(prefix="", tags=["Governance & Double-Loop Learning"])


@router.post(
    "/interpretations",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đóng góp diễn giải tri thức mới (Knowledge Contribution)",
)
def post_interpretation(req: InterpretationSubmissionRequest):
    """
    Tiếp nhận bài đóng góp diễn giải. Luôn luôn được lưu ở trạng thái PENDING
    để chờ Hội đồng chuyên gia thẩm định trước khi đưa vào kho tri thức chính thức.
    """
    try:
        return GovernanceService.submit_interpretation(req)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/review/queue",
    response_model=List[Dict[str, Any]],
    summary="Hàng đợi kiểm duyệt tri thức (Review Queue)",
)
def get_review_queue():
    """
    Dành cho người kiểm duyệt (Reviewer) xem danh sách các bài đóng góp
    đang chờ phê duyệt trong hệ thống.
    """
    return GovernanceService.get_review_queue()


@router.put(
    "/interpretations/{id}/review",
    response_model=ReviewResponse,
    summary="Phê duyệt hoặc Từ chối diễn giải (Validation Gate)",
)
def review_interpretation(
    id: int = Path(..., ge=1, description="Mã bài diễn giải cần duyệt"),
    req: ReviewRequest = ...,
):
    """
    Thực hiện phê duyệt (APPROVED) hoặc từ chối (REJECTED) bài diễn giải.
    Ràng buộc: Bắt buộc cung cấp định danh người duyệt.
    """
    try:
        return GovernanceService.review_interpretation(id, req)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.put(
    "/divination/{case_id}/feedback",
    response_model=FeedbackResponse,
    summary="Gửi phản hồi thực chứng cho ca gieo quẻ (Double-Loop Feedback)",
)
def put_divination_feedback(
    case_id: str = Path(..., description="Mã UUID của ca gieo quẻ"),
    req: FeedbackRequest = ...,
):
    """
    Ghi nhận kết quả thực tế từ người dùng nhằm đo lường hiệu năng của các
    quy tắc suy luận và phục vụ vòng lặp học tập đôi (Argyris & Schön 1978).
    """
    try:
        return GovernanceService.record_outcome(case_id, req)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/governance/stats",
    response_model=GovernanceStatsResponse,
    summary="Báo cáo thống kê quản trị tri thức KMS",
)
def get_governance_stats():
    """
    Tổng hợp độ phủ kinh văn, hàng đợi kiểm duyệt, phân bổ nguồn và các chỉ số học tập đôi.
    """
    return GovernanceService.get_governance_stats()


@router.post(
    "/governance/double-loop-learn",
    response_model=DoubleLoopLearnResponse,
    summary="Kích hoạt chu kỳ học tập đôi (Double-Loop Learning Trigger)",
)
def post_double_loop_learn(req: DoubleLoopLearnRequest = DoubleLoopLearnRequest()):
    """
    Kích hoạt tiến trình học tập hai vòng theo Argyris & Schön (1978) và McElroy (1999).
    Hệ thống phân tích các ca Best Practice để tinh chỉnh trọng số quy tắc suy luận
    và đề xuất diễn giải tri thức mới vào hàng đợi kiểm duyệt PENDING.
    """
    try:
        return GovernanceService.double_loop_learn(req)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


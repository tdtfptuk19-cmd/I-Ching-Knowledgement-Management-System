#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_api_ai_advice.py - API integration and contract tests for:
- POST /api/v1/divination/{case_id}/ai-advice
- POST /api/v1/divination/{case_id}/ai-advice/save
"""
import pytest
from fastapi import HTTPException

from process_layer.app.api.divination import (
    _CASE_STORE,
    _CASE_STORE_LOCK,
    post_ai_advice,
    save_ai_advice_draft,
)
from process_layer.app.core.errors import NotFoundError
from process_layer.app.engines.ai_advice_service import (
    AIAdviceService,
    advice_cache,
)
from process_layer.app.engines.governance_service import GovernanceService
from process_layer.app.schemas.dich_su import (
    AIAdviceRequest,
    AIAdviceResponse,
    SaveDraftRequest,
)
from process_layer.app.schemas.governance import SubmissionResponse
from process_layer.tests.test_ai_advice_service import SAMPLE_PAYLOAD


@pytest.fixture(autouse=True)
def setup_case_store():
    with _CASE_STORE_LOCK:
        _CASE_STORE["case-ai-test-1"] = dict(SAMPLE_PAYLOAD)
    yield
    with _CASE_STORE_LOCK:
        _CASE_STORE.pop("case-ai-test-1", None)
    advice_cache.clear()


def test_post_ai_advice_not_found(monkeypatch):
    monkeypatch.setattr(
        "process_layer.app.api.divination.DivinationRepository.build_payload_from_case",
        lambda cid: None,
    )
    req = AIAdviceRequest(topic="CAREER", user_question="Tôi có nên đổi việc?")
    service = AIAdviceService()

    with pytest.raises(NotFoundError) as exc_info:
        post_ai_advice(case_id="non-existent-case-id", req=req, service=service)
    assert "Không tìm thấy ca gieo quẻ" in str(exc_info.value)


def test_post_ai_advice_success():
    req = AIAdviceRequest(topic="CAREER", user_question="Tôi có nên đổi việc?")
    service = AIAdviceService()

    resp = post_ai_advice(case_id="case-ai-test-1", req=req, service=service)
    assert isinstance(resp, AIAdviceResponse)
    assert resp.advice_id is not None
    assert len(resp.content) > 0
    assert resp.provenance.source == "AI_AUGMENTED_RAG"
    assert resp.provenance.author_type == "AI_DRAFT"
    assert resp.draft_payload["target_type"] == "LINE"
    assert resp.draft_payload["topic"] == "CAREER"
    assert resp.draft_payload["line_position"] == 1
    assert -2 <= resp.draft_payload["polarity"] <= 2


def test_save_ai_advice_draft_success_and_expiry(monkeypatch):
    # Mock GovernanceService.submit_interpretation để kiểm thử hermetic
    monkeypatch.setattr(
        GovernanceService,
        "submit_interpretation",
        lambda req: SubmissionResponse(
            interpretation_id=888,
            review_status="PENDING",
            message="Bài đóng góp diễn giải đã được tiếp nhận thành công và chuyển vào hàng đợi kiểm duyệt (PENDING).",
        ),
    )

    # 1. Sinh lời khuyên trước
    service = AIAdviceService()
    advice_resp = post_ai_advice(
        case_id="case-ai-test-1",
        req=AIAdviceRequest(topic="CAREER"),
        service=service,
    )
    advice_id = advice_resp.advice_id

    # 2. Lưu bản thảo lần đầu -> Thành công PENDING
    save_req = SaveDraftRequest(advice_id=advice_id)
    save_res = save_ai_advice_draft(case_id="case-ai-test-1", req=save_req)
    assert isinstance(save_res, SubmissionResponse)
    assert save_res.interpretation_id == 888
    assert save_res.review_status == "PENDING"

    # 3. Lưu bản thảo lần 2 với cùng advice_id -> Bị lỗi 410 DRAFT_EXPIRED
    with pytest.raises(HTTPException) as exc_info:
        save_ai_advice_draft(case_id="case-ai-test-1", req=save_req)
    assert exc_info.value.status_code == 410
    detail = exc_info.value.detail
    assert detail["code"] == "DRAFT_EXPIRED"

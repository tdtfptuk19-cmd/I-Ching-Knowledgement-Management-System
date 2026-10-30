#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_api_divination.py - Kiểm thử tích hợp các endpoint REST API của Mô-đun 1
"""
import pytest
from fastapi.testclient import TestClient
from process_layer.app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def hermetic_create_case(monkeypatch):
    """Đảm bảo kiểm thử hermetic, không ghi dữ liệu rác vào CSDL divination_cases."""
    monkeypatch.setattr(
        "process_layer.app.api.divination.DivinationRepository.create_case",
        lambda **kwargs: "11111111-2222-3333-4444-555555555555",
    )


def test_health_check_endpoint():
    """Kiểm thử GET /api/v1/health."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"


def test_lunar_convert_endpoint():
    """Kiểm thử GET /api/v1/lunar/convert."""
    response = client.get(
        "/api/v1/lunar/convert",
        params={"solar_date": "2026-10-20T23:30:00+07:00", "rat_hour_rule": "NEXT_DAY"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hour_branch_num"] == 1
    assert data["hour_branch_name"] == "Tý"
    assert data["lunar_day"] == 12  # NEXT_DAY tính sang ngày 12


def test_post_divination_number_method():
    """Kiểm thử POST /api/v1/divination với MAI_HOA_NUMBER."""
    payload = {
        "casting_method": "MAI_HOA_NUMBER",
        "topic": "CAREER",
        "number_upper": 1,
        "number_lower": 1,
        "user_id": "user_is1906_test",
        "user_level": "NOVICE",
    }
    response = client.post("/api/v1/divination", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "case_id" in data
    assert data["initial_hexagram"]["hexagram_id"] == 1
    assert data["initial_hexagram"]["name_vn"] == "Thuần Càn"
    assert data["transformed_hexagram"]["hexagram_id"] == 13
    assert data["transformed_hexagram"]["name_vn"] == "Thiên Hỏa Đồng Nhân"
    assert data["moving_line"] == 2
    assert data["dung_side"] == "LOWER"
    assert data["the_element"] == "KIM"
    assert data["dung_element"] == "KIM"
    assert len(data["five_element_analysis"]) == 4
    assert data["five_element_analysis"][0]["relation_type"] == "TY_HOA"
    assert data["disclaimer"] is not None
    assert "decomposition" in data["synthesis"]
    assert "element_score" in data["synthesis"]["decomposition"]
    assert "rule_score" in data["synthesis"]["decomposition"]
    assert "interpretation_score" in data["synthesis"]["decomposition"]
    assert "coverage" in data


def test_post_divination_time_method():
    """Kiểm thử POST /api/v1/divination với MAI_HOA_TIME."""
    payload = {
        "casting_method": "MAI_HOA_TIME",
        "topic": "GENERAL",
        "solar_datetime": "2026-10-20T10:30:00+07:00",
        "rat_hour_rule": "NEXT_DAY",
        "user_level": "EXPERT",
    }
    response = client.post("/api/v1/divination", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "case_id" in data
    assert "casting_meta" in data
    assert data["casting_meta"]["lunar_meta"]["lunar_day"] == 11
    assert data["casting_meta"]["lunar_meta"]["lunar_month"] == 9
    assert data["synthesis"]["polarity_label"] in ["ĐẠI CÁT", "TIỂU CÁT", "BÌNH HÒA", "TIỂU HUNG", "ĐẠI HUNG"]
    assert "decomposition" in data["synthesis"]
    assert "coverage" in data


def test_content_safety_health_and_finance():
    """Kiểm thử an toàn nội dung cho chủ đề HEALTH và FINANCE."""
    # Health check
    res_health = client.post(
        "/api/v1/divination",
        json={"casting_method": "MAI_HOA_NUMBER", "topic": "HEALTH", "number_upper": 3, "number_lower": 5},
    )
    assert res_health.status_code == 200
    blocks_h = res_health.json()["synthesis"]["advice_blocks"]
    assert any("Cảnh báo Sức khỏe" in b["title"] for b in blocks_h)

    # Finance check
    res_fin = client.post(
        "/api/v1/divination",
        json={"casting_method": "MAI_HOA_NUMBER", "topic": "FINANCE", "number_upper": 3, "number_lower": 5},
    )
    assert res_fin.status_code == 200
    blocks_f = res_fin.json()["synthesis"]["advice_blocks"]
    assert any("Cảnh báo Tài chính" in b["title"] for b in blocks_f)


def test_validation_errors():
    """Kiểm thử từ chối tham số lỗi (trả 422)."""
    # Thiếu số gieo quẻ
    res_err1 = client.post(
        "/api/v1/divination",
        json={"casting_method": "MAI_HOA_NUMBER", "topic": "CAREER"},
    )
    assert res_err1.status_code == 422

    # Số âm
    res_err2 = client.post(
        "/api/v1/divination",
        json={"casting_method": "MAI_HOA_NUMBER", "topic": "CAREER", "number_upper": -5, "number_lower": 2},
    )
    assert res_err2.status_code == 422


def test_response_contract_p1_fields(monkeypatch):
    """Kiểm thử hợp đồng P1: source_title/review_status trong interpretations và condition_description trong rules_fired runtime."""
    mock_rules = [
        {
            "rule_id": 999,
            "rule_code": "RULE_KIM_KIM_TY_HOA",
            "priority": 100,
            "condition_description": "Thể và Dụng cùng hành Kim tương hòa vững mạnh",
            "condition_expression": {
                "dsl_version": 1,
                "condition": {"field": "the_element", "op": "eq", "value": "KIM"},
            },
            "conclusion_template": "Tỷ hòa đồng khí",
        }
    ]
    monkeypatch.setattr(
        "process_layer.app.api.divination.DivinationRepository.get_approved_inference_rules",
        lambda **kwargs: mock_rules,
    )
    payload = {
        "casting_method": "MAI_HOA_NUMBER",
        "topic": "CAREER",
        "number_upper": 1,
        "number_lower": 1,
        "user_id": "test_p1_user",
        "user_level": "EXPERT",
    }
    response = client.post("/api/v1/divination", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Quẻ 1 CAREER có diễn giải đã duyệt trong CSDL
    assert len(data.get("interpretations", [])) > 0, "Quẻ 1 CAREER phải có ít nhất 1 bài diễn giải trong CSDL"
    for interp in data["interpretations"]:
        assert "review_status" in interp
        assert interp["review_status"] == "APPROVED"
        assert "source_title" in interp
        assert interp["source_title"] is not None

    # Kiểm tra trường condition_description trong rules_fired runtime
    assert len(data.get("rules_fired", [])) > 0, "Phải có luật kích hoạt qua RuleEngine"
    for rf in data["rules_fired"]:
        assert "condition_description" in rf
        assert rf["condition_description"] == "Thể và Dụng cùng hành Kim tương hòa vững mạnh"

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_api_search.py - Kiểm thử tích hợp các endpoint REST API của Mô-đun 4 (Search & Personalization)
Endpoints:
- GET /api/v1/hexagram/{id}
- GET /api/v1/search
"""
import pytest
from fastapi.testclient import TestClient
from process_layer.app.main import app

client = TestClient(app)


def test_get_hexagram_detail_endpoint_novice():
    """Kiểm thử GET /api/v1/hexagram/1 với cấp độ NOVICE."""
    response = client.get("/api/v1/hexagram/1", params={"user_level": "NOVICE"})
    assert response.status_code == 200
    data = response.json()

    assert data["hexagram_id"] == 1
    assert data["name_vn"] == "Thuần Càn"
    assert data["binary_code"] == "111111"
    assert data["upper_trigram"]["name_vn"] == "Càn"
    assert data["lower_trigram"]["name_vn"] == "Càn"
    assert data["user_level"] == "NOVICE"

    # Kiểm tra kinh văn đã được lọc cho NOVICE: text_han = None
    for t in data["classic_texts"]:
        assert t["text_han"] is None


def test_get_hexagram_detail_endpoint_expert():
    """Kiểm thử GET /api/v1/hexagram/1 với cấp độ EXPERT."""
    response = client.get("/api/v1/hexagram/1", params={"user_level": "EXPERT"})
    assert response.status_code == 200
    data = response.json()

    assert data["user_level"] == "EXPERT"
    # Chuyên gia xem được chữ Hán và trường kiểm toán
    assert any(t.get("text_han") is not None for t in data["classic_texts"])
    assert any("verified_by" in t for t in data["classic_texts"])


def test_get_hexagram_detail_validation_error():
    """Kiểm thử từ chối ID ngoài dải 1..64."""
    res_low = client.get("/api/v1/hexagram/0")
    assert res_low.status_code == 422

    res_high = client.get("/api/v1/hexagram/99")
    assert res_high.status_code == 422


def test_search_endpoint_vietnamese_unaccented():
    """Kiểm thử tìm kiếm tiếng Việt không dấu (NFC / diacritics stripping)."""
    response = client.get("/api/v1/search", params={"q": "thuan can"})
    assert response.status_code == 200
    data = response.json()

    assert data["total"] > 0
    assert any("Thuần Càn" in item["hexagram_name"] for item in data["items"])


def test_search_endpoint_filter_by_trigrams():
    """Kiểm thử lọc đa tiêu chí theo quẻ Thượng và quẻ Hạ."""
    response = client.get(
        "/api/v1/search",
        params={"upper_trigram": "Càn", "lower_trigram": "Càn"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total"] > 0
    for item in data["items"]:
        assert item["hexagram_id"] == 1


def test_search_endpoint_pagination():
    """Kiểm thử phân trang kết quả tìm kiếm."""
    response = client.get("/api/v1/search", params={"page": 1, "page_size": 5})
    assert response.status_code == 200
    data = response.json()

    assert data["page"] == 1
    assert data["page_size"] == 5
    assert len(data["items"]) <= 5
    assert data["total_pages"] >= 1

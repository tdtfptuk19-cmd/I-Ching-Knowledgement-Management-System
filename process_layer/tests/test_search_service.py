#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_search_service.py - Kiểm thử đơn vị cho SearchService (Mô-đun 4)
Kiểm thử:
1. Chuẩn hóa tiếng Việt bỏ dấu (strip_vietnamese_accents).
2. Tra cứu chi tiết quẻ và phân quyền cá nhân hóa theo UserLevel (Wiig 1993, Markus 2001).
3. Từ chối quẻ không hợp lệ.
"""
import pytest
from process_layer.app.engines.search_service import (
    SearchService,
    strip_vietnamese_accents,
)
from process_layer.app.schemas.divination import UserLevel
from process_layer.app.core.errors import ValidationError, NotFoundError


def test_strip_vietnamese_accents():
    assert strip_vietnamese_accents("Thuần Càn") == "thuan can"
    assert strip_vietnamese_accents("Đoài vi Trạch") == "doai vi trach"
    assert strip_vietnamese_accents("Hỏa Phong Đỉnh") == "hoa phong dinh"
    assert strip_vietnamese_accents("") == ""


def test_get_hexagram_detail_personalization():
    # 1. NOVICE: Ẩn chữ Hán, chỉ hiển thị kinh văn cốt lõi
    detail_novice = SearchService.get_hexagram_detail(1, user_level=UserLevel.NOVICE)
    assert detail_novice.hexagram_id == 1
    assert detail_novice.name_vn == "Thuần Càn"
    assert detail_novice.upper_trigram.name_vn == "Càn"
    assert detail_novice.lower_trigram.name_vn == "Càn"
    assert detail_novice.user_level == UserLevel.NOVICE
    # Kiểm tra kinh văn NOVICE
    for t in detail_novice.classic_texts:
        assert t["text_han"] is None
        assert t["text_type"] in ["THOAN_TU", "DAI_TUONG", "HAO_TU"]

    # 2. PRACTITIONER: Đầy đủ tiếng Việt, ẩn trường kiểm toán
    detail_prac = SearchService.get_hexagram_detail(1, user_level=UserLevel.PRACTITIONER)
    assert detail_prac.user_level == UserLevel.PRACTITIONER
    for t in detail_prac.classic_texts:
        assert "confidence" not in t
        assert "source_ref" not in t
        assert "issues" not in t

    # 3. EXPERT: Có chữ Hán nguyên bản và trường kiểm toán
    detail_expert = SearchService.get_hexagram_detail(1, user_level=UserLevel.EXPERT)
    assert detail_expert.user_level == UserLevel.EXPERT
    # Quẻ 1 có chữ Hán trong CSDL
    has_han = any(t.get("text_han") is not None for t in detail_expert.classic_texts)
    assert has_han is True
    # Có thông tin kiểm toán
    has_audit = any("verified_by" in t for t in detail_expert.classic_texts)
    assert has_audit is True


def test_invalid_hexagram_id():
    with pytest.raises(ValidationError):
        SearchService.get_hexagram_detail(0)

    with pytest.raises(ValidationError):
        SearchService.get_hexagram_detail(65)

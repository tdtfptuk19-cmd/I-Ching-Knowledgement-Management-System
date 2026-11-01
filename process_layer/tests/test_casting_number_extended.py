#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_casting_number_extended.py - Kiểm thử mở rộng phương pháp MAI_HOA_NUMBER.
Xác nhận việc bổ sung "số tâm niệm thứ ba" (tùy chọn) chỉ tác động đến hào động,
không làm thay đổi Quẻ Thượng / Quẻ Hạ và giữ nguyên hành vi cũ khi bỏ trống.
"""
import pytest

from process_layer.app.engines.casting_engine import cast_mai_hoa_number


def test_two_numbers_keep_legacy_behaviour():
    """Bỏ trống số thứ ba: hào động vẫn tính theo tổng hai số như trước."""
    res = cast_mai_hoa_number(number_upper=7, number_lower=8)

    assert res["initial_hexagram"]["hexagram_id"] == 23
    assert res["moving_line"] == 3
    assert res["raw_numbers"] == {"number_upper": 7, "number_lower": 8}


def test_third_number_overrides_moving_line_only():
    """Có số thứ ba: chỉ hào động thay đổi theo số tâm niệm."""
    base = cast_mai_hoa_number(number_upper=7, number_lower=8)
    res = cast_mai_hoa_number(number_upper=7, number_lower=8, moving_number=10)

    # Quẻ Chủ giữ nguyên (7 -> Cấn, 8 -> Khôn)
    assert res["initial_hexagram"]["hexagram_id"] == base["initial_hexagram"]["hexagram_id"] == 23
    assert res["initial_hexagram"]["binary_code"] == "100000"

    # Hào động = ((10 - 1) % 6) + 1 = 4
    assert res["moving_line"] == 4
    assert res["raw_numbers"] == {
        "number_upper": 7,
        "number_lower": 8,
        "moving_number": 10,
    }

    # Hào 4 động trên quẻ Sơn Địa Bác -> Hỏa Địa Tấn (35)
    assert res["transformed_hexagram"]["hexagram_id"] == 35
    assert res["dung_side"] == "UPPER"


def test_third_number_wraps_modulo_six():
    """Số thứ ba lớn hơn 6 quy đổi theo modulo 6."""
    res = cast_mai_hoa_number(number_upper=2, number_lower=3, moving_number=6)
    assert res["moving_line"] == 6

    res = cast_mai_hoa_number(number_upper=2, number_lower=3, moving_number=7)
    assert res["moving_line"] == 1


def test_third_number_must_be_positive():
    """Số thứ ba không hợp lệ bị từ chối."""
    with pytest.raises(ValueError):
        cast_mai_hoa_number(number_upper=2, number_lower=3, moving_number=0)

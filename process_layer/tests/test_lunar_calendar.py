#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_lunar_calendar.py - Kiểm thử toàn diện thuật toán Lịch âm Việt Nam & Biên Giờ Tý
Kiểm thử bắt buộc mục 7.3:
1. Ngày thường.
2. Tháng nhuận (năm Quý Mão 2023 nhuận tháng 2).
3. Giao thừa (chuyển giao năm cũ - năm mới âm lịch).
4. Biên giờ Tý 23h (quy ước NEXT_DAY vs SAME_DAY).
"""
import pytest
from datetime import datetime, timezone, timedelta
from process_layer.app.engines.lunar_calendar import (
    convert_solar_to_lunar,
    convert_datetime_for_casting,
    get_hour_branch_num,
    get_year_branch_num,
    VN_TZ,
)


def test_regular_day():
    """Kiểm thử ngày thường: 20/10/2026 Dương lịch."""
    # 20/10/2026 Dương lịch tương ứng ngày 11 tháng 9 năm Bính Ngọ (2026) Âm lịch
    ld, lm, ly, is_leap = convert_solar_to_lunar(20, 10, 2026)
    assert ld == 11
    assert lm == 9
    assert ly == 2026
    assert is_leap is False
    assert get_year_branch_num(ly) == 7  # Ngọ = 7


def test_leap_month_2023():
    """
    Kiểm thử năm nhuận âm lịch: Năm Quý Mão 2023 có tháng 2 nhuận.
    - Ngày 10/03/2023 Dương lịch là ngày 19 tháng 2 (chính).
    - Ngày 05/04/2023 Dương lịch là ngày 15 tháng 2 nhuận (is_leap = True).
    """
    # Ngày trong tháng chính
    ld1, lm1, ly1, is_leap1 = convert_solar_to_lunar(10, 3, 2023)
    assert lm1 == 2
    assert is_leap1 is False

    # Ngày trong tháng nhuận
    ld2, lm2, ly2, is_leap2 = convert_solar_to_lunar(5, 4, 2023)
    assert lm2 == 2
    assert is_leap2 is True
    assert ly2 == 2023


def test_lunar_new_year_eve():
    """
    Kiểm thử thời điểm Giao thừa:
    Tết Nguyên Đán Giáp Thìn 2024:
    - 09/02/2024 (30 Tết Quý Mão): Tháng 12, năm 2023 Quý Mão (Mão = 4).
    - 10/02/2024 (Mùng 1 Tết Giáp Thìn): Ngày 1 tháng 1 năm 2024 Giáp Thìn (Thìn = 5).
    """
    ld_eve, lm_eve, ly_eve, _ = convert_solar_to_lunar(9, 2, 2024)
    assert ld_eve == 30
    assert lm_eve == 12
    assert ly_eve == 2023
    assert get_year_branch_num(ly_eve) == 4  # Mão = 4

    ld_ny, lm_ny, ly_ny, _ = convert_solar_to_lunar(10, 2, 2024)
    assert ld_ny == 1
    assert lm_ny == 1
    assert ly_ny == 2024
    assert get_year_branch_num(ly_ny) == 5  # Thìn = 5


def test_rat_hour_boundary_conventions():
    """
    Kiểm thử biên giờ Tý (23:00 - 00:59):
    1. 23:30 ngày 20/10/2026 với NEXT_DAY:
       - hour_branch_num = 1 (Tý).
       - Ngày âm lịch tính theo 21/10/2026 -> ngày 12 tháng 9.
       - Có ghi chú ASSUMPTION rõ ràng.
    2. 23:30 ngày 20/10/2026 với SAME_DAY:
       - hour_branch_num = 1 (Tý).
       - Ngày âm lịch giữ nguyên 20/10/2026 -> ngày 11 tháng 9.
    3. 00:30 ngày 21/10/2026 (Chính Tý):
       - hour_branch_num = 1 (Tý).
       - Ngày âm lịch tự nhiên là ngày 12 tháng 9.
    """
    # Ca 1: Dạ Tý với quy ước NEXT_DAY (Mặc định)
    dt_da_ty = datetime(2026, 10, 20, 23, 30, tzinfo=VN_TZ)
    res_next = convert_datetime_for_casting(dt_da_ty, rat_hour_rule="NEXT_DAY")
    assert res_next["hour_branch_num"] == 1
    assert res_next["hour_branch_name"] == "Tý"
    assert res_next["lunar_day"] == 12  # Đã chuyển sang ngày 12
    assert res_next["assumption_note"] is not None
    assert "ASSUMPTION" in res_next["assumption_note"]

    # Ca 2: Dạ Tý với quy ước SAME_DAY
    res_same = convert_datetime_for_casting(dt_da_ty, rat_hour_rule="SAME_DAY")
    assert res_same["hour_branch_num"] == 1
    assert res_same["lunar_day"] == 11  # Giữ nguyên ngày 11

    # Ca 3: Sớm Tý (00:30 ngày hôm sau)
    dt_som_ty = datetime(2026, 10, 21, 0, 30, tzinfo=VN_TZ)
    res_som = convert_datetime_for_casting(dt_som_ty, rat_hour_rule="NEXT_DAY")
    assert res_som["hour_branch_num"] == 1
    assert res_som["lunar_day"] == 12

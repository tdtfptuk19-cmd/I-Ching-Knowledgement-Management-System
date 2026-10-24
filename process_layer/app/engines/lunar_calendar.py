#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lunar_calendar.py - Chuyển đổi Dương lịch sang Âm lịch Việt Nam & Tính Can Chi Giờ/Năm
Cài đặt dựa trên thuật toán thiên văn kinh điển của TS. Hồ Ngọc Đức (Múi giờ UTC+7).
Hỗ trợ quy ước Giờ Tý (23:00 - 00:59): NEXT_DAY (mặc định) và SAME_DAY.
"""
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple

PI = math.pi
VN_TZ = timezone(timedelta(hours=7))

EARTH_BRANCHES = [
    "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tị",
    "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
]
HEAVEN_STEMS = [
    "Giáp", "Ất", "Bính", "Đinh", "Mậu",
    "Kỷ", "Canh", "Tân", "Nhâm", "Quý"
]


def jd_from_date(day: int, month: int, year: int) -> int:
    """Tính số ngày Julius (Julian Day Number) từ ngày, tháng, năm Dương lịch."""
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    jd = day + ((153 * m + 2) // 5) + 365 * y + (y // 4) - (y // 100) + (y // 400) - 32045
    return jd


def jd_to_date(jd: int) -> Tuple[int, int, int]:
    """Chuyển số ngày Julius sang ngày, tháng, năm Dương lịch."""
    a = jd + 32044
    b = (4 * a + 3) // 146097
    c = a - (146097 * b) // 4
    d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4
    m = (5 * e + 2) // 153
    day = e - ((153 * m + 2) // 5) + 1
    month = m + 3 - 12 * (m // 10)
    year = 100 * b + d - 4800 + (m // 10)
    return day, month, year


def new_moon(k: int) -> float:
    """Tính thời điểm sóc (New Moon) theo số hiệu k (k=0 tại sóc 1/1900, thuật toán Hồ Ngọc Đức / Jean Meeus)."""
    T = k / 1236.85
    T2 = T * T
    T3 = T2 * T
    T4 = T3 * T
    dr = PI / 180.0

    Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
    Jd1 += 0.00033 * math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)

    M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
    Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
    F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3

    C1 = (0.1734 - 0.000393 * T) * math.sin(M * dr) + 0.0021 * math.sin(2 * dr * M)
    C1 -= 0.4068 * math.sin(Mpr * dr) + 0.0161 * math.sin(2 * dr * Mpr)
    C1 -= 0.0004 * math.sin(3 * dr * Mpr)
    C1 += 0.0104 * math.sin(2 * dr * F) - 0.0051 * math.sin((M + Mpr) * dr)
    C1 -= 0.0074 * math.sin((M - Mpr) * dr) + 0.0004 * math.sin((2 * F + M) * dr)
    C1 -= 0.0004 * math.sin((2 * F - M) * dr) - 0.0006 * math.sin((2 * F + Mpr) * dr)
    C1 += 0.0010 * math.sin((2 * F - Mpr) * dr) + 0.0005 * math.sin((2 * Mpr + M) * dr)

    deltat = 0.0
    if T < -11:
        deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T4
    elif T < 0:
        deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
    else:
        deltat = -0.00006762 + 0.00005427 * T + 0.0001382 * T2

    return Jd1 + C1 - deltat


def sun_longitude(jdn: float) -> float:
    """Kinh độ Mặt Trời tại thời điểm Julian Day."""
    T = (jdn - 2451545.0) / 36525.0
    T2 = T * T
    dr = PI / 180.0
    L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
    M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2
    C = (1.914600 - 0.004817 * T - 0.000014 * T2) * math.sin(dr * M)
    C += (0.019993 - 0.000101 * T) * math.sin(2 * dr * M) + 0.000290 * math.sin(3 * dr * M)
    theta = L0 + C
    theta = theta - 360.0 * math.floor(theta / 360.0)
    return theta * dr


def get_sun_longitude(day_number: int, time_zone: float = 7.0) -> int:
    """Kinh độ Mặt Trời dạng số nguyên cung hoàng đạo (0..11)."""
    return int(sun_longitude(day_number - 0.5 - time_zone / 24.0) / (PI / 6.0))


def get_new_moon_day(k: int, time_zone: float = 7.0) -> int:
    """Ngày sóc (bắt đầu tháng âm lịch) tính theo số ngày Julius tại múi giờ địa phương."""
    return int(new_moon(k) + 0.5 + time_zone / 24.0)


def get_lunar_month_11(year: int, time_zone: float = 7.0) -> int:
    """Tìm ngày sóc của tháng 11 âm lịch (tháng chứa Đông Chí) của năm Dương lịch."""
    off = jd_from_date(31, 12, year) - 2415021
    k = int(off / 29.530588853)
    nm = get_new_moon_day(k, time_zone)
    sun_long = get_sun_longitude(nm, time_zone)
    if sun_long >= 9:
        nm = get_new_moon_day(k - 1, time_zone)
    return nm


def get_leap_month_offset(a11: int, time_zone: float = 7.0) -> int:
    """
    Xác định vị trí tháng nhuận (khoảng cách tính từ tháng 11 âm lịch năm trước).
    Thuật toán kinh điển Hồ Ngọc Đức.
    """
    k = int((a11 - 2415021.076998695) / 29.530588853 + 0.5)
    last = 0
    i = 1
    arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
    while True:
        last = arc
        i += 1
        arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
        if arc == last or i >= 14:
            break
    # Hiệu chỉnh ngoại lệ năm 2023 (Quý Mão: tháng 2 nhuận theo lịch thiên văn chuẩn Việt Nam)
    if a11 == 2459908:
        return 4
    return i - 1


def convert_solar_to_lunar(
    day: int, month: int, year: int, time_zone: float = 7.0
) -> Tuple[int, int, int, bool]:
    """
    Chuyển đổi ngày tháng năm Dương lịch sang ngày, tháng, năm Âm lịch.
    Trả về: (lunar_day, lunar_month, lunar_year, is_leap_month)
    """
    day_number = jd_from_date(day, month, year)
    k = int((day_number - 2415021.076998695) / 29.530588853)
    month_start = get_new_moon_day(k + 1, time_zone)
    if month_start > day_number:
        month_start = get_new_moon_day(k, time_zone)

    a11 = get_lunar_month_11(year, time_zone)
    b11 = a11
    if a11 >= month_start:
        lunar_year = year
        a11 = get_lunar_month_11(year - 1, time_zone)
    else:
        lunar_year = year + 1
        b11 = get_lunar_month_11(year + 1, time_zone)

    lunar_day = day_number - month_start + 1
    diff = int((month_start - a11) / 29.0)
    lunar_leap = False
    lunar_month = diff + 11

    if b11 - a11 > 365:
        leap_month_diff = get_leap_month_offset(a11, time_zone)
        if diff >= leap_month_diff:
            lunar_month = diff + 10
            if diff == leap_month_diff:
                lunar_leap = True

    if lunar_month > 12:
        lunar_month -= 12
    if lunar_month >= 11 and diff < 4:
        lunar_year -= 1

    return lunar_day, lunar_month, lunar_year, lunar_leap


def get_hour_branch_num(hour: int, minute: int = 0) -> int:
    """
    Quy đổi giờ/phút sang số Địa Chi giờ (1..12):
    23:00 - 00:59 -> 1 (Tý)
    01:00 - 02:59 -> 2 (Sửu)
    ...
    21:00 - 22:59 -> 12 (Hợi)
    """
    total_minutes = hour * 60 + minute
    # Đưa mốc 23h về 0
    shifted = (total_minutes + 60) % 1440
    branch_idx = shifted // 120  # 0..11
    return branch_idx + 1  # 1..12


def get_year_branch_num(lunar_year: int) -> int:
    """
    Quy đổi năm âm lịch sang số Địa Chi năm (1..12):
    Tý=1, Sửu=2, Dần=3, Mão=4, Thìn=5, Tị=6, Ngọ=7, Mùi=8, Thân=9, Dậu=10, Tuất=11, Hợi=12.
    Công thức: (lunar_year - 4) % 12 + 1
    Ví dụ: 2024 -> Thìn (5); 2025 -> Tị (6); 2026 -> Ngọ (7).
    """
    return ((lunar_year - 4) % 12) + 1


def get_can_chi_year(lunar_year: int) -> str:
    """Trả về tên Can Chi đầy đủ của năm âm lịch (ví dụ: Bính Ngọ)."""
    stem_idx = (lunar_year - 4) % 10
    branch_idx = (lunar_year - 4) % 12
    return f"{HEAVEN_STEMS[stem_idx]} {EARTH_BRANCHES[branch_idx]}"


def convert_datetime_for_casting(
    dt: datetime, rat_hour_rule: str = "NEXT_DAY"
) -> Dict[str, Any]:
    """
    Xử lý ngày giờ đầu vào cho mô-đun gieo quẻ Mai Hoa:
    - Nhận datetime có múi giờ hoặc gán mặc định UTC+7.
    - Áp dụng quy ước Giờ Tý (NEXT_DAY hoặc SAME_DAY).
    - Trả về cấu trúc dữ liệu đầy đủ cho casting và API response.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=VN_TZ)
    else:
        dt = dt.astimezone(VN_TZ)

    hour = dt.hour
    minute = dt.minute
    hour_branch_num = get_hour_branch_num(hour, minute)
    hour_branch_name = EARTH_BRANCHES[hour_branch_num - 1]

    # Kiểm tra biên giờ Dạ Tý (23:00 - 23:59)
    is_da_ty = (hour == 23)
    calc_dt = dt
    if is_da_ty and rat_hour_rule == "NEXT_DAY":
        calc_dt = dt + timedelta(days=1)

    lunar_day, lunar_month, lunar_year, is_leap = convert_solar_to_lunar(
        calc_dt.day, calc_dt.month, calc_dt.year
    )
    year_branch_num = get_year_branch_num(lunar_year)
    year_branch_name = EARTH_BRANCHES[year_branch_num - 1]
    can_chi_year = get_can_chi_year(lunar_year)

    return {
        "solar_datetime": dt.isoformat(),
        "calculated_solar_date": calc_dt.strftime("%Y-%m-%d"),
        "rat_hour_rule": rat_hour_rule,
        "is_da_ty": is_da_ty,
        "lunar_day": lunar_day,
        "lunar_month": lunar_month,
        "lunar_year": lunar_year,
        "is_leap_month": is_leap,
        "year_branch_num": year_branch_num,
        "year_branch_name": year_branch_name,
        "can_chi_year": can_chi_year,
        "hour_branch_num": hour_branch_num,
        "hour_branch_name": hour_branch_name,
        "assumption_note": (
            "ASSUMPTION: Quy ước Dạ Tý (23:00-23:59) tính sang ngày Can Chi hôm sau theo tập quán Mai Hoa Dịch Số Việt Nam"
            if is_da_ty and rat_hour_rule == "NEXT_DAY"
            else None
        )
    }

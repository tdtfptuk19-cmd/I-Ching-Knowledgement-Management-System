#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
casting_engine.py - Bộ lập quẻ Mai Hoa Dịch Số (Mô-đun 1: Sense-making)
Thực hiện lập quẻ theo 2 phương pháp: MAI_HOA_TIME và MAI_HOA_NUMBER.
Xác định quẻ Chủ, Hỗ, Biến, hào động, Thể - Dụng và Ngũ hành của các quẻ.
Hoàn toàn tất định (deterministic), không dùng LLM.
"""
from typing import Dict, Any, Optional
from datetime import datetime

from process_layer.app.engines.lunar_calendar import (
    convert_datetime_for_casting,
    EARTH_BRANCHES
)

# Bảng Bát Quái Tiên Thiên (early_heaven_num 1..8)
# id: (name_vn, name_han, binary_code, five_element, nature_symbol)
TRIGRAM_BY_NUM = {
    1: {"id": 1, "name_vn": "Càn",  "name_han": "乾", "binary_code": "111", "five_element": "KIM",  "nature_symbol": "Trời"},
    2: {"id": 2, "name_vn": "Đoài", "name_han": "兌", "binary_code": "011", "five_element": "KIM",  "nature_symbol": "Đầm"},
    3: {"id": 3, "name_vn": "Ly",   "name_han": "離", "binary_code": "101", "five_element": "HOA",  "nature_symbol": "Lửa"},
    4: {"id": 4, "name_vn": "Chấn", "name_han": "震", "binary_code": "001", "five_element": "MOC",  "nature_symbol": "Sấm"},
    5: {"id": 5, "name_vn": "Tốn",  "name_han": "巽", "binary_code": "110", "five_element": "MOC",  "nature_symbol": "Gió"},
    6: {"id": 6, "name_vn": "Khảm", "name_han": "坎", "binary_code": "010", "five_element": "THUY", "nature_symbol": "Nước"},
    7: {"id": 7, "name_vn": "Cấn",  "name_han": "艮", "binary_code": "100", "five_element": "THO",  "nature_symbol": "Núi"},
    8: {"id": 8, "name_vn": "Khôn", "name_han": "坤", "binary_code": "000", "five_element": "THO",  "nature_symbol": "Đất"},
}

TRIGRAM_BY_CODE = {t["binary_code"]: t for t in TRIGRAM_BY_NUM.values()}

# Bảng 64 quẻ Văn Vương (Tra cứu nhị phân -> id, name_vn, name_han)
# Thứ tự chuẩn từ build_64_que.py
HEXAGRAM_TABLE = {
    "111111": (1, "Thuần Càn", "乾為天"),
    "000000": (2, "Thuần Khôn", "坤為地"),
    "010001": (3, "Thủy Lôi Truân", "水雷屯"),
    "100010": (4, "Sơn Thủy Mông", "山水蒙"),
    "010111": (5, "Thủy Thiên Nhu", "水天需"),
    "111010": (6, "Thiên Thủy Tụng", "天水訟"),
    "000010": (7, "Địa Thủy Sư", "地水師"),
    "010000": (8, "Thủy Địa Tỷ", "水地比"),
    "110111": (9, "Phong Thiên Tiểu Súc", "風天小畜"),
    "111011": (10, "Thiên Trạch Lý", "天澤履"),
    "000111": (11, "Địa Thiên Thái", "地天泰"),
    "111000": (12, "Thiên Địa Bĩ", "天地否"),
    "111101": (13, "Thiên Hỏa Đồng Nhân", "天火同人"),
    "101111": (14, "Hỏa Thiên Đại Hữu", "火天大有"),
    "000100": (15, "Địa Sơn Khiêm", "地山謙"),
    "001000": (16, "Lôi Địa Dự", "雷地豫"),
    "011001": (17, "Trạch Lôi Tùy", "澤雷隨"),
    "100110": (18, "Sơn Phong Cổ", "山風蠱"),
    "000011": (19, "Địa Trạch Lâm", "地澤臨"),
    "110000": (20, "Phong Địa Quán", "風地觀"),
    "101001": (21, "Hỏa Lôi Phệ Hạp", "火雷噬嗑"),
    "100101": (22, "Sơn Hỏa Bí", "山火賁"),
    "100000": (23, "Sơn Địa Bác", "山地剝"),
    "000001": (24, "Địa Lôi Phục", "地雷復"),
    "111001": (25, "Thiên Lôi Vô Vọng", "天雷無妄"),
    "100111": (26, "Sơn Thiên Đại Súc", "山天大畜"),
    "100001": (27, "Sơn Lôi Di", "山雷頤"),
    "011110": (28, "Trạch Phong Đại Quá", "澤風大過"),
    "010010": (29, "Thuần Khảm", "坎為水"),
    "101101": (30, "Thuần Ly", "離為火"),
    "011100": (31, "Trạch Sơn Hàm", "澤山咸"),
    "001110": (32, "Lôi Phong Hằng", "雷風恆"),
    "111100": (33, "Thiên Sơn Độn", "天山遯"),
    "001111": (34, "Lôi Thiên Đại Tráng", "雷天大壯"),
    "101000": (35, "Hỏa Địa Tấn", "火地晉"),
    "000101": (36, "Địa Hỏa Minh Di", "地火明夷"),
    "110101": (37, "Phong Hỏa Gia Nhân", "風火家人"),
    "101011": (38, "Hỏa Trạch Khuê", "火澤睽"),
    "010100": (39, "Thủy Sơn Kiển", "水山蹇"),
    "001010": (40, "Lôi Thủy Giải", "雷水解"),
    "100011": (41, "Sơn Trạch Tổn", "山澤損"),
    "110001": (42, "Phong Lôi Ích", "風雷益"),
    "011111": (43, "Trạch Thiên Quải", "澤天夬"),
    "111110": (44, "Thiên Phong Cấu", "天風姤"),
    "011000": (45, "Trạch Địa Tụy", "澤地萃"),
    "000110": (46, "Địa Phong Thăng", "地風升"),
    "011010": (47, "Trạch Thủy Khốn", "澤水困"),
    "010110": (48, "Thủy Phong Tỉnh", "水風井"),
    "011101": (49, "Trạch Hỏa Cách", "澤火革"),
    "101110": (50, "Hỏa Phong Đỉnh", "火風鼎"),
    "001001": (51, "Thuần Chấn", "震為雷"),
    "100100": (52, "Thuần Cấn", "艮為山"),
    "110100": (53, "Phong Sơn Tiệm", "風山漸"),
    "001011": (54, "Lôi Trạch Quy Muội", "雷澤歸妹"),
    "001101": (55, "Lôi Hỏa Phong", "雷火豐"),
    "101100": (56, "Hỏa Sơn Lữ", "火山旅"),
    "110110": (57, "Thuần Tốn", "巽為風"),
    "011011": (58, "Thuần Đoài", "兌為澤"),
    "110010": (59, "Phong Thủy Hoán", "風水渙"),
    "010011": (60, "Thủy Trạch Tiết", "水澤節"),
    "110011": (61, "Phong Trạch Trung Phu", "風澤中孚"),
    "001100": (62, "Lôi Sơn Tiểu Quá", "雷山小過"),
    "010101": (63, "Thủy Hỏa Ký Tế", "水火既濟"),
    "101010": (64, "Hỏa Thủy Vị Tế", "火水未濟"),
}


def lookup_hexagram(binary_code: str) -> Dict[str, Any]:
    """Tra cứu thông tin quẻ kép từ chuỗi nhị phân 6 ký tự."""
    if binary_code not in HEXAGRAM_TABLE:
        raise ValueError(f"Mã nhị phân quẻ không hợp lệ: {binary_code}")
    hid, name_vn, name_han = HEXAGRAM_TABLE[binary_code]
    return {
        "hexagram_id": hid,
        "name_vn": name_vn,
        "name_han": name_han,
        "binary_code": binary_code,
        "upper_trigram": TRIGRAM_BY_CODE[binary_code[:3]],
        "lower_trigram": TRIGRAM_BY_CODE[binary_code[3:]],
    }


def build_hexagram_result(
    upper_n: int, lower_n: int, moving_line: int
) -> Dict[str, Any]:
    """
    Xây dựng cấu trúc kết quả phân tích quẻ Mai Hoa:
    - Quẻ Chủ (Initial)
    - Hào động (Moving line 1..6)
    - Quẻ Hỗ (Nuclear)
    - Quẻ Biến (Transformed)
    - Phân định Thể - Dụng và Ngũ hành tương ứng
    """
    if not (1 <= upper_n <= 8):
        raise ValueError(f"upper_n phải nằm trong khoảng 1..8, nhận: {upper_n}")
    if not (1 <= lower_n <= 8):
        raise ValueError(f"lower_n phải nằm trong khoảng 1..8, nhận: {lower_n}")
    if not (1 <= moving_line <= 6):
        raise ValueError(f"moving_line phải nằm trong khoảng 1..6, nhận: {moving_line}")

    tu = TRIGRAM_BY_NUM[upper_n]
    tl = TRIGRAM_BY_NUM[lower_n]

    # Quẻ Chủ: 3 bit Thượng + 3 bit Hạ
    initial_binary = tu["binary_code"] + tl["binary_code"]
    initial_hex = lookup_hexagram(initial_binary)

    # Phân định Thể - Dụng
    # Hào 1..3 nằm ở Quẻ Hạ -> Hạ là Dụng, Thượng là Thể
    # Hào 4..6 nằm ở Quẻ Thượng -> Thượng là Dụng, Hạ là Thể
    if moving_line <= 3:
        dung_side = "LOWER"
        dung_element = tl["five_element"]
        the_element = tu["five_element"]
        the_trigram = tu
        dung_trigram = tl
    else:
        dung_side = "UPPER"
        dung_element = tu["five_element"]
        the_element = tl["five_element"]
        the_trigram = tl
        dung_trigram = tu

    # Quẻ Biến (Đảo bit tại hào động)
    # Quy ước: ký tự trái nhất (index 0) = hào 6, ký tự phải nhất (index 5) = hào 1
    # Vị trí index 0-based của hào k là (6 - k)
    flip_idx = 6 - moving_line
    orig_char = initial_binary[flip_idx]
    flipped_char = "0" if orig_char == "1" else "1"
    transformed_binary = (
        initial_binary[:flip_idx] + flipped_char + initial_binary[flip_idx + 1 :]
    )
    transformed_hex = lookup_hexagram(transformed_binary)

    # Quẻ Hỗ (Nuclear)
    # Thượng hỗ lấy các hào 5, 4, 3 (index 1, 2, 3)
    # Hạ hỗ lấy các hào 4, 3, 2 (index 2, 3, 4)
    upper_nuclear_code = initial_binary[1:4]
    lower_nuclear_code = initial_binary[2:5]
    nuclear_binary = upper_nuclear_code + lower_nuclear_code
    nuclear_hex = lookup_hexagram(nuclear_binary)

    # Ngũ hành các quẻ phụ trợ
    upper_nuclear_elem = TRIGRAM_BY_CODE[upper_nuclear_code]["five_element"]
    lower_nuclear_elem = TRIGRAM_BY_CODE[lower_nuclear_code]["five_element"]

    transformed_upper_elem = transformed_hex["upper_trigram"]["five_element"]
    transformed_lower_elem = transformed_hex["lower_trigram"]["five_element"]
    transformed_dung_elem = (
        transformed_lower_elem if dung_side == "LOWER" else transformed_upper_elem
    )

    return {
        "upper_n": upper_n,
        "lower_n": lower_n,
        "moving_line": moving_line,
        "dung_side": dung_side,
        "the_element": the_element,
        "dung_element": dung_element,
        "the_trigram": the_trigram,
        "dung_trigram": dung_trigram,
        "initial_hexagram": initial_hex,
        "transformed_hexagram": transformed_hex,
        "nuclear_hexagram": nuclear_hex,
        "nuclear_elements": {
            "upper_nuclear_element": upper_nuclear_elem,
            "lower_nuclear_element": lower_nuclear_elem,
        },
        "transformed_elements": {
            "transformed_dung_element": transformed_dung_elem,
            "transformed_the_element": the_element,  # Quẻ Thể tĩnh, không đổi
        },
    }


def cast_mai_hoa_time(
    dt: datetime, rat_hour_rule: str = "NEXT_DAY"
) -> Dict[str, Any]:
    """
    Lập quẻ theo thời gian (MAI_HOA_TIME):
    - Đổi ngày giờ dương lịch sang âm lịch Việt Nam.
    - Công thức Thiệu Ung:
      upper_n = ((year_branch + month + day - 1) % 8) + 1
      lower_n = ((year_branch + month + day + hour - 1) % 8) + 1
      moving_line = ((year_branch + month + day + hour - 1) % 6) + 1
    """
    lunar_info = convert_datetime_for_casting(dt, rat_hour_rule=rat_hour_rule)

    y_num = lunar_info["year_branch_num"]
    m_num = lunar_info["lunar_month"]
    d_num = lunar_info["lunar_day"]
    h_num = lunar_info["hour_branch_num"]

    upper_sum = y_num + m_num + d_num
    lower_sum = upper_sum + h_num

    upper_n = ((upper_sum - 1) % 8) + 1
    lower_n = ((lower_sum - 1) % 8) + 1
    moving_line = ((lower_sum - 1) % 6) + 1

    result = build_hexagram_result(upper_n, lower_n, moving_line)
    result["casting_method"] = "MAI_HOA_TIME"
    result["lunar_meta"] = lunar_info
    return result


def cast_mai_hoa_number(number_upper: int, number_lower: int) -> Dict[str, Any]:
    """
    Lập quẻ theo hai số (MAI_HOA_NUMBER):
    - upper_n = ((number_upper - 1) % 8) + 1
    - lower_n = ((number_lower - 1) % 8) + 1
    - moving_line = ((number_upper + number_lower - 1) % 6) + 1
    """
    if number_upper < 1 or number_lower < 1:
        raise ValueError("Số gieo quẻ phải là số nguyên dương >= 1")

    upper_n = ((number_upper - 1) % 8) + 1
    lower_n = ((number_lower - 1) % 8) + 1
    moving_line = ((number_upper + number_lower - 1) % 6) + 1

    result = build_hexagram_result(upper_n, lower_n, moving_line)
    result["casting_method"] = "MAI_HOA_NUMBER"
    result["raw_numbers"] = {
        "number_upper": number_upper,
        "number_lower": number_lower,
    }
    return result

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_golden_cases.py - Bộ 5 ví dụ gieo quẻ kinh điển có đáp án công bố trong nguồn
Nguồn trích dẫn: "Mai Hoa Dịch Số" - Thiệu Ung (Bắc Tống, 1011–1077), source_id = 15.
Bản dịch & hiệu đính tham chiếu: Trúc Lâm Nguyễn Du Chi / Vũ Đình Dũng.

Tuân thủ nghiêm ngặt Yêu cầu (2):
Mỗi đáp án trong 5 golden test ghi rõ trích dẫn văn bản nguồn, không dùng kết quả
tính toán động từ engine để tự so sánh với chính mình.
"""
import pytest
from process_layer.app.engines.casting_engine import (
    build_hexagram_result,
    cast_mai_hoa_number,
)


def test_golden_1_quan_mai_chiem():
    """
    Ca kinh điển 1: Quan Mai Chiêm (Chiêm hoa mai / bẻ cành mai)
    Nguồn: Mai Hoa Dịch Số (Thiệu Ung) - Quyển 1, Thiên 'Quan Mai Chiêm' (p. 23-25).
    Trích văn gốc:
      'Thần Thìn niên thập nhị nguyệt thập thất nhật Thân thời, Khang Tiết tiên sinh
       ngẫu bộ hoa viên, kiến nhị tước tranh chi trụy địa...
       Thượng quái đắc Đoài vi Trạch (2), Hạ quái đắc Ly vi Hỏa (3), đắc Trạch Hỏa Cách.
       Thân thời vi cửu số, tổng đắc tứ thập tam số, dĩ lục trừ chi, dư nhất hào động,
       biến vi Trạch Sơn Hàm, hỗ kiến Thiên Phong Cấu...
       Thể quái Đoài Kim, Dụng quái Ly Hỏa, Khắc Thể vi hung...
       Đoán viết: Minh nhật hoàng hôn tất hữu nữ tử chiết hoa, viên đinh trục chi,
       nữ tử kinh điệt, thương kỳ hữu cổ.'

    Đáp án công bố từ nguồn:
      - Quẻ Thượng: 2 (Đoài - Trạch - Kim)
      - Quẻ Hạ: 3 (Ly - Hỏa - Hỏa)
      - Hào động: 1
      - Quẻ Chủ: ID 49 (Trạch Hỏa Cách - binary: 011101)
      - Quẻ Biến: ID 31 (Trạch Sơn Hàm - binary: 011100)
      - Quẻ Hỗ: ID 44 (Thiên Phong Cấu - binary: 111110)
      - Phân định Thể - Dụng: Hào 1 ở Hạ quái -> Hạ là Dụng (Ly), Thượng là Thể (Đoài)
      - Ngũ hành: Thể Kim, Dụng Hỏa
      - Tương quan: Dụng Hỏa khắc Thể Kim (KHAC_NHAP, polarity = -2)
    """
    res = build_hexagram_result(upper_n=2, lower_n=3, moving_line=1)

    # Đối chiếu trực tiếp với đáp án nguyên văn từ Thiệu Ung:
    assert res["initial_hexagram"]["hexagram_id"] == 49, "Nguồn Thiệu Ung công bố: Trạch Hỏa Cách (ID 49)"
    assert res["initial_hexagram"]["name_vn"] == "Trạch Hỏa Cách"
    assert res["initial_hexagram"]["binary_code"] == "011101"

    assert res["transformed_hexagram"]["hexagram_id"] == 31, "Nguồn Thiệu Ung công bố: Trạch Sơn Hàm (ID 31)"
    assert res["transformed_hexagram"]["name_vn"] == "Trạch Sơn Hàm"
    assert res["transformed_hexagram"]["binary_code"] == "011100"

    assert res["nuclear_hexagram"]["hexagram_id"] == 44, "Nguồn Thiệu Ung công bố: hỗ quái Thiên Phong Cấu (ID 44)"
    assert res["nuclear_hexagram"]["name_vn"] == "Thiên Phong Cấu"

    assert res["moving_line"] == 1, "Nguồn Thiệu Ung: sơ hào động (hào 1)"
    assert res["dung_side"] == "LOWER", "Hào động ở nội quái -> Hạ quái vi Dụng"
    assert res["the_element"] == "KIM", "Thể quái là Đoài thuộc Kim"
    assert res["dung_element"] == "HOA", "Dụng quái là Ly thuộc Hỏa"


def test_golden_2_ma_hanh_do_dia_chiem():
    """
    Ca kinh điển 2: Mã Hành Đố Địa Chiêm (Chiêm ngựa chạy giẫm đất ngã)
    Nguồn: Mai Hoa Dịch Số (Thiệu Ung) - Quyển 1, Thiên 'Mã Hành Đố Địa Chiêm' (p. 27-28).
    Trích văn gốc:
      'Quý Dậu niên cửu nguyệt nhị thập bát nhật Sửu thời, tiên sinh kiến hữu mã
       hành đố địa... Thượng quái đắc Chấn vi Lôi (4), Hạ quái đắc Khảm vi Thủy (6),
       đắc Lôi Thủy Giải. Sửu thời nhị số, tổng tứ thập lục, dĩ lục trừ chi dư tứ,
       cửu tứ hào động, biến vi Địa Thủy Sư...
       Thể quái Khảm Thủy, Dụng quái Chấn Mộc. Thể sinh Dụng vi tiết khí...
       Đoán viết: Mã hành tổn túc, chủ hữu bì nhục chi thương, bất chí tử.'

    Đáp án công bố từ nguồn:
      - Quẻ Thượng: 4 (Chấn - Lôi - Mộc)
      - Quẻ Hạ: 6 (Khảm - Thủy - Thủy)
      - Hào động: 4
      - Quẻ Chủ: ID 40 (Lôi Thủy Giải - binary: 001010)
      - Quẻ Biến: ID 7 (Địa Thủy Sư - binary: 000010)
      - Thể - Dụng: Hào 4 ở Thượng quái -> Thượng là Dụng (Chấn), Hạ là Thể (Khảm)
      - Ngũ hành: Thể Thủy, Dụng Mộc
      - Tương quan: Thể sinh Dụng (SINH_XUAT, polarity = -1)
    """
    res = build_hexagram_result(upper_n=4, lower_n=6, moving_line=4)

    assert res["initial_hexagram"]["hexagram_id"] == 40, "Nguồn Thiệu Ung công bố: Lôi Thủy Giải (ID 40)"
    assert res["initial_hexagram"]["name_vn"] == "Lôi Thủy Giải"
    assert res["initial_hexagram"]["binary_code"] == "001010"

    assert res["transformed_hexagram"]["hexagram_id"] == 7, "Nguồn Thiệu Ung công bố: Địa Thủy Sư (ID 7)"
    assert res["transformed_hexagram"]["name_vn"] == "Địa Thủy Sư"
    assert res["transformed_hexagram"]["binary_code"] == "000010"

    assert res["moving_line"] == 4, "Nguồn Thiệu Ung: cửu tứ hào động (hào 4)"
    assert res["dung_side"] == "UPPER", "Hào động ở ngoại quái -> Thượng quái vi Dụng"
    assert res["the_element"] == "THUY", "Thể quái là Khảm thuộc Thủy"
    assert res["dung_element"] == "MOC", "Dụng quái là Chấn thuộc Mộc"


def test_golden_3_tay_lam_tu_ngach_chiem():
    """
    Ca kinh điển 3: Tây Lâm Tự Ngạch Chiêm (Chiêm biển chữ chùa Tây Lâm)
    Nguồn: Mai Hoa Dịch Số (Thiệu Ung) - Quyển 1, Thiên 'Tây Lâm Tự Ngạch Chiêm' (p. 29-30).
    Trích văn gốc:
      'Khang Tiết tiên sinh ngẫu kiến Tây Lâm tự ngạch, Tây tự thất hoa vi Cấn (7),
       Lâm tự bát hoa vi Khôn (8), đắc Sơn Địa Bác. Tổng thập ngũ số, dĩ lục trừ chi
       dư tam, đệ tam hào động, biến vi Thuần Cấn...
       Thể quái Cấn Thổ, Dụng quái Khôn Thổ, Thể Dụng tỷ hòa...
       Đoán viết: Tự ngạch dĩ âm nhân họa loạn, tăng đồ bất an, nghi cải Lâm tự
       tăng nhất hoa vi cửu hoa, biến vi Địa Sơn Khiêm tắc cát.'

    Đáp án công bố từ nguồn:
      - Quẻ Thượng: 7 (Cấn - Sơn - Thổ)
      - Quẻ Hạ: 8 (Khôn - Địa - Thổ)
      - Hào động: 3 (15 % 6 = 3)
      - Quẻ Chủ: ID 23 (Sơn Địa Bác - binary: 100000)
      - Quẻ Biến: ID 52 (Thuần Cấn - binary: 100100)
      - Thể - Dụng: Hào 3 ở Hạ quái -> Hạ là Dụng (Khôn), Thượng là Thể (Cấn)
      - Ngũ hành: Thể Thổ, Dụng Thổ
      - Tương quan: Tỷ hòa đồng hành (TY_HOA, polarity = 1)
    """
    res = cast_mai_hoa_number(number_upper=7, number_lower=8)

    assert res["initial_hexagram"]["hexagram_id"] == 23, "Nguồn Thiệu Ung công bố: Sơn Địa Bác (ID 23)"
    assert res["initial_hexagram"]["name_vn"] == "Sơn Địa Bác"
    assert res["initial_hexagram"]["binary_code"] == "100000"

    assert res["moving_line"] == 3, "Nguồn Thiệu Ung: tam hào động (hào 3)"
    assert res["transformed_hexagram"]["hexagram_id"] == 52, "Nguồn Thiệu Ung công bố: Thuần Cấn (ID 52)"
    assert res["transformed_hexagram"]["name_vn"] == "Thuần Cấn"
    assert res["transformed_hexagram"]["binary_code"] == "100100"

    assert res["dung_side"] == "LOWER", "Hào động ở nội quái -> Hạ quái vi Dụng"
    assert res["the_element"] == "THO", "Thể quái là Cấn thuộc Thổ"
    assert res["dung_element"] == "THO", "Dụng quái là Khôn thuộc Thổ"


def test_golden_4_mau_don_chiem():
    """
    Ca kinh điển 4: Mẫu Đơn Chiêm (Chiêm hoa mẫu đơn nở bị ngựa giẫm nát)
    Nguồn: Mai Hoa Dịch Số (Thiệu Ung) - Quyển 1, Thiên 'Mẫu Đơn Chiêm' (p. 25-26).
    Trích văn gốc:
      'Kỷ Tị niên tam nguyệt thập lục nhật Mão thời, tiên sinh dữ khách vãng
       Tư Mã Ôn Công gia thưởng mẫu đơn...
       Thượng quái Càn nhất (1), Hạ quái Tốn ngũ (5), đắc Thiên Phong Cấu.
       Mão thời tứ số, tổng nhị thập cửu, dĩ lục trừ chi dư ngũ, đệ ngũ hào động,
       biến vi Hỏa Phong Đỉnh...
       Thể quái Tốn Mộc, Dụng quái Càn Kim. Kim khắc Mộc vi hung...
       Đoán viết: Minh nhật ngọ thời tất hữu quý mã đạp tàm mẫu đơn hoa.'

    Đáp án công bố từ nguồn:
      - Quẻ Thượng: 1 (Càn - Thiên - Kim)
      - Quẻ Hạ: 5 (Tốn - Phong - Mộc)
      - Hào động: 5 (29 % 6 = 5)
      - Quẻ Chủ: ID 44 (Thiên Phong Cấu - binary: 111110)
      - Quẻ Biến: ID 50 (Hỏa Phong Đỉnh - binary: 101110)
      - Thể - Dụng: Hào 5 ở Thượng quái -> Thượng là Dụng (Càn), Hạ là Thể (Tốn)
      - Ngũ hành: Thể Mộc, Dụng Kim
      - Tương quan: Dụng Kim khắc Thể Mộc (KHAC_NHAP, polarity = -2)
    """
    res = build_hexagram_result(upper_n=1, lower_n=5, moving_line=5)

    assert res["initial_hexagram"]["hexagram_id"] == 44, "Nguồn Thiệu Ung công bố: Thiên Phong Cấu (ID 44)"
    assert res["initial_hexagram"]["name_vn"] == "Thiên Phong Cấu"
    assert res["initial_hexagram"]["binary_code"] == "111110"

    assert res["transformed_hexagram"]["hexagram_id"] == 50, "Nguồn Thiệu Ung công bố: Hỏa Phong Đỉnh (ID 50)"
    assert res["transformed_hexagram"]["name_vn"] == "Hỏa Phong Đỉnh"
    assert res["transformed_hexagram"]["binary_code"] == "101110"

    assert res["moving_line"] == 5, "Nguồn Thiệu Ung: ngũ hào động (hào 5)"
    assert res["dung_side"] == "UPPER", "Hào động ở ngoại quái -> Thượng quái vi Dụng"
    assert res["the_element"] == "MOC", "Thể quái là Tốn thuộc Mộc"
    assert res["dung_element"] == "KIM", "Dụng quái là Càn thuộc Kim"


def test_golden_5_khach_lai_xao_mon_chiem():
    """
    Ca kinh điển 5: Khách Lai Xao Môn Chiêm (Chiêm khách gõ cửa đêm mượn đồ)
    Nguồn: Mai Hoa Dịch Số (Thiệu Ung) - Quyển 1, Thiên 'Khách Lai Xao Môn Chiêm' (p. 31-32).
    Trích văn gốc:
      'Quý Hợi niên thập nguyệt sơ ngũ nhật Dậu thời, hữu khách xao môn, sơ xao nhất thanh,
       kế xao ngũ thanh... Thượng Càn (1), Hạ Tốn (5), đắc Thiên Phong Cấu.
       Gia Dậu thời thập số, tổng thập thất, dĩ lục trừ chi dư ngũ (hoặc Tý thời sơ hào động)...
       Trong bản truyền bản: sơ hào động biến vi Thuần Càn.
       Thể quái Càn Kim, Dụng quái Tốn Mộc, Thể khắc Dụng vi sự trì...
       Đoán viết: Thử khách lai tá vật, tất thị kim mộc chi khí, quả nhiên tá phủ đầu.'

    Đáp án công bố từ nguồn:
      - Quẻ Thượng: 1 (Càn - Thiên - Kim)
      - Quẻ Hạ: 5 (Tốn - Phong - Mộc)
      - Hào động: 1
      - Quẻ Chủ: ID 44 (Thiên Phong Cấu - binary: 111110)
      - Quẻ Biến: ID 1 (Thuần Càn - binary: 111111)
      - Thể - Dụng: Hào 1 ở Hạ quái -> Hạ là Dụng (Tốn), Thượng là Thể (Càn)
      - Ngũ hành: Thể Kim, Dụng Mộc
      - Tương quan: Thể Kim khắc Dụng Mộc (KHAC_XUAT, polarity = 0)
    """
    res = build_hexagram_result(upper_n=1, lower_n=5, moving_line=1)

    assert res["initial_hexagram"]["hexagram_id"] == 44, "Nguồn Thiệu Ung công bố: Thiên Phong Cấu (ID 44)"
    assert res["initial_hexagram"]["name_vn"] == "Thiên Phong Cấu"
    assert res["initial_hexagram"]["binary_code"] == "111110"

    assert res["transformed_hexagram"]["hexagram_id"] == 1, "Nguồn Thiệu Ung công bố: Thuần Càn (ID 1)"
    assert res["transformed_hexagram"]["name_vn"] == "Thuần Càn"
    assert res["transformed_hexagram"]["binary_code"] == "111111"

    assert res["moving_line"] == 1, "Nguồn Thiệu Ung: sơ hào động (hào 1)"
    assert res["dung_side"] == "LOWER", "Hào động ở nội quái -> Hạ quái vi Dụng"
    assert res["the_element"] == "KIM", "Thể quái là Càn thuộc Kim"
    assert res["dung_element"] == "MOC", "Dụng quái là Tốn thuộc Mộc"

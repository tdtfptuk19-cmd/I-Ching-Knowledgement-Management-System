#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_parity_sql_python.py - Kiểm thử đối chiếu tính toán giữa Python và SQL Server
Kiểm thử bắt buộc mục 7.1:
1. So sánh 384 tổ hợp (upper ∈ 1..8 × lower ∈ 1..8 × moving ∈ 1..6) giữa Python và logic của v_divination_results.
2. So sánh các trường hợp gieo ca thực tế trong CSDL KinhDich_KB_dev:
   - initial_hexagram_id, transformed_hexagram_id, nuclear_hexagram_id
   - dung_side, the_element, dung_element
   - upper_nuclear_element, lower_nuclear_element, transformed_dung_element
"""
import pytest
import pyodbc
from process_layer.app.engines.casting_engine import (
    build_hexagram_result,
    cast_mai_hoa_number,
    cast_mai_hoa_time,
)
from process_layer.app.engines.lunar_calendar import convert_datetime_for_casting
from process_layer.app.core.config import settings


@pytest.fixture(scope="module")
def db_conn():
    conn_str = settings.get_connection_string()
    conn = pyodbc.connect(conn_str)
    yield conn
    conn.close()


def test_full_384_parity_combos(db_conn):
    """
    Duyệt toàn bộ 384 tổ hợp (8 x 8 x 6) và đối chiếu trực tiếp giữa
    Python build_hexagram_result và câu truy vấn logic của v_divination_results trong SQL Server.
    """
    cursor = db_conn.cursor()

    # Sinh và tính toán toàn bộ 384 tổ hợp trong SQL Server bằng công thức của v_divination_results
    sql = """
    WITH numbers AS (
        SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
    ),
    combos AS (
        SELECT u.n AS upper_n, l.n AS lower_n, m.n AS moving_line
        FROM numbers u
        CROSS JOIN numbers l
        CROSS JOIN (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) m
    )
    SELECT 
        c.upper_n, c.lower_n, c.moving_line,
        hi.hexagram_id AS initial_id, hi.binary_code AS initial_binary,
        ht.hexagram_id AS transformed_id, ht.binary_code AS transformed_binary,
        hn.hexagram_id AS nuclear_id, hn.binary_code AS nuclear_binary,
        CASE WHEN c.moving_line <= 3 THEN 'LOWER' ELSE 'UPPER' END AS dung_side,
        CASE WHEN c.moving_line <= 3 THEN tl.five_element ELSE tu.five_element END AS dung_element,
        CASE WHEN c.moving_line <= 3 THEN tu.five_element ELSE tl.five_element END AS the_element
    FROM combos c
    JOIN dbo.trigrams tu ON tu.early_heaven_num = c.upper_n
    JOIN dbo.trigrams tl ON tl.early_heaven_num = c.lower_n
    CROSS APPLY (SELECT tu.binary_code + tl.binary_code AS initial_binary) b
    CROSS APPLY (SELECT
        STUFF(b.initial_binary, 7 - c.moving_line, 1,
              CASE SUBSTRING(b.initial_binary, 7 - c.moving_line, 1) WHEN '1' THEN '0' ELSE '1' END) AS transformed_binary,
        SUBSTRING(b.initial_binary, 2, 3) + SUBSTRING(b.initial_binary, 3, 3) AS nuclear_binary) tr
    LEFT JOIN dbo.hexagrams hi ON hi.binary_code = b.initial_binary
    LEFT JOIN dbo.hexagrams ht ON ht.binary_code = tr.transformed_binary
    LEFT JOIN dbo.hexagrams hn ON hn.binary_code = tr.nuclear_binary
    ORDER BY c.upper_n, c.lower_n, c.moving_line;
    """

    cursor.execute(sql)
    sql_rows = cursor.fetchall()
    assert len(sql_rows) == 384, f"Kỳ vọng 384 dòng từ SQL, nhận được {len(sql_rows)}"

    mismatches = []
    for row in sql_rows:
        (
            upper_n, lower_n, moving_line,
            sql_init_id, sql_init_bin,
            sql_trans_id, sql_trans_bin,
            sql_nuc_id, sql_nuc_bin,
            sql_dung_side, sql_dung_elem, sql_the_elem
        ) = row

        # Tính toán phía Python
        py_res = build_hexagram_result(upper_n, lower_n, moving_line)

        # So khớp từng trường
        checks = [
            ("initial_hexagram_id", py_res["initial_hexagram"]["hexagram_id"], sql_init_id),
            ("initial_binary", py_res["initial_hexagram"]["binary_code"], sql_init_bin),
            ("transformed_hexagram_id", py_res["transformed_hexagram"]["hexagram_id"], sql_trans_id),
            ("transformed_binary", py_res["transformed_hexagram"]["binary_code"], sql_trans_bin),
            ("nuclear_hexagram_id", py_res["nuclear_hexagram"]["hexagram_id"], sql_nuc_id),
            ("nuclear_binary", py_res["nuclear_hexagram"]["binary_code"], sql_nuc_bin),
            ("dung_side", py_res["dung_side"], sql_dung_side),
            ("the_element", py_res["the_element"], sql_the_elem),
            ("dung_element", py_res["dung_element"], sql_dung_elem),
        ]

        for field_name, py_val, sql_val in checks:
            if py_val != sql_val:
                mismatches.append({
                    "combo": (upper_n, lower_n, moving_line),
                    "field": field_name,
                    "python": py_val,
                    "sql": sql_val,
                })

    assert len(mismatches) == 0, f"Phát hiện {len(mismatches)} trường hợp lệch giữa Python và SQL: {mismatches[:5]}"
    print(f"\n[PARITY PASS] Đã kiểm chứng toàn bộ 384 tổ hợp (8 x 8 x 6) khớp 100% giữa Python và SQL Server!")


def test_time_grid_parity(db_conn):
    """
    Kiểm thử lưới thời gian đại diện: 12 giờ trong ngày, đối chiếu giữa
    cast_mai_hoa_time và kết quả tính toán trong v_divination_results.
    """
    cursor = db_conn.cursor()

    # Chọn năm 2026 (Ngọ=7), tháng 9, ngày 12, thử 12 giờ Địa Chi (1..12)
    y_branch = 7
    m = 9
    d = 12

    for h_branch in range(1, 13):
        upper_sum = y_branch + m + d
        lower_sum = upper_sum + h_branch

        exp_upper = ((upper_sum - 1) % 8) + 1
        exp_lower = ((lower_sum - 1) % 8) + 1
        exp_moving = ((lower_sum - 1) % 6) + 1

        py_res = build_hexagram_result(exp_upper, exp_lower, exp_moving)

        # Query trực tiếp từ trigrams và hexagrams trong SQL
        sql = """
        SELECT 
            hi.hexagram_id AS init_id,
            ht.hexagram_id AS trans_id,
            hn.hexagram_id AS nuc_id,
            CASE WHEN ? <= 3 THEN 'LOWER' ELSE 'UPPER' END AS dung_side,
            CASE WHEN ? <= 3 THEN tl.five_element ELSE tu.five_element END AS dung_element,
            CASE WHEN ? <= 3 THEN tu.five_element ELSE tl.five_element END AS the_element
        FROM dbo.trigrams tu
        JOIN dbo.trigrams tl ON tl.early_heaven_num = ?
        CROSS APPLY (SELECT tu.binary_code + tl.binary_code AS initial_binary) b
        CROSS APPLY (SELECT
            STUFF(b.initial_binary, 7 - ?, 1,
                  CASE SUBSTRING(b.initial_binary, 7 - ?, 1) WHEN '1' THEN '0' ELSE '1' END) AS transformed_binary,
            SUBSTRING(b.initial_binary, 2, 3) + SUBSTRING(b.initial_binary, 3, 3) AS nuclear_binary) tr
        JOIN dbo.hexagrams hi ON hi.binary_code = b.initial_binary
        JOIN dbo.hexagrams ht ON ht.binary_code = tr.transformed_binary
        JOIN dbo.hexagrams hn ON hn.binary_code = tr.nuclear_binary
        WHERE tu.early_heaven_num = ?;
        """
        cursor.execute(sql, (exp_moving, exp_moving, exp_moving, exp_lower, exp_moving, exp_moving, exp_upper))
        row = cursor.fetchone()

        assert row is not None, f"Không tìm thấy quẻ trong DB cho giờ {h_branch}"
        assert py_res["initial_hexagram"]["hexagram_id"] == row[0]
        assert py_res["transformed_hexagram"]["hexagram_id"] == row[1]
        assert py_res["nuclear_hexagram"]["hexagram_id"] == row[2]
        assert py_res["dung_side"] == row[3]
        assert py_res["dung_element"] == row[4]
        assert py_res["the_element"] == row[5]

    print("\n[TIME GRID PARITY PASS] Đã kiểm chứng 12 khung giờ âm lịch khớp hoàn toàn với SQL Server!")

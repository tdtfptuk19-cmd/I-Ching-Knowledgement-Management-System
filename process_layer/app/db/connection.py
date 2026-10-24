#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
connection.py - Quản lý kết nối SQL Server cho KinhDich_KB Process Layer
Tuân thủ: Truy vấn tham số hóa 100%, không nối chuỗi SQL.
"""
import pyodbc
from contextlib import contextmanager
from typing import Generator
from process_layer.app.core.config import settings
from process_layer.app.core.errors import DatabaseError


def get_connection():
    """Tạo kết nối mới đến SQL Server qua chuỗi kết nối chuẩn."""
    try:
        conn_str = settings.get_connection_string()
        conn = pyodbc.connect(conn_str, autocommit=False)
        return conn
    except Exception as e:
        raise DatabaseError(f"Không thể kết nối đến SQL Server: {str(e)}")


@contextmanager
def get_db_cursor() -> Generator[pyodbc.Cursor, None, None]:
    """Context manager cung cấp Cursor và tự động commit / rollback an toàn."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise DatabaseError(f"Lỗi thực thi truy vấn CSDL: {str(e)}")
    finally:
        cursor.close()
        conn.close()

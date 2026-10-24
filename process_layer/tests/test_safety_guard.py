#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_safety_guard.py - Kiểm thử cơ chế bảo vệ CSDL Production (Guard Test)
Yêu cầu (5): Đảm bảo hệ thống chặn đứng mọi nỗ lực test hoặc ghi đè lên KinhDich_KB.
"""
import pytest
from process_layer.app.core.config import settings


def test_production_database_guard():
    current_db = settings.DB_NAME

    # Khi giả lập trỏ vào KinhDich_KB chính
    settings.DB_NAME = "KinhDich_KB"
    try:
        with pytest.raises(RuntimeError) as exc_info:
            settings.assert_not_production_db("Test Execution")
        assert "GUARD VIOLATION" in str(exc_info.value)
    finally:
        # Khôi phục trạng thái dev
        settings.DB_NAME = current_db

    # Khi trỏ vào KinhDich_KB_dev
    settings.DB_NAME = "KinhDich_KB_dev"
    # Phải thực thi an toàn không ném exception
    settings.assert_not_production_db("Test Execution")

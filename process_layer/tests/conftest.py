#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
conftest.py - Cấu hình chung cho Pytest Process Layer
Bảo đảm:
1. Tuyệt đối không trỏ vào CSDL Production 'KinhDich_KB'.
2. Tự động kiểm tra guard trước khi chạy test suite.
"""
import pytest
from process_layer.app.core.config import settings


@pytest.fixture(scope="session", autouse=True)
def guard_against_production_db():
    """Guard an toàn: Chặn đứng mọi nỗ lực chạy test trên CSDL KinhDich_KB chính."""
    settings.assert_not_production_db("Pytest Execution")

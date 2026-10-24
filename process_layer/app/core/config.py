#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
config.py - Cấu hình hệ thống KinhDich_KB Process Layer
Đọc từ biến môi trường (.env), hỗ trợ giá trị mặc định an toàn.
"""
import os
from typing import List


class Settings:
    """Cấu hình ứng dụng tập trung."""

    PROJECT_NAME: str = "KinhDich_KB Process Layer"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database Configuration (Mặc định kết nối KinhDich_KB_dev trong quá trình phát triển)
    DB_SERVER: str = os.getenv("DB_SERVER", "(local)")
    DB_NAME: str = os.getenv("DB_NAME", "KinhDich_KB_dev")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_TRUSTED_CONNECTION: str = os.getenv("DB_TRUSTED_CONNECTION", "yes")

    # Security
    HMAC_SERVER_SECRET: str = os.getenv(
        "HMAC_SERVER_SECRET", "kinhdich_kms301_secret_key_2026_default_salt"
    )

    # Business Logic Defaults
    DEFAULT_RAT_HOUR_RULE: str = os.getenv("DEFAULT_RAT_HOUR_RULE", "NEXT_DAY")
    ENABLE_SEASONAL_WEIGHT: bool = (
        os.getenv("ENABLE_SEASONAL_WEIGHT", "false").lower() == "true"
    )

    # Synthesis Weights (ADR-002) - ASSUMPTION: Can chuyen gia xac nhan
    WEIGHT_ELEMENT: float = float(os.getenv("WEIGHT_ELEMENT", "0.40"))
    WEIGHT_RULES: float = float(os.getenv("WEIGHT_RULES", "0.35"))
    WEIGHT_INTERPRETATION: float = float(os.getenv("WEIGHT_INTERPRETATION", "0.25"))

    # Element 3-stage Weights (ADR-002) - ASSUMPTION: Can chuyen gia xac nhan
    WEIGHT_ELEM_MAIN: float = float(os.getenv("WEIGHT_ELEM_MAIN", "0.50"))
    WEIGHT_ELEM_NUCLEAR: float = float(os.getenv("WEIGHT_ELEM_NUCLEAR", "0.20"))
    WEIGHT_ELEM_TRANSFORMED: float = float(os.getenv("WEIGHT_ELEM_TRANSFORMED", "0.30"))

    # Connection Timeout (seconds)
    DB_TIMEOUT: int = int(os.getenv("DB_TIMEOUT", "5"))

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    def get_connection_string(self) -> str:
        """Sinh chuỗi kết nối ODBC an toàn kèm timeout kết nối, hỗ trợ cả Windows Auth và SQL Auth."""
        driver_str = "{" + self.DB_DRIVER + "}"
        conn_str = f"DRIVER={driver_str};SERVER={self.DB_SERVER};DATABASE={self.DB_NAME};LoginTimeout={self.DB_TIMEOUT};Connection Timeout={self.DB_TIMEOUT};"
        if self.DB_USER and self.DB_PASSWORD:
            conn_str += f"UID={self.DB_USER};PWD={self.DB_PASSWORD};"
        else:
            conn_str += "Trusted_Connection=yes;"
        if "18" in self.DB_DRIVER:
            conn_str += "TrustServerCertificate=yes;"
        return conn_str

    def assert_not_production_db(self, operation: str = "Test/Write"):
        """Guard bảo vệ: Tuyệt đối không cho phép chạy test hoặc ghi dữ liệu thử nghiệm lên CSDL chính KinhDich_KB."""
        if self.DB_NAME.strip().lower() == "kinhdich_kb":
            raise RuntimeError(
                f"GUARD VIOLATION: Thao tác '{operation}' bị từ chối trên CSDL Production 'KinhDich_KB'. "
                f"Chỉ được phép thực thi trên CSDL môi trường phát triển (vd: KinhDich_KB_dev)."
            )


settings = Settings()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
config.py - Cấu hình hệ thống KinhDich_KB Process Layer
Đọc từ biến môi trường (.env), hỗ trợ giá trị mặc định an toàn.
"""
import os
from pathlib import Path
from typing import List, Optional


class Settings:
    """Cấu hình ứng dụng tập trung."""

    PROJECT_NAME: str = "KinhDich_KB Process Layer"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Base Directory (process_layer root)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # System Prompt Path (R1, AC-01)
    DEFAULT_DICH_SU_PROMPT_PATH: Path = BASE_DIR / "app" / "prompts" / "dich_su_system.md"
    DICH_SU_PROMPT_PATH: Path = (
        Path(os.getenv("DICH_SU_PROMPT_PATH"))
        if os.getenv("DICH_SU_PROMPT_PATH")
        else DEFAULT_DICH_SU_PROMPT_PATH
    )
    DEFAULT_DICH_SU_ADVICE_PROMPT_PATH: Path = BASE_DIR / "app" / "prompts" / "dich_su_advice.md"
    DICH_SU_ADVICE_PROMPT_PATH: Path = (
        Path(os.getenv("DICH_SU_ADVICE_PROMPT_PATH"))
        if os.getenv("DICH_SU_ADVICE_PROMPT_PATH")
        else DEFAULT_DICH_SU_ADVICE_PROMPT_PATH
    )

    # LLM Service Configuration (R3, AC-03)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "fake")  # fake | anthropic | gemini
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY", None)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "claude-3-5-sonnet-20241022")
    LLM_TIMEOUT_S: float = float(os.getenv("LLM_TIMEOUT_S", "30.0"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2000"))
    LLM_TOTAL_DEADLINE_S: float = float(os.getenv("LLM_TOTAL_DEADLINE_S", "45.0"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    ALLOW_CLIENT_PAYLOAD: bool = (
        os.getenv("ALLOW_CLIENT_PAYLOAD", "false").lower() == "true"
    )

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

    # Connection Timeout (seconds) - Mặc định 60s để đáp ứng cold start của Azure SQL Serverless
    DB_TIMEOUT: int = int(os.getenv("DB_TIMEOUT", "60"))

    # CORS
    CORS_ORIGINS: List[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    ]

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

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
llm_client.py - LLM Client Protocol & Provider Implementations for Mai Hoa Dịch Số.

This module provides:
1. `LLMClient` protocol defining the uniform LLM invocation interface.
2. `FakeLLMClient` supporting scripted responses, FIFO pop, round-robin, error simulation,
   and invocation history recording for Pytest and offline environments.
3. `AnthropicClient` wrapping httpx.Client for Anthropic Messages API with robust status
   code handling (429, 5xx, timeout, network errors), stop_reason extraction, and strict
   API key redaction.
4. Custom exceptions inheriting from AppError and standard Python exceptions for seamless
   interoperability with retry mechanisms and FastAPI error handlers.
5. `get_llm_client` factory function for provider resolution.
"""

from __future__ import annotations

import logging
import os
import re
import time
from typing import (
    Any,
    Dict,
    List,
    Optional,
    Protocol,
    Sequence,
    Tuple,
    Type,
    Union,
    runtime_checkable,
)

import httpx

from process_layer.app.core.config import settings
from process_layer.app.core.errors import AppError

logger = logging.getLogger(__name__)

# Pattern to detect potential API keys in error strings or payloads
_API_KEY_SCRUB_PATTERN: re.Pattern = re.compile(
    r"(sk-ant-[a-zA-Z0-9_\-]{8,}|AIza[0-9A-Za-z-_]{35}|[a-zA-Z0-9_\-]{32,})",
    re.IGNORECASE,
)


# ============================================================================
# Exceptions
# ============================================================================

class LLMError(AppError):
    """Lớp lỗi cơ sở cho các thao tác gọi LLM."""

    def __init__(
        self,
        message: str,
        code: str = "LLM_ERROR",
        status_code: int = 502,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(code=code, message=message, status_code=status_code, details=details)


class LLMConnectionError(LLMError, ConnectionError):
    """
    Lỗi kết nối mạng, DNS, hoặc lỗi HTTP 429 / 5xx có thể retry.
    Kế thừa cả LLMError và ConnectionError chuẩn của Python.
    """

    def __init__(
        self,
        message: str,
        code: str = "LLM_CONNECTION_ERROR",
        status_code: int = 502,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message=message, code=code, status_code=status_code, details=details)


class LLMTimeoutError(LLMError, TimeoutError):
    """
    Lỗi quá thời gian chờ (timeout) khi gọi API LLM.
    Kế thừa cả LLMError và TimeoutError chuẩn của Python.
    """

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="LLM_TIMEOUT_ERROR",
            status_code=504,
            details=details,
        )


class LLMAuthError(LLMError, PermissionError):
    """
    Lỗi xác thực (thiếu API key hoặc API key không hợp lệ / HTTP 401 / 403).
    Kế thừa cả LLMError và PermissionError chuẩn của Python.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 401,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="LLM_AUTH_ERROR",
            status_code=status_code,
            details=details,
        )


class LLMRateLimitError(LLMConnectionError):
    """
    Lỗi vượt ngưỡng gọi API (HTTP 429 Too Many Requests).
    Kế thừa LLMConnectionError để bộ điều phối nhận diện là lỗi có thể retry.
    """

    def __init__(
        self,
        message: str,
        retry_after: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        det = dict(details or {})
        if retry_after is not None:
            det["retry_after"] = retry_after
        super().__init__(
            message=message,
            code="LLM_RATE_LIMIT_ERROR",
            status_code=429,
            details=det,
        )
        self.retry_after = retry_after


class LLMServerError(LLMConnectionError):
    """
    Lỗi máy chủ nhà cung cấp LLM (HTTP 500, 502, 503, 504).
    Kế thừa LLMConnectionError để bộ điều phối nhận diện là lỗi có thể retry.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="LLM_SERVER_ERROR",
            status_code=status_code,
            details=details,
        )


class LLMResponseError(LLMError):
    """
    Lỗi dữ liệu phản hồi không hợp lệ hoặc không trích xuất được nội dung.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 502,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="LLM_RESPONSE_ERROR",
            status_code=status_code,
            details=details,
        )


# ============================================================================
# Protocol Definition
# ============================================================================

@runtime_checkable
class LLMClient(Protocol):
    """
    Interface chuẩn hóa cho mọi nhà cung cấp LLM trong hệ thống Mai Hoa Dịch Số.
    """

    def generate(
        self,
        system: str,
        user: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        timeout: float = 30.0,
    ) -> tuple[str, str]:
        """
        Sinh nội dung luận giải từ LLM.

        Args:
            system: Chỉ dẫn hệ thống (System Prompt).
            user: Nội dung câu hỏi và ngữ cảnh dữ liệu (User Message).
            temperature: Nhiệt độ ngẫu nhiên (mặc định: 0.3).
            max_tokens: Giới hạn token đầu ra tối đa (mặc định: 2000).
            timeout: Thời gian chờ tối đa cho 1 request tính bằng giây (mặc định: 30.0).

        Returns:
            tuple[str, str]: (nội_dung_văn_bản, stop_reason)
            stop_reason: "end_turn", "max_tokens", hoặc "stop_sequence".
        """
        ...


# ============================================================================
# FakeLLMClient Implementation
# ============================================================================

class FakeLLMClient:
    """
    Client giả lập phục vụ kiểm thử đơn vị, kiểm thử tích hợp và chạy offline.

    Tính năng:
    - Nhận danh sách kịch bản phản hồi (scripted_responses).
    - Hỗ trợ phần tử là `str`, `tuple[str, str]`, hoặc Exception/Exception type.
    - Hỗ trợ chế độ 'fifo' (rút dần từng phản hồi) hoặc 'round_robin' (xoay vòng).
    - Tự động ghi lại lịch sử gọi hàm (`call_history`) phục vụ đối soát trong test.
    - Hỗ trợ mô phỏng lỗi (raising Exception khi scripted).
    """

    def __init__(
        self,
        scripted_responses: Optional[
            Sequence[Union[str, Tuple[str, str], Exception, Type[Exception]]]
        ] = None,
        mode: str = "fifo",
        default_response: Union[str, Tuple[str, str]] = ("", "end_turn"),
        force_error: Optional[Union[Exception, Type[Exception]]] = None,
        simulate_delay: float = 0.0,
    ) -> None:
        self._mode = mode.lower()
        if self._mode not in ("fifo", "round_robin", "cycle"):
            raise ValueError(f"Chế độ không hợp lệ: '{mode}'. Chỉ hỗ trợ 'fifo' hoặc 'round_robin'.")

        self._scripted_responses: List[
            Union[str, Tuple[str, str], Exception, Type[Exception]]
        ] = list(scripted_responses or [])
        self._default_response = self._normalize_response(default_response)
        self._force_error = force_error
        self._simulate_delay = simulate_delay
        self.call_history: List[Dict[str, Any]] = []
        self._call_index: int = 0

    @staticmethod
    def _normalize_response(resp: Union[str, Tuple[str, str]]) -> Tuple[str, str]:
        if isinstance(resp, str):
            return resp, "end_turn"
        if isinstance(resp, (tuple, list)) and len(resp) >= 2:
            return str(resp[0]), str(resp[1])
        if isinstance(resp, (tuple, list)) and len(resp) == 1:
            return str(resp[0]), "end_turn"
        return str(resp), "end_turn"

    def add_response(
        self,
        response: Union[str, Tuple[str, str], Exception, Type[Exception]],
    ) -> None:
        """Thêm phản hồi hoặc lỗi vào hàng đợi kịch bản."""
        self._scripted_responses.append(response)

    def reset(self, clear_history: bool = True, reset_queue: bool = False) -> None:
        """Làm sạch lịch sử gọi và tùy chọn đặt lại hàng đợi."""
        if clear_history:
            self.call_history.clear()
            self._call_index = 0
        if reset_queue:
            self._scripted_responses.clear()

    @property
    def call_count(self) -> int:
        """Số lần generate đã được gọi."""
        return len(self.call_history)

    @property
    def last_call(self) -> Optional[Dict[str, Any]]:
        """Chi tiết lần gọi generate gần nhất."""
        return self.call_history[-1] if self.call_history else None

    @property
    def last_user_prompt(self) -> Optional[str]:
        """User prompt của lần gọi gần nhất."""
        return self.call_history[-1]["user"] if self.call_history else None

    @property
    def last_system_prompt(self) -> Optional[str]:
        """System prompt của lần gọi gần nhất."""
        return self.call_history[-1]["system"] if self.call_history else None

    def generate(
        self,
        system: str,
        user: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        timeout: float = 30.0,
    ) -> tuple[str, str]:
        """
        Thực hiện sinh kết quả giả lập theo kịch bản đã cấu hình.
        """
        current_index = self._call_index
        self._call_index += 1

        if self._simulate_delay > 0:
            time.sleep(self._simulate_delay)

        # Kiểm tra force_error cấp độ instance
        if self._force_error is not None:
            err = self._force_error() if isinstance(self._force_error, type) else self._force_error
            self.call_history.append({
                "call_index": current_index,
                "system": system,
                "user": user,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
                "error": err,
                "timestamp": time.time(),
            })
            raise err

        # Lấy phản hồi từ kịch bản
        target_item: Any = None
        if self._mode == "fifo":
            if self._scripted_responses:
                target_item = self._scripted_responses.pop(0)
            else:
                target_item = self._default_response
        else:  # round_robin / cycle
            if self._scripted_responses:
                target_item = self._scripted_responses[
                    current_index % len(self._scripted_responses)
                ]
            else:
                target_item = self._default_response

        # Xử lý trường hợp item là Exception
        if isinstance(target_item, type) and issubclass(target_item, BaseException):
            err = target_item(f"Fake simulated error: {target_item.__name__}")
            self.call_history.append({
                "call_index": current_index,
                "system": system,
                "user": user,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
                "error": err,
                "timestamp": time.time(),
            })
            raise err
        elif isinstance(target_item, BaseException):
            self.call_history.append({
                "call_index": current_index,
                "system": system,
                "user": user,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
                "error": target_item,
                "timestamp": time.time(),
            })
            raise target_item

        # Chuẩn hóa kết quả trả về
        result = self._normalize_response(target_item)
        self.call_history.append({
            "call_index": current_index,
            "system": system,
            "user": user,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timeout": timeout,
            "response": result,
            "timestamp": time.time(),
        })
        return result


# ============================================================================
# AnthropicClient Implementation
# ============================================================================

class AnthropicClient:
    """
    Client kết nối Anthropic Messages API dùng httpx.Client đồng bộ.

    Bảo mật:
    - Tuyệt đối không log hoặc print API key.
    - Phương thức `__repr__` và `__str__` ẩn API key bằng mặt nạ (`_mask_api_key`).
    - Lọc bỏ chuỗi khóa nhạy cảm trong thông báo lỗi trước khi lưu log hoặc bắn exception.

    Xử lý lỗi:
    - HTTP 401/403 -> LLMAuthError.
    - HTTP 429 -> LLMRateLimitError (kế thừa LLMConnectionError).
    - HTTP 500..504 -> LLMServerError (kế thừa LLMConnectionError).
    - Timeout -> LLMTimeoutError (kế thừa TimeoutError).
    - Lỗi kết nối mạng -> LLMConnectionError (kế thừa ConnectionError).
    """

    DEFAULT_BASE_URL: str = "https://api.anthropic.com"
    ANTHROPIC_VERSION: str = "2023-06-01"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        client: Optional[httpx.Client] = None,
        default_timeout: Optional[float] = None,
    ) -> None:
        self.api_key: Optional[str] = (
            api_key
            if api_key is not None
            else (os.getenv("LLM_API_KEY") or getattr(settings, "LLM_API_KEY", None))
        )
        self.model: str = (
            model
            if model is not None
            else (os.getenv("LLM_MODEL") or getattr(settings, "LLM_MODEL", "claude-3-5-sonnet-20241022"))
        )
        self.base_url: str = (
            base_url
            if base_url is not None
            else os.getenv("LLM_BASE_URL", self.DEFAULT_BASE_URL)
        ).rstrip("/")

        self._default_timeout: float = (
            default_timeout
            if default_timeout is not None
            else float(getattr(settings, "LLM_TIMEOUT_S", 30.0))
        )

        # Cho phép inject httpx.Client (hỗ trợ MockTransport trong test)
        self._owned_client: bool = client is None
        self._http_client: httpx.Client = client or httpx.Client(
            timeout=self._default_timeout,
        )

    @staticmethod
    def _mask_api_key(key: Optional[str]) -> str:
        """Tạo mặt nạ bảo mật cho API key, không để lộ khóa bí mật."""
        if not key:
            return "<unset>"
        clean = key.strip()
        if len(clean) <= 8:
            return "***"
        return f"{clean[:6]}...{clean[-4:]}"

    @classmethod
    def _sanitize_message(cls, message: str) -> str:
        """Khử các chuỗi có định dạng giống khóa API trước khi hiển thị trong lỗi."""
        if not message:
            return ""
        return _API_KEY_SCRUB_PATTERN.sub("[REDACTED_KEY]", str(message))

    def __repr__(self) -> str:
        return (
            f"<AnthropicClient model='{self.model}' "
            f"api_key='{self._mask_api_key(self.api_key)}' "
            f"base_url='{self.base_url}'>"
        )

    def __str__(self) -> str:
        return self.__repr__()

    def close(self) -> None:
        """Đóng kết nối HTTP client nếu do instance tự tạo."""
        if self._owned_client and not self._http_client.is_closed:
            self._http_client.close()

    def __enter__(self) -> "AnthropicClient":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()

    def generate(
        self,
        system: str,
        user: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        timeout: float = 30.0,
    ) -> tuple[str, str]:
        """
        Gửi yêu cầu tới Anthropic Messages API và trích xuất kết quả.

        Returns:
            tuple[str, str]: (text_content, stop_reason)
        """
        if not self.api_key or not self.api_key.strip():
            raise LLMAuthError(
                "Anthropic API key is not configured. Set the LLM_API_KEY environment variable."
            )

        endpoint_url = f"{self.base_url}/v1/messages"
        headers = {
            "x-api-key": self.api_key.strip(),
            "anthropic-version": self.ANTHROPIC_VERSION,
            "content-type": "application/json",
        }

        payload = {
            "model": self.model,
            "system": system,
            "messages": [
                {"role": "user", "content": user}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        # Gửi request với xử lý ngoại lệ mạng và timeout
        try:
            response = self._http_client.post(
                endpoint_url,
                headers=headers,
                json=payload,
                timeout=timeout,
            )
        except httpx.TimeoutException as exc:
            msg = f"Anthropic API request timed out after {timeout:.1f}s."
            logger.warning(msg)
            raise LLMTimeoutError(msg) from exc
        except (httpx.NetworkError, httpx.ConnectError) as exc:
            sanitized_exc = self._sanitize_message(str(exc))
            msg = f"Anthropic API network connection failed: {type(exc).__name__} ({sanitized_exc})"
            logger.warning(msg)
            raise LLMConnectionError(msg) from exc
        except Exception as exc:
            sanitized_exc = self._sanitize_message(str(exc))
            msg = f"Unexpected error during Anthropic API request: {type(exc).__name__} ({sanitized_exc})"
            logger.error(msg)
            raise LLMConnectionError(msg) from exc

        # Kiểm tra và phân loại HTTP status code
        status = response.status_code

        if status == 200:
            # Thành công, phân tích cú pháp JSON
            try:
                data = response.json()
            except Exception as exc:
                msg = "Anthropic API response body could not be decoded as JSON."
                raise LLMResponseError(msg) from exc

            # Trích xuất nội dung văn bản
            content_blocks = data.get("content", [])
            text_chunks: List[str] = []
            for block in content_blocks:
                if isinstance(block, dict) and block.get("type") == "text":
                    text_chunks.append(block.get("text", ""))

            full_text = "".join(text_chunks)
            stop_reason = data.get("stop_reason") or "end_turn"
            return full_text, stop_reason

        # Xử lý các mã lỗi HTTP cụ thể
        sanitized_body = self._sanitize_message(response.text)

        if status in (401, 403):
            raise LLMAuthError(
                f"Anthropic API authentication failed (HTTP {status}): {sanitized_body}",
                status_code=status,
            )

        if status == 429:
            # Thử trích xuất retry-after header
            retry_after_hdr = response.headers.get("retry-after")
            retry_after_val: Optional[float] = None
            if retry_after_hdr:
                try:
                    retry_after_val = float(retry_after_hdr)
                except ValueError:
                    retry_after_val = None

            raise LLMRateLimitError(
                f"Anthropic API rate limit exceeded (HTTP 429): {sanitized_body}",
                retry_after=retry_after_val,
            )

        if 500 <= status <= 599:
            raise LLMServerError(
                f"Anthropic API server error (HTTP {status}): {sanitized_body}",
                status_code=status,
            )

        # Lỗi 4xx khác (e.g. 400 Bad Request, 422 Unprocessable Entity)
        raise LLMResponseError(
            f"Anthropic API client error (HTTP {status}): {sanitized_body}",
            status_code=status,
        )


# ============================================================================
# GeminiClient Implementation
# ============================================================================

class GeminiClient:
    """
    Client kết nối Google Gemini API (generateContent) dùng httpx.Client đồng bộ.

    Bảo mật:
    - Tuyệt đối không đưa API key vào query parameter trên URL để tránh rò rỉ log.
    - Truyền API key qua header `x-goog-api-key`.
    - Phương thức `__repr__` và `__str__` ẩn API key bằng mặt nạ (`_mask_api_key`).
    - Lọc bỏ chuỗi khóa nhạy cảm trong thông báo lỗi trước khi lưu log hoặc bắn exception.

    Xử lý lỗi:
    - HTTP 400 -> LLMResponseError.
    - HTTP 401/403 -> LLMAuthError.
    - HTTP 429 -> LLMRateLimitError (kế thừa LLMConnectionError).
    - HTTP 500..599 -> LLMServerError (kế thừa LLMConnectionError).
    - Timeout -> LLMTimeoutError (kế thừa TimeoutError).
    - Lỗi kết nối mạng -> LLMConnectionError (kế thừa ConnectionError).
    """

    DEFAULT_BASE_URL: str = "https://generativelanguage.googleapis.com"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        client: Optional[httpx.Client] = None,
        default_timeout: Optional[float] = None,
    ) -> None:
        self.api_key: Optional[str] = (
            api_key
            if api_key is not None
            else (
                os.getenv("GEMINI_API_KEY")
                or os.getenv("LLM_API_KEY")
                or getattr(settings, "GEMINI_API_KEY", None)
                or getattr(settings, "LLM_API_KEY", None)
            )
        )
        self.model: str = (
            model
            if model is not None
            else (
                os.getenv("LLM_MODEL")
                or getattr(settings, "LLM_MODEL", "gemini-2.5-flash")
            )
        )
        self.base_url: str = (
            base_url
            if base_url is not None
            else os.getenv("LLM_BASE_URL", self.DEFAULT_BASE_URL)
        ).rstrip("/")

        self._default_timeout: float = (
            default_timeout
            if default_timeout is not None
            else float(getattr(settings, "LLM_TIMEOUT_S", 30.0))
        )

        # Cho phép inject httpx.Client (hỗ trợ MockTransport trong test)
        self._owned_client: bool = client is None
        self._http_client: httpx.Client = client or httpx.Client(
            timeout=self._default_timeout,
        )

    @staticmethod
    def _mask_api_key(key: Optional[str]) -> str:
        """Tạo mặt nạ bảo mật cho API key, không để lộ khóa bí mật."""
        if not key:
            return "<unset>"
        clean = key.strip()
        if len(clean) <= 8:
            return "***"
        return f"{clean[:6]}...{clean[-4:]}"

    @classmethod
    def _sanitize_message(cls, message: str) -> str:
        """Khử các chuỗi có định dạng giống khóa API trước khi hiển thị trong lỗi."""
        if not message:
            return ""
        return _API_KEY_SCRUB_PATTERN.sub("[REDACTED_KEY]", str(message))

    def __repr__(self) -> str:
        return (
            f"<GeminiClient model='{self.model}' "
            f"api_key='{self._mask_api_key(self.api_key)}' "
            f"base_url='{self.base_url}'>"
        )

    def __str__(self) -> str:
        return self.__repr__()

    def close(self) -> None:
        """Đóng kết nối HTTP client nếu do instance tự tạo."""
        if self._owned_client and not self._http_client.is_closed:
            self._http_client.close()

    def __enter__(self) -> "GeminiClient":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()

    def generate(
        self,
        system: str,
        user: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        timeout: float = 30.0,
    ) -> tuple[str, str]:
        """
        Gửi yêu cầu tới Google Gemini API (generateContent) và trích xuất kết quả.

        Returns:
            tuple[str, str]: (text_content, stop_reason)
        """
        if not self.api_key or not self.api_key.strip():
            raise LLMAuthError(
                "Gemini API key is not configured. Set the GEMINI_API_KEY or LLM_API_KEY environment variable."
            )

        endpoint_url = f"{self.base_url}/v1beta/models/{self.model}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key.strip(),
            "content-type": "application/json",
        }

        payload = {
            "systemInstruction": {
                "parts": [{"text": system}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        try:
            response = self._http_client.post(
                endpoint_url,
                headers=headers,
                json=payload,
                timeout=timeout,
            )
        except httpx.TimeoutException as exc:
            msg = f"Gemini API request timed out after {timeout:.1f}s."
            logger.warning(msg)
            raise LLMTimeoutError(msg) from exc
        except (httpx.NetworkError, httpx.ConnectError) as exc:
            sanitized_exc = self._sanitize_message(str(exc))
            msg = f"Gemini API network connection failed: {type(exc).__name__} ({sanitized_exc})"
            logger.warning(msg)
            raise LLMConnectionError(msg) from exc
        except Exception as exc:
            sanitized_exc = self._sanitize_message(str(exc))
            msg = f"Unexpected error during Gemini API request: {type(exc).__name__} ({sanitized_exc})"
            logger.error(msg)
            raise LLMConnectionError(msg) from exc

        status = response.status_code

        if status == 200:
            try:
                data = response.json()
            except Exception as exc:
                msg = "Gemini API response body could not be decoded as JSON."
                raise LLMResponseError(msg) from exc

            candidates = data.get("candidates", [])
            if not candidates:
                # Kiểm tra promptFeedback
                pf = data.get("promptFeedback", {})
                block_reason = pf.get("blockReason")
                if block_reason:
                    return "", "safety"
                return "", "end_turn"

            first_candidate = candidates[0]
            content_obj = first_candidate.get("content", {})
            parts = content_obj.get("parts", []) if isinstance(content_obj, dict) else []
            text_chunks: List[str] = [
                p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p
            ]
            full_text = "".join(text_chunks)

            raw_finish = first_candidate.get("finishReason", "STOP")
            if raw_finish == "STOP":
                stop_reason = "end_turn"
            elif raw_finish == "MAX_TOKENS":
                stop_reason = "max_tokens"
            elif raw_finish in ("SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT"):
                stop_reason = "safety"
            else:
                stop_reason = "end_turn"

            return full_text, stop_reason

        sanitized_body = self._sanitize_message(response.text)

        if status in (401, 403):
            raise LLMAuthError(
                f"Gemini API authentication failed (HTTP {status}): {sanitized_body}",
                status_code=status,
            )

        if status == 429:
            retry_after_hdr = response.headers.get("retry-after")
            retry_after_val: Optional[float] = None
            if retry_after_hdr:
                try:
                    retry_after_val = float(retry_after_hdr)
                except ValueError:
                    retry_after_val = None

            raise LLMRateLimitError(
                f"Gemini API rate limit exceeded (HTTP 429): {sanitized_body}",
                retry_after=retry_after_val,
            )

        if 500 <= status <= 599:
            raise LLMServerError(
                f"Gemini API server error (HTTP {status}): {sanitized_body}",
                status_code=status,
            )

        raise LLMResponseError(
            f"Gemini API client error (HTTP {status}): {sanitized_body}",
            status_code=status,
        )


# ============================================================================
# Factory Resolution
# ============================================================================

def get_llm_client(
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    scripted_responses: Optional[Sequence[Any]] = None,
    **kwargs: Any,
) -> LLMClient:
    """
    Factory khởi tạo đối tượng tuân thủ giao thức LLMClient.

    Args:
        provider: Tên nhà cung cấp ('fake', 'anthropic', hoặc 'gemini'). Mặc định đọc từ Settings.
        api_key: Khóa API cho Anthropic/Gemini.
        model: Tên mô hình LLM.
        scripted_responses: Danh sách phản hồi mẫu dùng cho FakeLLMClient.
        **kwargs: Các tham số bổ sung chuyển tiếp cho constructor của client.

    Returns:
        LLMClient: Đối tượng thực thi giao thức LLMClient.
    """
    target_provider = (
        provider
        if provider is not None
        else (os.getenv("LLM_PROVIDER") or getattr(settings, "LLM_PROVIDER", "fake"))
    ).strip().lower()

    if target_provider == "fake":
        return FakeLLMClient(scripted_responses=scripted_responses, **kwargs)
    elif target_provider == "anthropic":
        return AnthropicClient(api_key=api_key, model=model, **kwargs)
    elif target_provider == "gemini":
        return GeminiClient(api_key=api_key, model=model, **kwargs)
    else:
        raise ValueError(
            f"Unsupported LLM provider: '{target_provider}'. Supported options: 'fake', 'anthropic', 'gemini'."
        )

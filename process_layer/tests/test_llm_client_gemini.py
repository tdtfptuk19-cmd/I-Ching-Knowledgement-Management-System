#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_llm_client_gemini.py - Unit tests for GeminiClient and factory resolution.
"""
import json
import pytest
import httpx

from process_layer.app.engines.llm_client import (
    GeminiClient,
    LLMAuthError,
    LLMConnectionError,
    LLMRateLimitError,
    LLMResponseError,
    LLMServerError,
    LLMTimeoutError,
    get_llm_client,
)


FAKE_API_KEY = "AIzaSyFakeKey1234567890abcdefghijklmno"


def test_gemini_client_success_stop():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("x-goog-api-key") == FAKE_API_KEY
        assert "key=" not in str(request.url)
        body = json.loads(request.content.decode("utf-8"))
        assert body["systemInstruction"]["parts"][0]["text"] == "System prompt"
        assert body["contents"][0]["parts"][0]["text"] == "User question"

        resp_data = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "- Lời khuyên 1 [Ngũ hành·THE_DUNG_MAIN]\n"},
                            {"text": "- Lời khuyên 2 [Đại tượng, p. 10]"},
                        ],
                        "role": "model",
                    },
                    "finishReason": "STOP",
                }
            ]
        }
        return httpx.Response(200, json=resp_data)

    transport = httpx.MockTransport(handler)
    client = httpx.Client(transport=transport)
    gemini = GeminiClient(api_key=FAKE_API_KEY, model="gemini-2.5-flash", client=client)

    text, stop_reason = gemini.generate(system="System prompt", user="User question")
    assert stop_reason == "end_turn"
    assert "Lời khuyên 1" in text
    assert "Lời khuyên 2" in text


def test_gemini_client_finish_reasons():
    cases = [
        ("MAX_TOKENS", "max_tokens"),
        ("SAFETY", "safety"),
        ("RECITATION", "safety"),
        ("BLOCKLIST", "safety"),
        ("OTHER", "end_turn"),
    ]

    for raw_reason, expected_stop in cases:
        def handler(request: httpx.Request) -> httpx.Response:
            resp_data = {
                "candidates": [
                    {
                        "content": {"parts": [{"text": "Sample text"}]},
                        "finishReason": raw_reason,
                    }
                ]
            }
            return httpx.Response(200, json=resp_data)

        transport = httpx.MockTransport(handler)
        gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
        text, stop_reason = gemini.generate("sys", "user")
        assert stop_reason == expected_stop


def test_gemini_client_prompt_feedback_blocked():
    def handler(request: httpx.Request) -> httpx.Response:
        resp_data = {
            "promptFeedback": {"blockReason": "SAFETY"},
            "candidates": [],
        }
        return httpx.Response(200, json=resp_data)

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    text, stop_reason = gemini.generate("sys", "user")
    assert text == ""
    assert stop_reason == "safety"


def test_gemini_client_missing_key():
    gemini = GeminiClient(api_key="")
    with pytest.raises(LLMAuthError):
        gemini.generate("sys", "user")


def test_gemini_client_auth_error_401():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, text=f"API key {FAKE_API_KEY} is invalid.")

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    with pytest.raises(LLMAuthError) as exc_info:
        gemini.generate("sys", "user")
    assert FAKE_API_KEY not in str(exc_info.value)
    assert "[REDACTED_KEY]" in str(exc_info.value)


def test_gemini_client_rate_limit_429():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, headers={"retry-after": "5.5"}, text="Quota exceeded")

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    with pytest.raises(LLMRateLimitError) as exc_info:
        gemini.generate("sys", "user")
    assert exc_info.value.retry_after == 5.5


def test_gemini_client_server_error_500():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="Internal Server Error")

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    with pytest.raises(LLMServerError):
        gemini.generate("sys", "user")


def test_gemini_client_client_error_400():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, text="Bad Request: invalid argument")

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    with pytest.raises(LLMResponseError):
        gemini.generate("sys", "user")


def test_gemini_client_timeout():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Read timed out")

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    with pytest.raises(LLMTimeoutError):
        gemini.generate("sys", "user")


def test_gemini_client_network_error():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError(f"Connection refused with {FAKE_API_KEY}")

    transport = httpx.MockTransport(handler)
    gemini = GeminiClient(api_key=FAKE_API_KEY, client=httpx.Client(transport=transport))
    with pytest.raises(LLMConnectionError) as exc_info:
        gemini.generate("sys", "user")
    assert FAKE_API_KEY not in str(exc_info.value)
    assert "[REDACTED_KEY]" in str(exc_info.value)


def test_gemini_client_repr_and_factory():
    gemini = get_llm_client(provider="gemini", api_key=FAKE_API_KEY, model="gemini-2.5-flash")
    assert isinstance(gemini, GeminiClient)
    assert FAKE_API_KEY not in repr(gemini)
    assert "AIzaSy..." in repr(gemini)

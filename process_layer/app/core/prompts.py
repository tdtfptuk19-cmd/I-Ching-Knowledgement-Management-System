#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
prompts.py - Dynamic System Prompt Loader for KinhDich_KB Process Layer (Milestone M1)

Features:
1. Pure dynamic loading from markdown file (default: process_layer/app/prompts/dich_su_system.md).
2. Zero hardcoded fallback strings for system prompt content in Python.
3. Thread-safe in-memory caching with mtime-aware auto-reload (fast-path cache hits).
4. Regex version extraction: r"^<!--\s*version:\s*([^\s>]+)\s*-->".
5. UTF-8 decoding without BOM and Unicode NFC normalization.
"""

from pathlib import Path
import re
from threading import Lock
from typing import Optional, Tuple, Dict
import unicodedata

from process_layer.app.core.config import settings

# Regex for version metadata extraction at line 1
VERSION_PATTERN = re.compile(
    r"^<!--\s*version:\s*([^\s>]+)\s*-->",
    re.MULTILINE
)


class _PromptCacheEntry:
    __slots__ = ("text", "version", "mtime")

    def __init__(self, text: str, version: str, mtime: float):
        self.text = text
        self.version = version
        self.mtime = mtime


_CACHE: Dict[Path, _PromptCacheEntry] = {}
_CACHE_LOCK = Lock()


def extract_prompt_version(content: str) -> str:
    """
    Extract prompt version from HTML comment metadata (e.g., <!-- version: v3.0 -->).
    Defaults to 'v3.0' if not found.
    """
    match = VERSION_PATTERN.search(content)
    if match:
        return match.group(1).strip()
    return "v3.0"


def clear_prompt_cache() -> None:
    """Clear in-memory prompt cache. Useful for test isolation."""
    with _CACHE_LOCK:
        _CACHE.clear()


def load_dich_su_system_prompt(
    path: Optional[Path] = None,
    reload: bool = False,
) -> Tuple[str, str]:
    """
    Dynamically loads the Dich Su System Prompt and extracts its version.

    Args:
        path: Optional Path to the prompt markdown file. If None, uses settings.DICH_SU_PROMPT_PATH.
        reload: If True, bypasses cache and reloads from disk.

    Returns:
        Tuple[str, str]: (prompt_text, prompt_version)

    Raises:
        FileNotFoundError: If the prompt file does not exist.
        ValueError: If path is not a file or file content is empty.
    """
    target_path = (Path(path) if path is not None else settings.DICH_SU_PROMPT_PATH).resolve()

    if not target_path.exists():
        raise FileNotFoundError(
            f"System prompt file not found at: {target_path}"
        )

    if not target_path.is_file():
        raise ValueError(
            f"System prompt path is not a file: {target_path}"
        )

    current_mtime = target_path.stat().st_mtime

    with _CACHE_LOCK:
        if not reload and target_path in _CACHE:
            entry = _CACHE[target_path]
            if entry.mtime == current_mtime:
                return entry.text, entry.version

    # Disk read with UTF-8
    raw_content = target_path.read_text(encoding="utf-8")

    # Strip UTF-8 BOM if present
    if raw_content.startswith("\ufeff"):
        raw_content = raw_content[1:]

    # Unicode NFC normalization (R5)
    normalized_content = unicodedata.normalize("NFC", raw_content)

    if not normalized_content.strip():
        raise ValueError(
            f"System prompt file is empty: {target_path}"
        )

    version = extract_prompt_version(normalized_content)

    with _CACHE_LOCK:
        _CACHE[target_path] = _PromptCacheEntry(
            text=normalized_content,
            version=version,
            mtime=current_mtime,
        )

    return normalized_content, version


def load_dich_su_advice_prompt(
    path: Optional[Path] = None,
    reload: bool = False,
) -> Tuple[str, str]:
    """
    Tải động System Prompt cho khối Lời khuyên Hành động (AI Advice Layer).
    """
    target_path = (Path(path) if path is not None else settings.DICH_SU_ADVICE_PROMPT_PATH).resolve()

    if not target_path.exists():
        raise FileNotFoundError(
            f"Advice prompt file not found at: {target_path}"
        )

    if not target_path.is_file():
        raise ValueError(
            f"Advice prompt path is not a file: {target_path}"
        )

    current_mtime = target_path.stat().st_mtime

    with _CACHE_LOCK:
        if not reload and target_path in _CACHE:
            entry = _CACHE[target_path]
            if entry.mtime == current_mtime:
                return entry.text, entry.version

    raw_content = target_path.read_text(encoding="utf-8")
    if raw_content.startswith("\ufeff"):
        raw_content = raw_content[1:]
    normalized_content = unicodedata.normalize("NFC", raw_content)

    if not normalized_content.strip():
        raise ValueError(
            f"Advice prompt file is empty: {target_path}"
        )

    version = extract_prompt_version(normalized_content)

    with _CACHE_LOCK:
        _CACHE[target_path] = _PromptCacheEntry(
            text=normalized_content,
            version=version,
            mtime=current_mtime,
        )

    return normalized_content, version


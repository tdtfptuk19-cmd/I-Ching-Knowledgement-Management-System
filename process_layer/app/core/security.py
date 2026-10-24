#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
security.py - Cơ chế bảo mật ẩn danh hóa HMAC và phân quyền RBAC
Tuân thủ ADR-005: Không lưu PII thô, pseudonymized_user_hash = HMAC-SHA256(user_id, SERVER_SECRET)
"""
import hmac
import hashlib
import os
from enum import Enum
from typing import Optional

DEFAULT_SECRET = "kinhdich_kms301_secret_key_2026_default_salt"


class UserRole(str, Enum):
    NOVICE = "NOVICE"
    PRACTITIONER = "PRACTITIONER"
    EXPERT = "EXPERT"
    REVIEWER = "REVIEWER"
    ADMIN = "ADMIN"


def get_server_secret() -> str:
    """Lấy SERVER_SECRET từ biến môi trường, không hard-code."""
    return os.getenv("HMAC_SERVER_SECRET", DEFAULT_SECRET)


def hash_user_id(user_id: str, secret: Optional[str] = None) -> str:
    """
    Tạo mã băm ẩn danh HMAC-SHA256 64 ký tự hex cho người dùng.
    Phù hợp với kiểu VARCHAR(64) trong bảng divination_cases.
    """
    sec = secret or get_server_secret()
    key = sec.encode("utf-8")
    msg = (user_id or "anonymous_guest").strip().encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def can_view_expert_details(role: str) -> bool:
    """Kiểm tra quyền xem chi tiết Hán văn, Thoán truyện, rule_trace."""
    return role in (UserRole.EXPERT.value, UserRole.REVIEWER.value, UserRole.ADMIN.value)


def can_review_submissions(role: str) -> bool:
    """Kiểm tra quyền phê duyệt bài đóng góp (Validation Gate)."""
    return role in (UserRole.REVIEWER.value, UserRole.ADMIN.value)


def can_submit_knowledge(role: str) -> bool:
    """Kiểm tra quyền đóng góp tri thức mới."""
    return role in (
        UserRole.PRACTITIONER.value,
        UserRole.EXPERT.value,
        UserRole.REVIEWER.value,
        UserRole.ADMIN.value,
    )


def validate_review_permission(reviewer_id: str, author_id: str, role: str) -> bool:
    """
    Quy tắc chống tự duyệt: Reviewer không được duyệt bài do chính mình đóng góp.
    """
    if not can_review_submissions(role):
        return False
    if reviewer_id and author_id and reviewer_id.strip() == author_id.strip():
        return False
    return True

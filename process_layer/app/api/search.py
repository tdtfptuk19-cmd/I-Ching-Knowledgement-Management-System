#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
search.py - API Router cho dịch vụ Tra cứu & Tìm kiếm Tri thức (Mô-đun 4)
Endpoints:
- GET /api/v1/hexagram/{id}
- GET /api/v1/search
"""
from typing import Optional
from fastapi import APIRouter, Query, Path, HTTPException

from process_layer.app.schemas.search import HexagramDetailResponse, SearchResponse
from process_layer.app.schemas.divination import UserLevel
from process_layer.app.engines.search_service import SearchService
from process_layer.app.core.errors import NotFoundError, ValidationError

router = APIRouter(prefix="", tags=["Search & Hexagrams"])


@router.get("/hexagram/{id}", response_model=HexagramDetailResponse)
def get_hexagram_detail(
    id: int = Path(..., ge=1, le=64, description="Mã quẻ kép (1–64)"),
    user_level: UserLevel = Query(UserLevel.NOVICE, description="Cấp độ người dùng để cá nhân hóa kết quả"),
):
    """
    Tra cứu cấu trúc Bát quái, 64 quẻ, kinh văn nguyên tử và diễn giải theo chủ đề.
    Cá nhân hóa nội dung theo cấp độ người dùng (NOVICE, PRACTITIONER, EXPERT).
    """
    try:
        return SearchService.get_hexagram_detail(hexagram_id=id, user_level=user_level)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": str(e)})
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": str(e)})


@router.get("/search", response_model=SearchResponse)
def search_knowledge(
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm (chữ Hán hoặc tiếng Việt không dấu/có dấu)"),
    topic: Optional[str] = Query(None, description="Lọc theo chủ đề: CAREER, FINANCE, HEALTH, RELATIONSHIP, ACADEMIC, GENERAL"),
    upper_trigram: Optional[str] = Query(None, description="Lọc theo tên quẻ Thượng (ví dụ: Càn, Khôn, Ly...)"),
    lower_trigram: Optional[str] = Query(None, description="Lọc theo tên quẻ Hạ (ví dụ: Càn, Đoài, Chấn...)"),
    user_level: UserLevel = Query(UserLevel.NOVICE, description="Cấp độ người dùng"),
    page: int = Query(1, ge=1, description="Số trang hiển thị"),
    page_size: int = Query(20, ge=1, le=100, description="Số kết quả mỗi trang"),
):
    """
    Tìm kiếm tri thức đa tiêu chí trên kho kinh văn và diễn giải đã duyệt.
    Hỗ trợ tìm kiếm tiếng Việt không dấu, tìm kiếm chữ Hán, lọc quẻ Thượng/Hạ và phân trang.
    """
    return SearchService.search_knowledge(
        q=q,
        topic=topic,
        upper_trigram=upper_trigram,
        lower_trigram=lower_trigram,
        user_level=user_level,
        page=page,
        page_size=page_size,
    )

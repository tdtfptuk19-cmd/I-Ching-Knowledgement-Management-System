#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
search.py - Schema Pydantic v2 cho dịch vụ Tra cứu & Tìm kiếm Tri thức (Mô-đun 4)
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from process_layer.app.schemas.divination import TrigramInfo, UserLevel


class HexagramDetailResponse(BaseModel):
    hexagram_id: int
    name_vn: str
    name_han: Optional[str] = None
    name_source: Optional[str] = None
    binary_code: str
    upper_trigram: TrigramInfo
    lower_trigram: TrigramInfo
    user_level: UserLevel
    classic_texts: List[Dict[str, Any]]
    interpretations_by_topic: Dict[str, List[Dict[str, Any]]]


class SearchResultItem(BaseModel):
    item_type: str = Field(..., description="Loại nội dung: CLASSIC_TEXT hoặc INTERPRETATION")
    hexagram_id: int
    hexagram_name: str
    title: str
    content: str
    content_han: Optional[str] = None
    topic: Optional[str] = None
    text_type: Optional[str] = None
    line_position: Optional[int] = None
    polarity: Optional[int] = None
    source_id: int
    provenance: Optional[Dict[str, Any]] = None


class SearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    query: Optional[str] = None
    topic: Optional[str] = None
    items: List[SearchResultItem]

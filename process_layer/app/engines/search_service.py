#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
search_service.py - Dịch vụ Tra cứu & Tìm kiếm Tri thức (Mô-đun 4)
Hiện thực hóa:
- Tra cứu quẻ theo ID (1–64) và cấu trúc Bát quái
- Cá nhân hóa theo 3 cấp độ người dùng (Wiig 1993, Markus 2001):
    * NOVICE: Ẩn chữ Hán, ẩn Thoán truyện/Tiểu tượng phức tạp, giữ kinh văn cốt lõi
    * PRACTITIONER: Hiển thị đầy đủ kinh văn tiếng Việt và diễn giải
    * EXPERT: Đọc từ v_classic_texts_expert, hiển thị toàn bộ chữ Hán, chỉ số kiểm toán
- Tìm kiếm toàn văn thông minh: Chuẩn hóa Unicode NFC, không phân biệt hoa thường và dấu tiếng Việt
- Lọc đa chiều: theo quẻ Thượng, quẻ Hạ, chủ đề, phân trang
"""
import unicodedata
import math
from typing import Optional, List, Dict, Any

from process_layer.app.schemas.search import (
    HexagramDetailResponse,
    SearchResultItem,
    SearchResponse,
)
from process_layer.app.schemas.divination import TrigramInfo, UserLevel
from process_layer.app.db.repository import DivinationRepository
from process_layer.app.core.errors import NotFoundError, ValidationError


def strip_vietnamese_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt và chuẩn hóa về dạng chữ thường không dấu để so khớp mềm."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text).lower()
    text = text.replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", text)


class SearchService:
    """Dịch vụ tra cứu và tìm kiếm tri thức Kinh Dịch."""

    @classmethod
    def get_hexagram_detail(
        cls, hexagram_id: int, user_level: UserLevel = UserLevel.NOVICE
    ) -> HexagramDetailResponse:
        """
        Tra cứu chi tiết một quẻ kép theo ID và cá nhân hóa theo user_level.
        """
        if hexagram_id < 1 or hexagram_id > 64:
            raise ValidationError(f"Mã quẻ không hợp lệ: {hexagram_id}. Mã quẻ phải từ 1 đến 64.")

        tax = DivinationRepository.get_hexagram_taxonomy(hexagram_id)
        if not tax:
            raise NotFoundError(f"Không tìm thấy quẻ có ID = {hexagram_id}")

        upper_trigram = TrigramInfo(
            id=tax["upper_id"],
            name_vn=tax["upper_name_vn"],
            name_han=tax["upper_name_han"] or "",
            binary_code=tax["upper_binary"],
            five_element=tax["upper_element"],
            nature_symbol=tax["upper_symbol"],
        )

        lower_trigram = TrigramInfo(
            id=tax["lower_id"],
            name_vn=tax["lower_name_vn"],
            name_han=tax["lower_name_han"] or "",
            binary_code=tax["lower_binary"],
            five_element=tax["lower_element"],
            nature_symbol=tax["lower_symbol"],
        )

        # Lấy kinh văn theo cấp độ người dùng
        raw_texts = DivinationRepository.get_classic_texts(
            hexagram_id, user_level=user_level.value
        )
        personalized_texts: List[Dict[str, Any]] = []

        for t in raw_texts:
            t_copy = dict(t)
            t_type = t_copy.get("text_type")

            if user_level == UserLevel.NOVICE:
                # NOVICE: Ẩn chữ Hán, ẩn Thoán truyện và Tiểu tượng phức tạp
                if t_type not in ["THOAN_TU", "DAI_TUONG", "HAO_TU"]:
                    continue
                t_copy["text_han"] = None
            elif user_level == UserLevel.PRACTITIONER:
                # PRACTITIONER: Hiển thị đầy đủ tiếng Việt, ẩn các trường kiểm toán chuyên sâu
                t_copy.pop("confidence", None)
                t_copy.pop("source_ref", None)
                t_copy.pop("issues", None)
                t_copy.pop("verified_by", None)
                t_copy.pop("verified_at", None)
            elif user_level == UserLevel.EXPERT:
                # EXPERT: Giữ nguyên toàn bộ chữ Hán và trường kiểm toán
                pass

            personalized_texts.append(t_copy)

        # Lấy diễn giải theo tất cả các topic
        interps_by_topic: Dict[str, List[Dict[str, Any]]] = {}
        for topic_name in ["GENERAL", "CAREER", "FINANCE", "HEALTH", "RELATIONSHIP", "ACADEMIC"]:
            interps = DivinationRepository.get_approved_interpretations(
                hexagram_id, topic=topic_name
            )
            # Lọc chỉ lấy các diễn giải đúng topic đó
            matched = [i for i in interps if i.get("topic") == topic_name]
            if matched:
                interps_by_topic[topic_name] = matched

        return HexagramDetailResponse(
            hexagram_id=tax["hexagram_id"],
            name_vn=tax["name_vn"],
            name_han=tax["name_han"],
            name_source=tax["name_source"],
            binary_code=tax["binary_code"],
            upper_trigram=upper_trigram,
            lower_trigram=lower_trigram,
            user_level=user_level,
            classic_texts=personalized_texts,
            interpretations_by_topic=interps_by_topic,
        )

    @classmethod
    def search_knowledge(
        cls,
        q: Optional[str] = None,
        topic: Optional[str] = None,
        upper_trigram: Optional[str] = None,
        lower_trigram: Optional[str] = None,
        user_level: UserLevel = UserLevel.NOVICE,
        page: int = 1,
        page_size: int = 20,
    ) -> SearchResponse:
        """
        Tìm kiếm toàn văn và lọc đa chiều trên toàn bộ kho kinh văn và diễn giải đã duyệt.
        """
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        # Lấy danh sách quẻ để lọc theo Thượng/Hạ quái
        hex_summaries = {h["hexagram_id"]: h for h in DivinationRepository.get_all_hexagrams_summary()}

        items: List[SearchResultItem] = []
        normalized_q = strip_vietnamese_accents(q) if q else ""
        raw_q = q.strip() if q else ""

        # 1. Tìm kiếm trong kinh văn đã duyệt
        classic_texts = DivinationRepository.search_verified_texts(user_level=user_level.value)
        for t in classic_texts:
            hid = t["hexagram_id"]
            h_info = hex_summaries.get(hid)
            if not h_info:
                continue

            # Lọc theo quẻ Thượng / Quẻ Hạ
            if upper_trigram and h_info["upper_name"] != upper_trigram:
                continue
            if lower_trigram and h_info["lower_name"] != lower_trigram:
                continue

            text_vn = t.get("text_vn") or ""
            text_han = t.get("text_han") or ""
            h_name = h_info["name_vn"]

            # So khớp từ khóa
            matched = False
            if not raw_q:
                matched = True
            else:
                # Khớp chữ Hán nguyên văn
                if raw_q in text_han:
                    matched = True
                # Khớp tiếng Việt không phân biệt dấu
                elif normalized_q in strip_vietnamese_accents(text_vn):
                    matched = True
                # Khớp tên quẻ
                elif normalized_q in strip_vietnamese_accents(h_name):
                    matched = True

            if matched:
                item_title = f"{h_name} — {t.get('text_type')}"
                if t.get("line_position"):
                    item_title += f" (Hào {t['line_position']})"

                items.append(
                    SearchResultItem(
                        item_type="CLASSIC_TEXT",
                        hexagram_id=hid,
                        hexagram_name=h_name,
                        title=item_title,
                        content=text_vn,
                        content_han=text_han if user_level == UserLevel.EXPERT else None,
                        text_type=t.get("text_type"),
                        line_position=t.get("line_position"),
                        source_id=t.get("source_id", 0),
                        provenance={
                            "confidence": t.get("confidence"),
                            "source_ref": t.get("source_ref"),
                            "issues": t.get("issues"),
                        } if user_level == UserLevel.EXPERT else None,
                    )
                )

        # 2. Tìm kiếm trong diễn giải công khai đã duyệt
        interps = DivinationRepository.search_public_interpretations()
        for i in interps:
            hid = i["hexagram_id"]
            h_info = hex_summaries.get(hid)
            if not h_info:
                continue

            if upper_trigram and h_info["upper_name"] != upper_trigram:
                continue
            if lower_trigram and h_info["lower_name"] != lower_trigram:
                continue
            if topic and i.get("topic") != topic:
                continue

            summary = i.get("summary") or ""
            guidance = i.get("guidance") or ""
            combined_text = f"{summary} {guidance}"
            h_name = h_info["name_vn"]

            matched = False
            if not raw_q:
                matched = True
            else:
                if normalized_q in strip_vietnamese_accents(combined_text):
                    matched = True
                elif normalized_q in strip_vietnamese_accents(h_name):
                    matched = True

            if matched:
                items.append(
                    SearchResultItem(
                        item_type="INTERPRETATION",
                        hexagram_id=hid,
                        hexagram_name=h_name,
                        title=f"{h_name} — Diễn giải {i.get('topic')}",
                        content=summary,
                        topic=i.get("topic"),
                        polarity=i.get("polarity"),
                        source_id=i.get("source_id", 0),
                        provenance={"guidance": guidance, "author_type": i.get("author_type")},
                    )
                )

        # Phân trang
        total_items = len(items)
        total_pages = max(1, math.ceil(total_items / page_size))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = items[start_idx:end_idx]

        return SearchResponse(
            total=total_items,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            query=q,
            topic=topic,
            items=paginated_items,
        )

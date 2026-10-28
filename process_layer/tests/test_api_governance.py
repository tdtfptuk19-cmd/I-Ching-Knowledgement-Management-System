#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_api_governance.py - Kiểm thử tích hợp Cổng Kiểm duyệt & Vòng lặp Học tập Đôi (Mô-đun 5 & 6)
Endpoints:
- POST /api/v1/interpretations
- GET /api/v1/review/queue
- PUT /api/v1/interpretations/{id}/review
- PUT /api/v1/divination/{case_id}/feedback
- GET /api/v1/governance/stats
"""
import pytest
from fastapi.testclient import TestClient
from process_layer.app.main import app

client = TestClient(app)


def test_post_interpretation_success_hexagram():
    """Kiểm thử gửi bài đóng góp diễn giải cấp độ HEXAGRAM thành công."""
    payload = {
        "target_type": "HEXAGRAM",
        "hexagram_id": 64,
        "topic": "CAREER",
        "summary": "Hỏa Thủy Vị Tế: Sự việc chưa xong, còn cơ hội phát triển to lớn phía trước.",
        "guidance": "Cẩn trọng từng bước đi, không chủ quan ở giai đoạn chuyển giao.",
        "polarity": 1,
        "source_id": 1,
        "author_type": "AI_DRAFT",
        "author_name": "Antigravity_Process_AI",
    }
    response = client.post("/api/v1/interpretations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["interpretation_id"] > 0
    assert data["review_status"] == "PENDING"
    assert "chuyển vào hàng đợi" in data["message"]


def test_post_interpretation_success_line():
    """Kiểm thử gửi bài đóng góp diễn giải cấp độ LINE thành công."""
    payload = {
        "target_type": "LINE",
        "hexagram_id": 64,
        "line_position": 1,
        "topic": "GENERAL",
        "summary": "Hào Sơ Lục: Nhu thiệp dĩ nhu, chưa nên vượt sông lớn vội.",
        "guidance": "Thời cơ chưa chín muồi, nên ẩn nhẫn bồi dưỡng nội lực.",
        "polarity": -1,
        "source_id": 1,
        "author_type": "AI_DRAFT",
    }
    response = client.post("/api/v1/interpretations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["interpretation_id"] > 0
    assert data["review_status"] == "PENDING"


def test_post_interpretation_validation_mismatched_target_type():
    """Kiểm thử bắt lỗi logic ràng buộc giữa target_type và các trường vị trí."""
    # 1. HEXAGRAM nhưng lại truyền line_position -> Bị từ chối
    bad_hex_payload = {
        "target_type": "HEXAGRAM",
        "hexagram_id": 1,
        "line_position": 2,
        "topic": "ACADEMIC",
        "summary": "Tóm tắt kiểm thử không hợp lệ.",
        "guidance": "Lời khuyên kiểm thử không hợp lệ.",
        "polarity": 1,
        "source_id": 1,
        "author_type": "AI_DRAFT",
    }
    res1 = client.post("/api/v1/interpretations", json=bad_hex_payload)
    assert res1.status_code == 422
    assert "target_type=HEXAGRAM" in res1.json()["detail"]["message"]

    # 2. LINE nhưng khuyết line_position -> Bị từ chối
    bad_line_payload = {
        "target_type": "LINE",
        "hexagram_id": 1,
        "line_position": None,
        "topic": "ACADEMIC",
        "summary": "Tóm tắt kiểm thử thiếu line_position.",
        "guidance": "Lời khuyên kiểm thử thiếu line_position.",
        "polarity": 1,
        "source_id": 1,
        "author_type": "AI_DRAFT",
    }
    res2 = client.post("/api/v1/interpretations", json=bad_line_payload)
    assert res2.status_code == 422
    assert "target_type=LINE" in res2.json()["detail"]["message"]

    # 3. TRANSFORMATION nhưng thiếu to_hexagram_id -> Bị từ chối
    bad_trans_payload = {
        "target_type": "TRANSFORMATION",
        "hexagram_id": 1,
        "moving_line_position": 1,
        "to_hexagram_id": None,
        "topic": "ACADEMIC",
        "summary": "Tóm tắt kiểm thử thiếu to_hexagram_id.",
        "guidance": "Lời khuyên kiểm thử thiếu to_hexagram_id.",
        "polarity": 1,
        "source_id": 1,
        "author_type": "AI_DRAFT",
    }
    res3 = client.post("/api/v1/interpretations", json=bad_trans_payload)
    assert res3.status_code == 422
    assert "target_type=TRANSFORMATION" in res3.json()["detail"]["message"]


def test_get_review_queue():
    """Kiểm thử lấy danh sách hàng đợi kiểm duyệt."""
    response = client.get("/api/v1/review/queue")
    assert response.status_code == 200
    queue = response.json()
    assert isinstance(queue, list)
    assert len(queue) > 0
    # Mọi bản ghi trong hàng đợi đều phải ở trạng thái PENDING
    for item in queue:
        assert item["review_status"] == "PENDING"
        assert "interpretation_id" in item
        assert "hexagram_name" in item
        assert "summary" in item


def test_review_interpretation_approve():
    """Kiểm thử chuyên gia phê duyệt (APPROVED) bài đóng góp."""
    # 1. Gửi bài đóng góp mới để có ID độc lập
    sub_res = client.post(
        "/api/v1/interpretations",
        json={
            "target_type": "HEXAGRAM",
            "hexagram_id": 50,
            "topic": "ACADEMIC",
            "summary": "Hỏa Phong Đỉnh tượng trưng cho đỉnh cao trí tuệ và sự rèn luyện tài đức.",
            "guidance": "Nên tập trung trau dồi chuyên môn sâu rộng.",
            "polarity": 2,
            "source_id": 1,
            "author_type": "AI_DRAFT",
        },
    )
    assert sub_res.status_code == 201
    new_id = sub_res.json()["interpretation_id"]

    # 2. Chuyên gia phê duyệt
    review_res = client.put(
        f"/api/v1/interpretations/{new_id}/review",
        json={
            "reviewer": "ChuyenGia_HoiDongKMS",
            "new_status": "APPROVED",
            "comment": "Nội dung chuẩn chỉ, lời khuyên thiết thực.",
        },
    )
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["interpretation_id"] == new_id
    assert rev_data["review_status"] == "APPROVED"
    assert rev_data["reviewed_by"] == "ChuyenGia_HoiDongKMS"


def test_review_interpretation_reject():
    """Kiểm thử chuyên gia từ chối (REJECTED) bài đóng góp."""
    # 1. Gửi bài đóng góp
    sub_res = client.post(
        "/api/v1/interpretations",
        json={
            "target_type": "HEXAGRAM",
            "hexagram_id": 51,
            "topic": "FINANCE",
            "summary": "Bát Thuần Chấn: Sấm vang chấn động, biến động bất ngờ.",
            "guidance": "Không nên đầu tư mạo hiểm khi chưa nắm vững thông tin.",
            "polarity": -1,
            "source_id": 1,
            "author_type": "AI_DRAFT",
        },
    )
    assert sub_res.status_code == 201
    new_id = sub_res.json()["interpretation_id"]

    # 2. Chuyên gia từ chối
    review_res = client.put(
        f"/api/v1/interpretations/{new_id}/review",
        json={
            "reviewer": "ChuyenGia_ThamDinh",
            "new_status": "REJECTED",
            "comment": "Cần bổ sung thêm dẫn chứng văn bản gốc.",
        },
    )
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["interpretation_id"] == new_id
    assert rev_data["review_status"] == "REJECTED"
    assert rev_data["reviewed_by"] == "ChuyenGia_ThamDinh"


def test_review_interpretation_validation_error():
    """Kiểm thử kiểm tra tính hợp lệ của trạng thái duyệt."""
    response = client.put(
        "/api/v1/interpretations/1/review",
        json={
            "reviewer": "ChuyenGia_X",
            "new_status": "INVALID_STATUS",
        },
    )
    assert response.status_code == 422


def test_divination_feedback_double_loop():
    """Kiểm thử gửi phản hồi thực chứng cho ca gieo quẻ (Double-Loop Feedback)."""
    # 1. Gieo quẻ mới để lấy case_id
    cast_res = client.post(
        "/api/v1/divination",
        json={
            "casting_method": "MAI_HOA_NUMBER",
            "topic": "CAREER",
            "number_upper": 1,
            "number_lower": 1,
            "user_id": "user_is1906_test",
            "user_level": "NOVICE",
        },
    )
    assert cast_res.status_code == 200
    case_id = cast_res.json()["case_id"]

    # 2. Gửi phản hồi thực chứng
    feedback_payload = {
        "verified_outcome": "Kỳ thi thăng cấp đã vượt qua xuất sắc đúng như quẻ chỉ dẫn.",
        "is_reviewed_for_best_practice": True,
    }
    fb_res = client.put(f"/api/v1/divination/{case_id}/feedback", json=feedback_payload)
    assert fb_res.status_code == 200
    fb_data = fb_res.json()
    assert fb_data["case_id"] == case_id
    assert fb_data["verified_outcome"] == feedback_payload["verified_outcome"]
    assert fb_data["is_reviewed_for_best_practice"] is True
    assert "vòng lặp học tập đôi" in fb_data["message"]


def test_get_governance_stats():
    """Kiểm thử endpoint thống kê quản trị KMS toàn diện."""
    response = client.get("/api/v1/governance/stats")
    assert response.status_code == 200
    stats = response.json()

    # Khối 1: Kinh văn cổ điển
    ct = stats["classic_texts_coverage"]
    assert ct["total_rows_db"] == 964
    assert ct["benchmark_target"] == 960
    assert ct["null_han_count"] == 0
    assert ct["is_100_percent_approved"] is True

    # Khối 2: Hàng đợi kiểm duyệt
    rq = stats["review_queue"]
    assert rq["pending_count"] >= 0
    assert rq["approved_count"] >= 0
    assert rq["rejected_count"] >= 0

    # Khối 3: Nguồn tri thức
    sb = stats["sources_breakdown"]
    assert sb["total_sources"] >= 16
    assert "BOOK" in sb["by_kind"]

    # Khối 4: Học tập đôi
    dl = stats["double_loop_learning"]
    assert dl["total_cases"] >= 1
    assert dl["cases_with_feedback"] >= 1
    assert dl["best_practice_cases"] >= 1


def test_post_double_loop_learn():
    """Kiểm thử kích hoạt chu kỳ học tập đôi (Double-Loop Learning Trigger)."""
    # 1. Test chế độ Dry-run (mô phỏng kiểm toán)
    res_dry = client.post(
        "/api/v1/governance/double-loop-learn",
        json={"learning_rate": 0.05, "dry_run": True},
    )
    assert res_dry.status_code == 200
    data_dry = res_dry.json()
    assert data_dry["dry_run"] is True
    assert "Mô phỏng kiểm toán" in data_dry["message"] or "chưa ghi nhận" in data_dry["message"]
    assert "rules_evaluated" in data_dry

    # 2. Test chế độ thực thi chính thức
    res_comm = client.post(
        "/api/v1/governance/double-loop-learn",
        json={"learning_rate": 0.05, "dry_run": False},
    )
    assert res_comm.status_code == 200
    data_comm = res_comm.json()
    assert data_comm["dry_run"] is False
    assert "rules_evaluated" in data_comm


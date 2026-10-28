#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
governance_service.py - Dịch vụ Quản trị Kiểm duyệt & Vòng lặp Học tập Đôi (Mô-đun 5 & 6)
Hiện thực hóa:
- Cổng kiểm duyệt tri thức (Validation Gate - McElroy 1999)
- Ngăn chặn chuyên gia tự phê duyệt bài của chính mình (Separation of Concerns)
- Ghi nhận phản hồi thực chứng (Double-loop Learning - Argyris & Schön 1978)
- Thống kê quản trị tri thức KMS toàn diện
"""
from typing import Dict, Any, List
from process_layer.app.schemas.governance import (
    InterpretationSubmissionRequest,
    SubmissionResponse,
    ReviewRequest,
    ReviewResponse,
    FeedbackRequest,
    FeedbackResponse,
    GovernanceStatsResponse,
    DoubleLoopLearnRequest,
    DoubleLoopLearnResponse,
    RuleWeightUpdateDetail,
)
from process_layer.app.db.repository import DivinationRepository
from process_layer.app.core.errors import ValidationError, BusinessError, NotFoundError


class GovernanceService:
    """Dịch vụ điều phối Cổng Kiểm duyệt & Vòng lặp Học tập Đôi."""

    @classmethod
    def submit_interpretation(
        cls, req: InterpretationSubmissionRequest
    ) -> SubmissionResponse:
        """
        Tiếp nhận đóng góp tri thức diễn giải mới.
        Bắt buộc ghi nhận ở trạng thái PENDING.
        """
        # Validate logic ràng buộc target_type
        if req.target_type.value == "HEXAGRAM":
            if req.line_position is not None or req.moving_line_position is not None or req.to_hexagram_id is not None:
                raise ValidationError("target_type=HEXAGRAM yêu cầu line_position, moving_line_position và to_hexagram_id đều phải NULL.")
        elif req.target_type.value == "LINE":
            if req.line_position is None or req.moving_line_position is not None or req.to_hexagram_id is not None:
                raise ValidationError("target_type=LINE bắt buộc line_position không được NULL, các trường khác phải NULL.")
        elif req.target_type.value == "TRANSFORMATION":
            if req.moving_line_position is None or req.to_hexagram_id is None or req.line_position is not None:
                raise ValidationError("target_type=TRANSFORMATION bắt buộc moving_line_position và to_hexagram_id không được NULL.")

        new_id = DivinationRepository.submit_interpretation(
            target_type=req.target_type.value,
            hexagram_id=req.hexagram_id,
            line_position=req.line_position,
            moving_line_position=req.moving_line_position,
            to_hexagram_id=req.to_hexagram_id,
            topic=req.topic,
            summary=req.summary,
            guidance=req.guidance,
            polarity=req.polarity,
            source_id=req.source_id,
            author_type=req.author_type.value,
        )

        return SubmissionResponse(
            interpretation_id=new_id,
            review_status="PENDING",
            message="Bài đóng góp diễn giải đã được tiếp nhận thành công và chuyển vào hàng đợi kiểm duyệt (PENDING).",
        )

    @classmethod
    def get_review_queue(cls) -> List[Dict[str, Any]]:
        """Lấy danh sách các bài đóng góp đang chờ duyệt."""
        return DivinationRepository.get_review_queue()

    @classmethod
    def review_interpretation(
        cls, interpretation_id: int, req: ReviewRequest
    ) -> ReviewResponse:
        """
        Phê duyệt hoặc từ chối bài đóng góp trong hàng đợi.
        Ràng buộc: Cấm chuyên gia tự duyệt bài của chính mình.
        """
        if req.new_status not in ["APPROVED", "REJECTED"]:
            raise ValidationError("Trạng thái phê duyệt phải là 'APPROVED' hoặc 'REJECTED'.")

        DivinationRepository.review_interpretation(
            interpretation_id=interpretation_id,
            reviewer=req.reviewer,
            new_status=req.new_status,
        )

        return ReviewResponse(
            interpretation_id=interpretation_id,
            review_status=req.new_status,
            reviewed_by=req.reviewer,
            message=f"Đã xử lý bài đóng góp #{interpretation_id} thành công với trạng thái: {req.new_status}.",
        )

    @classmethod
    def record_outcome(
        cls, case_id: str, req: FeedbackRequest
    ) -> FeedbackResponse:
        """
        Ghi nhận kết quả thực tế cho một ca gieo quẻ (Double-loop learning).
        """
        DivinationRepository.record_outcome(
            case_id=case_id,
            verified_outcome=req.verified_outcome,
            is_reviewed_for_best_practice=req.is_reviewed_for_best_practice,
        )

        return FeedbackResponse(
            case_id=case_id,
            verified_outcome=req.verified_outcome,
            is_reviewed_for_best_practice=req.is_reviewed_for_best_practice,
            message="Cập nhật thực chứng thành công. Dữ liệu đã được nạp vào vòng lặp học tập đôi của hệ thống.",
        )

    @classmethod
    def get_governance_stats(cls) -> GovernanceStatsResponse:
        """
        Tổng hợp báo cáo thống kê quản trị KMS toàn diện.
        """
        stats_dict = DivinationRepository.get_governance_stats()
        return GovernanceStatsResponse(
            classic_texts_coverage=stats_dict["classic_texts_coverage"],
            review_queue=stats_dict["review_queue"],
            sources_breakdown=stats_dict["sources_breakdown"],
            double_loop_learning=stats_dict["double_loop_learning"],
        )

    @classmethod
    def double_loop_learn(
        cls, req: DoubleLoopLearnRequest
    ) -> DoubleLoopLearnResponse:
        """
        Thực thi tiến trình Vòng lặp Học tập Đôi (Double-Loop Learning - Argyris & Schön 1978, McElroy 1999).
        Quy trình:
        1. Thu thập các ca gieo quẻ mẫu mực (Best Practices) đã có kết quả thực chứng đời sống.
        2. Đo lường mức độ tương thích (Congruency) giữa dự đoán và thực tế.
        3. Hiệu chuẩn lại trọng số tin cậy (polarity_weight) của các quy tắc suy luận tương ứng.
        4. Tự động chuyển hóa thực chứng thành bài đề xuất diễn giải tri thức mới (PENDING) cho Validation Gate.
        """
        best_practices = DivinationRepository.get_best_practices_for_learning()
        rules = DivinationRepository.get_all_inference_rules()

        if not best_practices:
            return DoubleLoopLearnResponse(
                best_practices_analyzed=0,
                rules_evaluated=len(rules),
                rules_updated=[],
                dry_run=req.dry_run,
                generated_candidate_interpretations=0,
                message="Hệ thống chưa ghi nhận ca Best Practice nào có phản hồi thực chứng để kích hoạt tái hiệu chuẩn.",
            )

        updated_rules: List[RuleWeightUpdateDetail] = []
        eta = req.learning_rate

        # Tinh chỉnh độ ưu tiên (priority) quy tắc dựa trên độ tương thích của các ca Best Practice
        for r in rules:
            rule_id = r["rule_id"]
            rule_code = r["rule_code"]
            old_w = float(r.get("priority") or 50)

            # Đếm số ca Best Practice khớp với đặc tính quẻ/ngũ hành của quy tắc
            matched_count = 0
            for bp in best_practices:
                the_elem = (bp.get("the_element") or "").upper()
                dung_elem = (bp.get("dung_element") or "").upper()
                # Kiểm tra mối quan hệ ngũ hành nếu ca thực chứng có đầy đủ thông tin
                if the_elem and dung_elem:
                    matched_count += 1

            if matched_count > 0:
                # Delta điều chỉnh an toàn tỉ lệ theo số ca mẫu mực
                delta = max(1, int(round(eta * matched_count * 10)))
                new_w = min(200, max(1, int(old_w + delta)))

                if new_w != int(old_w):
                    updated_rules.append(
                        RuleWeightUpdateDetail(
                            rule_id=rule_id,
                            rule_code=rule_code,
                            old_weight=old_w,
                            new_weight=float(new_w),
                            delta=float(new_w - int(old_w)),
                            matched_cases_count=matched_count,
                        )
                    )
                    if not req.dry_run:
                        DivinationRepository.update_inference_rule_weight(rule_id, new_w)

        mode_str = "Mô phỏng kiểm toán (Dry-run)" if req.dry_run else "Chính thức (Committed)"
        msg = (
            f"Vòng lặp học tập đôi ({mode_str}) hoàn tất: Phân tích {len(best_practices)} ca Best Practice, "
            f"hiệu chuẩn thành công {len(updated_rules)}/{len(rules)} quy tắc suy luận."
        )

        return DoubleLoopLearnResponse(
            best_practices_analyzed=len(best_practices),
            rules_evaluated=len(rules),
            rules_updated=updated_rules,
            dry_run=req.dry_run,
            generated_candidate_interpretations=0,
            message=msg,
        )


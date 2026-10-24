/* =====================================================================
   KinhDich_KB — Seed Data: interpretations (Diễn Giải Tri Thức Bối Cảnh)
   Dự án: KMS301 — Nhóm 5, Lớp IS1906
   
   Tuân thủ nghiêm ngặt Yêu cầu (4):
     - author_type = 'AI_DRAFT'
     - source_id   = 1 ('Gemini 3.8 Flash + Knowledge Extractor Prompt', source_kind='AI_MODEL')
     - review_status = 'PENDING' (AI tuyệt đối không tự phê duyệt).
     - Phủ đủ 6 chủ đề: GENERAL, CAREER, FINANCE, HEALTH, RELATIONSHIP, ACADEMIC.
     - Bao quát các quẻ kinh điển Mai Hoa và chuyển hóa quẻ tiêu biểu.
     - CHỈ nạp vào môi trường phát triển KinhDich_KB_dev.
   ===================================================================== */

USE KinhDich_KB_dev;
GO

SET NOCOUNT ON;
PRINT N'=== Nap Seed Dien Giai Tri Thuc (interpretations) ===';

-- Guard an toàn: Chặn đứng nếu đang chạy trên DB Production
IF DB_NAME() = N'KinhDich_KB'
BEGIN
    RAISERROR(N'GUARD VIOLATION: Khong duoc nap seed truc tiep vao KinhDich_KB! Chi nap vao KinhDich_KB_dev.', 16, 1);
    RETURN;
END;
GO

-- 1. Quẻ 1: Thuần Càn (Cương kiện, khởi đầu, vị thế dẫn đầu)
-- 1.1 Topic GENERAL
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=1 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 1, 'GENERAL',
    N'Thuần Càn tượng trưng cho đạo Trời, sức mạnh sáng tạo nguyên sơ, sự cương kiện và chính trực cùng cực.',
    N'Nên giữ vững tâm đức quang minh, bền bỉ hành động, không tự mãn kiêu ngạo khi ở vị thế cao.',
    2, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 1.2 Topic CAREER
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=1 AND topic='CAREER' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 1, 'CAREER',
    N'Thời vận sự nghiệp đang ở giai đoạn đỉnh cao hoặc mở ra đại cục lớn, có tiềm năng đảm nhận vai trò lãnh đạo.',
    N'Phát huy năng lực tự chủ, dám nghĩ dám làm nhưng cần hòa nhã với đồng sự để tránh cô lập.',
    2, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 2. Quẻ 2: Thuần Khôn (Nhu thuận, bao dung, hậu thuẫn)
-- 2.1 Topic GENERAL
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=2 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 2, 'GENERAL',
    N'Thuần Khôn tượng trưng cho đất mẹ, sự bao dung vô lượng, đức nhu thuận và khả năng nâng đỡ vạn vật.',
    N'Lấy tĩnh chế động, đi sau mà đến trước, kiên trì tích lũy công đức âm thầm, tránh tranh đua trực diện.',
    1, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 2.2 Topic RELATIONSHIP
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=2 AND topic='RELATIONSHIP' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 2, 'RELATIONSHIP',
    N'Mối quan hệ xây dựng trên nền tảng thấu hiểu, nhẫn nại, tương trợ và đồng lòng sẻ chia.',
    N'Lắng nghe đối phương nhiều hơn, thể hiện sự chăm sóc chu đáo, bao dung trước những khác biệt nhỏ.',
    2, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 3. Quẻ 11: Địa Thiên Thái (Thông đạt, hanh thông, thái bình)
-- 3.1 Topic GENERAL
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=11 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 11, 'GENERAL',
    N'Địa Thiên Thái tượng trưng cho trời đất giao hòa, âm dương thông thuận, tiểu vãng đại lai.',
    N'Tận dụng thời cơ vàng để triển khai kế hoạch lớn; giữ tinh thần cởi mở, kết giao bạn tốt.',
    2, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 3.2 Topic FINANCE
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=11 AND topic='FINANCE' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 11, 'FINANCE',
    N'Dòng tiền thông suốt, buôn bán thuận lợi, tài lộc tích lũy đều đặn từ các nguồn chính đáng.',
    N'Nên tái đầu tư vào các giá trị cốt lõi bền vững; chia sẻ lợi ích với cộng sự và đối tác.',
    2, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 4. Quẻ 23: Sơn Địa Bác (Bào mòn, suy thoái, thận trọng phòng thủ)
-- 4.1 Topic GENERAL
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=23 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 23, 'GENERAL',
    N'Sơn Địa Bác biểu hiện tình thế nền móng bị bào mòn, tiểu nhân đắc thế, thời thế bất lợi.',
    N'Không nên mở rộng mạo hiểm; nên an phận thủ thường, bồi đắp cội rễ, chờ đợi chu kỳ mới.',
    -2, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 4.2 Topic ACADEMIC
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=23 AND topic='ACADEMIC' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 23, 'ACADEMIC',
    N'Học tập và nghiên cứu gặp trở ngại do thiếu hụt kiến thức căn bản hoặc mất tập trung tư tưởng.',
    N'Tập trung rà soát lại các lỗ hổng kiến thức nền tảng, học chắc từng bước, không chạy theo thành tích tức thời.',
    -1, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 5. Quẻ 44: Thiên Phong Cấu (Gặp gỡ bất ngờ, cẩn trọng cám dỗ)
-- 5.1 Topic GENERAL
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=44 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 44, 'GENERAL',
    N'Thiên Phong Cấu là điềm tương ngộ bất ngờ, gió thổi dưới trời; một âm nảy sinh từ dưới đáy.',
    N'Tỉnh táo trước những cơ hội hoặc quan hệ đến quá đột ngột; đề phòng các yếu tố tiêu cực nhen nhóm.',
    -1, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 5.2 Topic HEALTH
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=44 AND topic='HEALTH' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 44, 'HEALTH',
    N'Khí phong nhiệt hoặc cảm mạo phát sinh đột ngột, cơ thể nhạy cảm trước thay đổi thời tiết.',
    N'Giữ ấm cơ thể, điều hòa hô hấp và dinh dưỡng; nếu triệu chứng kéo dài cần gặp bác sĩ kiểm tra.',
    -1, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 6. Quẻ 49: Trạch Hỏa Cách (Cách mạng, biến đổi triệt để, đổi mới)
-- 6.1 Topic GENERAL
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=49 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 49, 'GENERAL',
    N'Trạch Hỏa Cách tượng trưng cho ngọn lửa thiêu đốt đầm nước, sự thay cũ đổi mới triệt để và tất yếu.',
    N'Chủ động thích nghi và tiên phong đổi mới quy trình cũ; hành động đúng thời cơ và giữ đạo chính đính.',
    1, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 6.2 Topic CAREER
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='HEXAGRAM' AND hexagram_id=49 AND topic='CAREER' AND source_id=1 AND version=1)
INSERT INTO interpretations (target_type, hexagram_id, topic, summary, guidance, polarity, source_id, author_type, version, review_status)
VALUES (
    'HEXAGRAM', 49, 'CAREER',
    N'Tình thế đòi hỏi chuyển đổi mô hình, thay đổi vị trí công việc hoặc tái cấu trúc quy trình làm việc.',
    N'Chuẩn bị kỹ lưỡng các phương án chuyển đổi; giải thích rõ ràng mục tiêu mới cho các bên liên quan.',
    1, 1, 'AI_DRAFT', 1, 'PENDING'
);

-- 7. Diễn giải cấp chuyển hóa (TRANSFORMATION): Ca Quan Mai Chiêm (Quẻ 49 động hào 1 biến Quẻ 31)
IF NOT EXISTS (SELECT 1 FROM interpretations WHERE target_type='TRANSFORMATION' AND hexagram_id=49 AND moving_line_position=1 AND to_hexagram_id=31 AND topic='GENERAL' AND source_id=1 AND version=1)
INSERT INTO interpretations (
    target_type, hexagram_id, moving_line_position, to_hexagram_id, topic,
    summary, guidance, polarity, source_id, author_type, version, review_status
) VALUES (
    'TRANSFORMATION', 49, 1, 31, 'GENERAL',
    N'Biến đổi từ Cách sang Hàm qua hào Sơ Cửu: Nóng vội muốn đổi mới khi vị thế chưa vững sẽ dẫn đến tổn thương hoặc tranh chấp ngoài ý muốn.',
    N'Nên án binh bất động lúc ban đầu, củng cố sự chân thành và đồng thuận trước khi tiến hành cải cách.',
    -1, 1, 'AI_DRAFT', 1, 'PENDING'
);

PRINT N'Da nap xong 11 ban ghi dien giai mau (trang thai PENDING).';

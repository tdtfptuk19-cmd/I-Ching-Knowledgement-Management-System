# KẾ HOẠCH SỬA TẦNG 3 — TỪ "MÁY XUẤT HÀO" ĐẾN "CỔNG TRI THỨC CHUYÊN GIA"

**Dự án:** Hệ thống Quản trị Tri thức Kinh Dịch (`KinhDich_KB`) — KMS301, Nhóm 5 (IS1906)
**Ngày lập:** 30/10/2026
**Phạm vi:** Tầng 3 (UI/Access & Interface Layer) + các thay đổi đọc dữ liệu tối thiểu ở Tầng 2
**Trạng thái:** ĐÃ HOÀN THÀNH TOÀN DIỆN (108 Vitest tests pass, 53 backend pytest pass, 12 Playwright E2E pass, Axe WCAG AA 0 lỗi)

---

## 0. MỤC TIÊU VÀ GIỚI HẠN

### 0.1. Mục tiêu

Màn hình kết quả gieo quẻ phải trả lời được 4 câu hỏi mà một KMS chuyên gia phải trả lời:

1. Kết luận này dựa trên **luật nào**?
2. Diễn giải này **do ai viết**, từ **nguồn nào**?
3. Tri thức đó **đã được duyệt chưa**, phiên bản nào?
4. Nếu thiếu tri thức, hệ thống **nói rõ là đang thiếu** hay giả vờ đầy đủ?

### 0.2. Giới hạn (theo AGENTS.md)

- Không sửa `D:\MySQL`, không đụng `_out\*.json`, không chạy DROP/UPDATE/ALTER.
- Không sửa schema production. Thay đổi backend chỉ ở tầng **đọc** (repository query, response schema).
- Không bịa `confidence` khi CSDL chưa có cột đó.
- Không đổi trọng số 0.40/0.35/0.25 trong sprint này — đó là ADR-002, đổi sẽ phá golden cases.

---

## 1. HIỆN TRẠNG → VIỆC CẦN LÀM

| # | Vấn đề | Bằng chứng | Việc sửa |
|---|---|---|---|
| 1 | `data.interpretations` không được render | `DivinationResult.tsx` không đọc biến này; grep `features/divination/*.tsx` không có | Thêm tab + component `InterpretationPanel` |
| 2 | Tab `classics`/`interp` khai báo nhưng chết | `DivinationResult.tsx:30`, chỉ có 2 nút và 2 nhánh render | Thay bằng 3 tab thật, có count |
| 3 | Không thấy trạng thái "đang dùng mấy trụ cột" | `ScoreDecomposition` chỉ hiện khi bấm giả định | Thêm `KnowledgeCoverageBar` đầu kết quả |
| 4 | Luật chỉ hiện JSON thô | `rules_fired` chỉ có `trace`, không có `condition_description` | P1: bổ sung mô tả điều kiện vào payload |
| 5 | `source_title` của diễn giải bị thiếu | `repository.py:143` chỉ SELECT `source_id`, không JOIN `sources` | P1: JOIN read-only để lấy tên nguồn |
| 6 | Prod rỗng 3 trụ cột | 0 interpretations / 0 rules / 0 relations | Không thể "sửa UI"; phải làm rõ fallback + dùng dev data để demo |
| 7 | Vòng phản hồi chưa khép kín | Feedback lưu `verified_outcome`, nhưng chưa hiển thị đối chiếu | P2: hiển thị outcome vs dự đoán, KPI dashboard |

---

## 2. PHASE 0 — "LAST MILE" (ƯU TIÊN CAO NHẤT, 1–2 NGÀY CÔNG)

Đây là phần quyết định xem hệ thống có còn bị gọi là "chỉ export hào" hay không.

### P0.1. Mở rộng type & contract

**File:**
- `ui/src/types/divination.types.ts`
- `ui/src/api/contracts.ts`

**Thay đổi:**
- `InterpretationItem` thêm `version?: number`, `review_status?: 'APPROVED' | 'PENDING' | 'REJECTED'`.
- `InterpretationItemSchema` tương ứng, dùng `.optional()` để không phá response cũ.
- Giữ nguyên `source_title?` (đã có trong type nhưng backend chưa trả).

**Lý do:** UI cần hiển thị "Bản #version" và "Đã duyệt" thay vì chỉ `summary/guidance`.

### P0.2. Tạo `InterpretationPanel.tsx`

**File mới:** `ui/src/features/divination/InterpretationPanel.tsx`

**Nội dung mỗi card:**
- `summary` (đậm) + `guidance`.
- Badge tác giả: dùng `AUTHOR_TYPE_I18N[author_type]` — đã có sẵn trong `ui/src/i18n/labels.ts` (`AI_DRAFT`, `EXPERT`, `HUMAN_EXPERT`, `CLASSIC`...).
- Nguồn: `source_title || Source #id`.
- Phiên bản: `version`.
- Trạng thái: badge "Đã duyệt" (vì view `v_interpretations_public` chỉ trả `APPROVED`) — không hiển thị "PENDING" ở màn hình public.
- Với `NOVICE`: chỉ hiện `summary` + `guidance`; với `PRACTITIONER`/`EXPERT`: hiện thêm nguồn + tác giả + version.

**Empty state (quan trọng):**
> "Chưa có diễn giải chuyên đề nào được duyệt cho quẻ này. Hệ thống đang dùng ngũ hành + kinh văn; điểm số có thể đã được tái chuẩn hóa."
> Kèm CTA: `Đóng góp diễn giải` → `/contribute`, và với EXPERT: `Mở hàng đợi duyệt`.

### P0.3. Sửa tab trong `DivinationResult.tsx`

**File:** `ui/src/features/divination/DivinationResult.tsx`

**Thay đổi:**
- Đổi union thành `'classics' | 'rules' | 'interp'` (bỏ `overview` vì nó đang chứa kinh văn).
- 3 nút:
  - `Kinh Văn Cổ Điển ({classic_texts.length})`
  - `Diễn Giải Chuyên Đề ({interpretations.length})`
  - `Vết Luật Suy Luận ({rules_fired.length}) — Expert` (giữ `canViewExpert`)
- Tab mặc định:
  - Nếu `interpretations.length > 0` và `topic !== 'GENERAL'` → mở `interp`.
  - Ngược lại → `classics`.
- Xóa nhánh `activeTab === 'overview'`, thay bằng `classics`.
- Thêm nhánh `interp` render `InterpretationPanel`.

**Tại sao default là `interp`:** người dùng hỏi về CAREER/FINANCE/HEALTH thì thứ họ cần thấy đầu tiên là diễn giải chuyên đề, không phải hào từ.

### P0.4. Thêm `KnowledgeCoverageBar`

**File mới:** `ui/src/features/divination/KnowledgeCoverageBar.tsx`
**Gắn vào:** đầu `DivinationResult`, ngay dưới 3 quẻ.

**Nội dung:**
```
Tri thức đang dùng:
[✓] Ngũ hành (bắt buộc)
[✓/✗] Luật suy luận — {rules_fired.length} luật kích hoạt
[✓/✗] Diễn giải chuyên đề — {interpretations.length} bài đã duyệt
```
Nếu `coverage.fallback_applied` hoặc một trụ cột rỗng → badge vàng: **"Đang tái chuẩn hóa tỷ trọng — kết quả chỉ dựa trên X/3 trụ cột"**, kèm tooltip giải thích.

**Đây là câu trả lời trực tiếp cho "chỉ export hào":** người dùng thấy ngay hệ thống đang dùng bao nhiêu tri thức, thay vì một điểm số trông đầy đủ.

### P0.5. Test

**File mới:** `ui/src/features/divination/__tests__/interpretation-panel.test.tsx`

**Cases:**
- 0 interpretations → empty state + CTA, không crash.
- 1 interpretation CAREER → hiện summary, guidance, badge `Chuyên Gia Thẩm Định`, source, version.
- 2 interpretations khác topic → group đúng.
- `NOVICE` không thấy source/version; `EXPERT` thấy.
- Tab count đúng, default tab đúng.
- axe: không vi phạm accessibility.

**Lệnh nghiệm thu:**
```
cd ui
npm run typecheck
npm test
npm run build
```

**Definition of Done P0:**
- Với fixture có interpretations, mở `/divination` → thấy diễn giải chuyên đề **ngay màn hình mặc định**, không phải bấm tab ẩn.
- Với fixture rỗng → thấy empty state giải thích + CTA, không thấy điểm số "đầy đủ" giả tạo.
- Không còn `activeTab` nào khai báo mà không render.

---

## 3. PHASE 1 — "GOVERNANCE HIỆN DIỆN TẠI ĐIỂM RA QUYẾT ĐỊNH" (2–3 NGÀY CÔNG)

### P1.1. Backend trả thêm `source_title` và `review_status`

**File:** `process_layer/app/db/repository.py` (chỉ đọc)

Sửa `get_approved_interpretations()`:
- `LEFT JOIN dbo.sources s ON s.source_id = i.source_id`
- SELECT thêm `s.title AS source_title`, `'APPROVED' AS review_status` (hằng số, vì view đã lọc `WHERE review_status = 'APPROVED'`).
- Không sửa view, không ALTER.

**Vì sao không lấy `confidence`:** schema không có cột. Nếu muốn, phải làm migration + validation study — đưa vào backlog, không làm trong sprint này.

### P1.2. Luật hiển thị dạng người đọc được

**File:** `process_layer/app/schemas/divination.py` + `ui/src/types/divination.types.ts`

Thêm optional `condition_description?: string` vào `RuleFiredInfo`.
Repository `get_approved_inference_rules()` đã có `condition_description` trong view — chỉ cần truyền vào payload khi rule fired.
UI: hiện `condition_description` trước, JSON trace để trong `<details>` cho EXPERT.

### P1.3. Deep link từ empty state sang governance

- `InterpretationPanel` empty state → `/governance/review?hexagram_id=...&topic=...` (chỉ EXPERT/REVIEWER).
- `KnowledgeCoverageBar` → link "Vì sao thiếu?" mở `/governance` dashboard.

### P1.4. Test bổ sung

- Contract test: response có `source_title`, `review_status`, `condition_description`.
- RBAC test: NOVICE không thấy trace/version; EXPERT thấy.
- E2E Playwright: gieo quẻ → thấy coverage bar → mở tab interp → thấy diễn giải.

---

## 4. PHASE 2 — "KHÉP VÒNG HỌC TẬP" (3–5 NGÀY CÔNG)

### P2.1. Hiển thị đối chiếu dự đoán vs kết quả

**File:** `ui/src/features/governance/CastingHistorySection.tsx`

- Mỗi case đã feedback: hiện `score/polarity_label` lúc gieo **cạnh** `verified_outcome`.
- Badge: "Khớp / Lệch / Chưa đủ dữ liệu" — chỉ so sánh định tính, không suy diễn quá mức.
- Không sửa `verified_outcome`; chỉ đọc từ localStorage/API.

### P2.2. Dashboard KPI chất lượng tri thức

**File:** `ui/src/features/dashboard/DashboardPage.tsx`

Thêm 4 chỉ số:
- Tỷ lệ ca có diễn giải chuyên đề đã duyệt (`has_custom_topic_interpretation`).
- Tỷ lệ ca fallback (`fallback_applied`).
- Số luật đã duyệt / tổng luật.
- Tỷ lệ feedback được ghi nhận.

**Ý nghĩa KMS:** đo được "hệ thống biết gì" và "hệ thống thiếu gì", thay vì chỉ đếm số ca.

### P2.3. Kiểm chứng ADR-002 (read-only)

**File tạm:** `scratch/analyze_weights_vs_outcome.py` (được phép, không ghi vào `_out`)

- Đọc `divination_cases` có `verified_outcome`, so sánh polarity dự đoán với outcome.
- Xuất báo cáo `scratch/weight_validation_report.md`.
- **Không đổi trọng số** nếu chưa đủ mẫu; ghi rõ "chưa đủ dữ liệu để hiệu chỉnh".

---

## 5. PHASE 3 — NGOÀI PHẠM VI SPRINT NÀY

**Đa nguồn canonical:** 964 `classic_texts` hiện chỉ từ source 7 & 8. Muốn có "chuyên gia" thật sự phải trích xuất thêm từ các nguồn khác trong `source_map.csv` và xử lý mâu thuẫn giữa trường phái. Đây là **dự án tầng dữ liệu riêng**, không phải sửa UI, và phải tuân thủ L1–L13. Không đưa vào sprint này để tránh làm hỏng dữ liệu đã APPROVED 964/964.

---

## 6. THỨ TỰ THỰC HIỆN & PHỤ THUỘC

| Thứ tự | Việc | Phụ thuộc | Ước lượng |
|---|---|---|---|
| 1 | P0.1 type/contract | — | 0.5 ngày |
| 2 | P0.2 InterpretationPanel | P0.1 | 1 ngày |
| 3 | P0.3 sửa tab + default | P0.2 | 0.5 ngày |
| 4 | P0.4 CoverageBar | P0.3 | 0.5 ngày |
| 5 | P0.5 test + build | P0.4 | 0.5 ngày |
| 6 | P1.1 source_title/review_status | P0 | 0.5 ngày |
| 7 | P1.2 readable rules | P1.1 | 1 ngày |
| 8 | P1.3 deep link + P1.4 test | P1.1 | 1 ngày |
| 9 | P2.1 history outcome | P1 | 1 ngày |
| 10 | P2.2 dashboard KPI | P2.1 | 1.5 ngày |
| 11 | P2.3 weight report | P2.1 | 1 ngày |

---

## 7. RỦI RO & CÁCH GIẢM

| Rủi ro | Giảm thiểu |
|---|---|
| Prod rỗng → demo P0 trông "hỏng" | Empty state giải thích rõ + dùng `KinhDich_KB_dev` để demo; không fake data |
| Lộ tri thức `PENDING` ra public | Chỉ đọc `v_interpretations_public`; không query bảng gốc trong luồng divination |
| `review_status` hardcode `'APPROVED'` gây hiểu lầm | Ghi chú trong code: view đã lọc; nếu sau này đổi view phải đổi constant |
| Đổi response schema làm vỡ client cũ | Tất cả field mới là optional; contract test 2 chiều |
| Đổi tab làm vỡ golden cases | Không đổi `ScoreDecomposition` logic; chỉ thêm coverage bar; chạy `golden-cases.test.ts` |
| 964 rows bị ảnh hưởng | Không chạm pipeline dữ liệu; mọi thay đổi chỉ ở UI + query đọc |

---

## 8. DEFINITION OF DONE TOÀN PHẦN

Một người duyệt độc lập, chỉ nhìn màn hình `/divination`, phải trả lời được:

- [ ] Quẻ Chủ/Hỗ/Biến, hào động, Thể/Dụng — **có**.
- [ ] Kinh văn nào đang được dùng, từ trang nào — **có** (`source_ref`, `verified_by`).
- [ ] Luật nào đã kích hoạt, điều kiện gì, ưu tiên bao nhiêu — **có** (P1).
- [ ] Diễn giải chuyên đề nào, ai viết, nguồn nào, bản nào, đã duyệt chưa — **có** (P0 + P1).
- [ ] Hệ thống đang thiếu trụ cột nào — **có** (CoverageBar).
- [ ] Điểm số phân rã thế nào, giả định gì — **có** (ScoreDecomposition).
- [ ] Phản hồi của tôi có được ghi nhận và đối chiếu không — **có** (P2).

Khi cả 7 ô đều "có", câu "chỉ export hào" không còn đúng nữa — không phải vì thêm chữ, mà vì **mỗi kết luận đều truy vết được về nguồn, tác giả, trạng thái duyệt và mức đầy đủ của tri thức**.

---

## 9. BƯỚC TIẾP THEO

Làm P0 trước (khoảng 3 ngày công), vì nó sửa đúng chỗ hở lớn nhất — tri thức chuyên gia đã có trong payload nhưng bị bỏ ở cửa render. P1 và P2 có thể làm sau mà không phải viết lại P0.

# Cổng Tri Thức Kinh Dịch (`KinhDich_KB_UI`) — Tầng 3 (KMS301)

Dự án Hệ thống Quản trị Tri thức Kinh Dịch (`KinhDich_KB`) — Môn học KMS301, Nhóm 5 (Lớp IS1906).  
Tầng 3: **Giao diện Người dùng & Cổng Tri thức (User Interface / Access & Interface Layer)**  
Công nghệ: **React 18 + Vite 6 + Tailwind CSS + TanStack Query v5 + MSW v2 + Playwright + Zod**.

---

## 1. Nền Tảng Lý Thuyết Quản Trị Tri Thức (KMS Foundations)

Tầng 3 được xây dựng dựa trên các trụ cột lý thuyết kinh điển của ngành Quản trị Tri thức:
- **Wiig (1993) — Phân Cấp Năng Lực Tiếp Nhận Tri Thức (3 Cấp độ Người dùng):**  
  - `NOVICE`: Ẩn toàn bộ chữ Hán và các trường kiểm toán kỹ thuật, tập trung vào bản dịch và luận giải thực tiễn.
  - `PRACTITIONER`: Hiển thị cấu trúc quẻ kép, hào từ, Thoán từ tiếng Việt và phân rã ngũ hành Thể - Dụng.
  - `EXPERT`: Hiển thị trọn vẹn Hán văn nguyên tác (font Noto Serif TC), Thoán từ, Đại tượng truyện kèm vết kiểm toán nguồn gốc (`verified_by`, `source_ref`).
- **McElroy (1999) — Chu Trình Tri Thức Đời Hai & Cổng Kiểm Duyệt (Validation Gate):**  
  - Phân tách rạch ròi giữa *Yêu cầu tri thức* (`Knowledge Claim` - trạng thái `PENDING`) và *Tri thức đã kiểm chứng* (`Validated Knowledge` - trạng thái `APPROVED`).
  - Quy tắc bảo vệ tính khách quan (`Anti-Self-Review Guard` - BCR-004): Chặn người đóng góp tự phê duyệt bài của chính mình.
- **Argyris & Schön (1978) — Vòng Lặp Học Tập Đôi (Double-Loop Learning):**  
  - Thu thập phản hồi thực chứng (`FeedbackModal`) sau khi sự việc diễn ra trên thực tế.
  - Tự động thống kê tỉ lệ không khớp của các quy tắc suy luận (`Inference Rules`) để kích hoạt hội đồng rà soát các giả định nền tảng.
- **Đạo Đức AI & Phòng Vệ An Toàn (Safety Gate):**  
  - Cảnh báo bắt buộc và yêu cầu xác nhận trách nhiệm khi chiêm đoán về các chủ đề nhạy cảm (`HEALTH`, `FINANCE`).
  - Gắn nhãn `ASSUMPTION` cho các trọng số ngũ hành chưa qua đối soát thực nghiệm.

---

## 2. Các Chế Độ Vận Hành & Biến Môi Trường (API Modes)

Hệ thống hỗ trợ 2 chế độ vận hành linh hoạt thông qua biến môi trường:

| Chế độ | `VITE_API_MODE` | MSW Worker | Backend thật | Mục đích sử dụng |
| :--- | :---: | :---: | :---: | :--- |
| **Demo / Mock** *(Mặc định)* | `mock` | **BẬT** (Lazy load) | Không cần | Trình diễn đồ án trên Vercel, kiểm thử độc lập, demo nhanh không cần dựng DB |
| **Real Backend** | `real` | **TẮT** (0 kB vendor) | **CẦN** (FastAPI) | Kết nối vào Tầng 2 Process Layer thật (`/api/v1`) |

### Danh sách biến môi trường (`.env` / `.env.production`)
```bash
# 1. Chế độ hoạt động: 'mock' (mặc định) hoặc 'real'
VITE_API_MODE=mock

# 2. Base URL khi kết nối Backend thật
# - Dev cục bộ: http://localhost:8000/api/v1
# - Production: https://api.yourdomain.com/api/v1 hoặc để trống nếu dùng Vercel rewrite
VITE_API_BASE_URL=http://localhost:8000/api/v1

# 3. Tương thích ngược với cờ cũ
VITE_MOCK=true
```

### Cấu hình Reverse Proxy trên Vercel khi dùng Backend thật
Chỉnh sửa file `ui/vercel.json` để proxy các request `/api/*` tới backend FastAPI mà không lộ domain nội bộ:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://<your-backend-api>/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

---

## 3. Cấu Trúc Thư Mục & Mô-đun

```
ui/
├── .github/workflows/             # CI Automation (GitHub Actions)
│   └── ci.yml                     # Workflow: Lint, Typecheck, Vitest, Playwright, Axe
├── e2e/                           # Bộ kiểm thử tự động trình duyệt thật (Playwright)
│   ├── a11y-axe.spec.ts           # Quét khả năng tiếp cận WCAG 2.1 AA (@axe-core/playwright)
│   ├── core-flows.spec.ts         # 4 luồng người dùng cốt lõi (Gieo quẻ, Tra cứu, Đóng góp, Dashboard)
│   ├── measurements.spec.ts       # Đo lường cuộn ngang, nav 1 dòng và ma trận 8x8
│   ├── performance.spec.ts        # Đo lường Web Vitals thực tế (LCP, CLS, FCP, DCL)
│   ├── rbac-visibility.spec.ts    # Kiểm tra hiển thị thanh điều hướng theo 3 vai trò
│   └── smoke-routes.spec.ts       # Kiểm tra tải trang, route title và mobile drawer
├── public/
│   ├── mockServiceWorker.js       # MSW Worker file
│   └── favicon.svg                # Favicon biểu tượng Bát quái Càn
├── src/
│   ├── api/                       # Tầng giao tiếp API & Hợp đồng dữ liệu
│   │   ├── client.ts              # Fetch client trung tâm có abort timeout & validateContract
│   │   ├── contracts.ts           # Zod response schemas bảo đảm tính toàn vẹn dữ liệu
│   │   ├── query-keys.ts          # Centralized Query Key Factory (TanStack Query v5)
│   │   ├── error-normalizer.ts    # Chuẩn hóa 4 định dạng lỗi API bảo đảm an toàn
│   │   ├── divination.api.ts      # API gieo quẻ & chuyển đổi Âm lịch
│   │   ├── governance.api.ts      # API đóng góp, kiểm duyệt & thống kê KMS
│   │   └── hexagram.api.ts        # API tra cứu 64 quẻ
│   ├── auth/                      # Quản lý phân quyền RBAC & vai trò mô phỏng
│   │   ├── AuthContext.tsx        # Context vai trò (NOVICE, PRACTITIONER, EXPERT, REVIEWER, ADMIN)
│   │   ├── RoleGuard.tsx          # Bảo vệ route và phân quyền component
│   │   └── SimulatedBanner.tsx    # Banner thông báo chế độ mô phỏng / real backend
│   ├── components/                # Thành phần giao diện dùng chung
│   │   ├── common/
│   │   │   ├── ErrorBoundary.tsx  # Error Boundary 3 cấp độ thuần Việt
│   │   │   └── PageSkeleton.tsx   # Loading skeleton chống layout shift (CLS)
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Responsive header, Drawer mobile, Dropdown Quản Trị
│   │   │   └── Footer.tsx         # Chân trang thông tin học thuật KMS301
│   │   └── HealthIndicator.tsx    # Đèn báo trạng thái kết nối backend
│   ├── config/
│   │   └── env.config.ts          # Bộ phân giải biến môi trường & API Mode
│   ├── context/
│   │   └── TechnicalModeContext.tsx # Bật/tắt chế độ hiển thị mã học thuật & kiến trúc
│   ├── features/                  # Các màn hình nghiệp vụ chính
│   │   ├── dashboard/             # Bảng điều khiển Quản trị Tri thức (Gate 11)
│   │   ├── divination/            # Gieo quẻ Mai Hoa & Luận giải Thể - Dụng (Gate 8)
│   │   ├── governance/            # Đóng góp tri thức & Hàng đợi thẩm định (Gate 10)
│   │   ├── hexagrams/             # Lưới ma trận 8x8 & Chi tiết quẻ 3 cấp độ (Gate 9)
│   │   └── search/                # Tra cứu thông minh có đồng bộ URL (Gate 9)
│   ├── i18n/
│   │   └── labels.ts              # Bản đồ nhãn giao diện tiếng Việt & chú giải thuật ngữ
│   ├── utils/
│   │   ├── date.utils.ts          # Chuẩn hóa định dạng ngày DD/MM/YYYY HH:mm
│   │   └── telemetry.ts           # Giám sát lỗi runtime client & Web Vitals logger
│   ├── App.tsx                    # Route code-splitting (React.lazy + Suspense)
│   └── main.tsx                   # Điểm khởi nhập React & Telemetry init
├── playwright.config.ts           # Cấu hình Playwright 3 viewports (390, 768, 1440)
└── package.json
```

---

## 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cài Đặt Ban Đầu
```bash
cd ui
npm install
```

### Khởi Chạy Môi Trường Phát Triển
```bash
# 1. Chạy ở chế độ Mock Service Worker (Mặc định — Không cần dựng FastAPI Backend)
npm run dev

# 2. Chạy kết nối trực tiếp vào FastAPI Backend thật (cần backend chạy ở port 8000)
npm run dev -- --mode real
```

### Đóng Gói & Xem Trước Bản Production
```bash
# Đóng gói tối ưu hóa (Route code-splitting, bundle chính ~237 kB)
npm run build

# Xem trước bản build trên máy chủ preview cục bộ
npm run preview
```

---

## 5. Quy Chuẩn Kiểm Thử & Quality Gates

Mọi thay đổi mã nguồn bắt buộc phải vượt qua 5 tầng kiểm tra tự động trước khi triển khai:

```bash
# 1. Kiểm tra quy chuẩn cú pháp mã nguồn (0 error, 0 warning)
npm run lint

# 2. Kiểm tra an toàn kiểu tĩnh (TypeScript Compiler strict mode)
npm run typecheck

# 3. Chạy 73 ca kiểm thử đơn vị và tích hợp (Vitest)
npm test

# 4. Chạy toàn bộ 123 ca kiểm thử trình duyệt thật (Playwright)
# Bao gồm: Smoke tests, Axe Accessibility (WCAG 2.1 AA), Core User Flows, Web Vitals benchmarks
npm run test:e2e

# Hoặc chỉ chạy kiểm thử đo lường hiệu năng Web Vitals:
npx playwright test e2e/performance.spec.ts
```

---

## 6. Kết Quả Đo Lường Web Vitals Thực Tế

Đo lường trên bản đóng gói sản xuất (`vite preview`) bằng trình duyệt Chromium:

| Khung nhìn | Tuyến đường | FCP | LCP (< 2.5s) | CLS (< 0.1) | Kết luận |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Mobile 390px** | Gieo Quẻ (`/divination`) | 1320 ms | 1320 ms | 0.0008 | **Tốt (Good)** |
| **Mobile 390px** | 64 Quẻ Ma Trận (`/hexagrams`) | 436 ms | 816 ms | 0.0003 | **Tốt (Good)** |
| **Tablet 768px** | Gieo Quẻ (`/divination`) | 1432 ms | 1432 ms | 0.0004 | **Tốt (Good)** |
| **Tablet 768px** | 64 Quẻ Ma Trận (`/hexagrams`) | 808 ms | 1224 ms | 0.0002 | **Tốt (Good)** |
| **Desktop 1440px**| Gieo Quẻ (`/divination`) | 372 ms | 704 ms | 0.0045 | **Tốt (Good)** |
| **Desktop 1440px**| 64 Quẻ Ma Trận (`/hexagrams`) | 380 ms | 696 ms | 0.0001 | **Tốt (Good)** |

---

## 7. Giám Sát Runtime & Báo Cáo Lỗi (Telemetry)

- **Client Runtime Monitoring:** Tự động bắt `window.onerror`, `window.onunhandledrejection` và lỗi component bắt bởi `ErrorBoundary`. Lưu tối đa 50 sự cố gần nhất vào `sessionStorage` để người dùng/kiểm thử viên có thể xem trực tiếp trong khối "Chi tiết kỹ thuật".
- **Web Vitals Observer:** Tự động đo FCP, LCP, CLS, TTFB; có thể tra cứu nhanh trên console trình duyệt thông qua lệnh:
  ```js
  window.__getVitalsReport()
  ```
- **Sẵn sàng tích hợp Sentry:** Khi dự án có nhu cầu gửi log lên Sentry, chỉ cần đăng ký hàm callback qua:
  ```js
  window.__TELEMETRY_DISPATCHER__ = (event) => Sentry.captureException(event)
  ```

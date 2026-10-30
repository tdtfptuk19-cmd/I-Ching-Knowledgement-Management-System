# Bộ Tiêu Chuẩn & Kịch Bản Hậu Kiểm Triển Khai (Post-Deploy Verification)

Tài liệu này cung cấp kịch bản kiểm thử tự động, danh mục kiểm tra (checklist) và các tiêu chí Pass/Fail để nghiệm thu hệ thống sau khi hoàn tất triển khai.

---

## 1. Kịch Bản Tự Động Hóa Kiểm Tra Sức Khỏe Toàn Diện

Script PowerShell `scratch/check_system_health.ps1` kiểm tra tuần tự cả 2 tầng Backend (Render) và Frontend (Vercel).

### Cách chạy:
```powershell
powershell -ExecutionPolicy Bypass -File "scratch/check_system_health.ps1"
```

---

## 2. Bảng Danh Mục Kiểm Thử (Verification Matrix)

### A. Tầng Backend API (Render.com + Cloud Database)
| STT | Tên Endpoint | Method | URL / Payload | Tiêu chí Pass |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Health & DB Connection** | `GET` | `https://kinhdich-kb-api.onrender.com/api/v1/health` | HTTP 200, status `ok`, `database: "connected"` |
| 2 | **Hexagram Detail** | `GET` | `https://kinhdich-kb-api.onrender.com/api/v1/hexagram/1` | HTTP 200, trả về dữ liệu quẻ Càn (Thoán từ, Hào từ) |
| 3 | **Semantic Search** | `GET` | `https://kinhdich-kb-api.onrender.com/api/v1/search?q=ti%E1%BB%81m+long` | HTTP 200, danh sách kết quả chứa quẻ 1 hào 1 |
| 4 | **Governance Stats** | `GET` | `https://kinhdich-kb-api.onrender.com/api/v1/governance/stats` | HTTP 200, hiển thị số quy tắc và trạng thái tri thức |
| 5 | **Divination Mai Hoa Number** | `POST` | `/api/v1/divination`<br/>Payload: `{"casting_method": "MAI_HOA_NUMBER", "number_upper": 1, "number_lower": 2, "topic": "CAREER"}` | HTTP 200, trả về quẻ chủ Thiên Trạch Lý, quẻ biến, phân tích Thể/Dụng |
| 6 | **Divination Mai Hoa Time** | `POST` | `/api/v1/divination`<br/>Payload: `{"casting_method": "MAI_HOA_TIME", "solar_datetime": "2026-10-27T17:21:00", "topic": "GENERAL"}` | HTTP 200, trả về quẻ lập theo can chi thời gian thực |
| 7 | **Review Queue** | `GET` | `https://kinhdich-kb-api.onrender.com/api/v1/review/queue` | HTTP 200, danh sách các ca chờ kiểm duyệt |
| 8 | **Swagger Docs UI** | `GET` | `https://kinhdich-kb-api.onrender.com/docs` | HTTP 200, giao diện OpenAPI render đầy đủ schema |

### B. Tầng Frontend Web UI (Vercel)
| STT | Tuyến Đường (Route) | URL | Tiêu chí Pass |
| :---: | :--- | :--- | :--- |
| 1 | **Trang Chủ** | `https://ui-two-lake.vercel.app/` | HTTP 200, giao diện hiển thị 64 quẻ và bảng điều khiển |
| 2 | **Gieo Quẻ** | `https://ui-two-lake.vercel.app/divination` | HTTP 200, form gieo quẻ Mai Hoa số/thời gian hoạt động |
| 3 | **Tra Cứu** | `https://ui-two-lake.vercel.app/search` | HTTP 200, ô tìm kiếm ngữ nghĩa phản hồi nhanh |
| 4 | **Danh Mục 64 Quẻ** | `https://ui-two-lake.vercel.app/hexagrams` | HTTP 200, lưới 64 quẻ nạp đầy đủ thông tin |
| 5 | **Đóng Góp Tri Thức** | `https://ui-two-lake.vercel.app/contribute` | HTTP 200, Route Guard phân quyền vai trò hoạt động |
| 6 | **Kiểm Duyệt Hội Đồng** | `https://ui-two-lake.vercel.app/review` | HTTP 200, danh sách hàng đợi thẩm định hoạt động |

---

## 3. Tiêu Chuẩn Hiệu Năng & Độ Trễ (SLA)

- **Backend Latency (Ấm/Warm)**: `< 800ms` cho các truy vấn đơn, `< 1500ms` cho tính toán gieo quẻ tổng hợp.
- **Backend Latency (Cold Start)**: Cho phép tối đa `45 - 60s` cho lần khởi động lại đầu tiên của Render Free tier.
- **Frontend Load Time**: First Contentful Paint (FCP) `< 1.2s` trên Vercel Edge Network.
- **Bảo mật**: Header CORS đúng quy định, không lộ thông tin chuỗi kết nối CSDL trong response JSON khi có lỗi 500/422.

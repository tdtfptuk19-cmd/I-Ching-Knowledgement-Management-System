# Hướng Dẫn Cấu Hình & Triển Khai Backend API Lên Render.com

Tài liệu này hướng dẫn chi tiết quy trình đóng gói Docker, thiết lập biến môi trường và vận hành FastAPI Process Layer trên Render.com.

---

## 1. Kiến Trúc Vận Hành Trên Render

Backend của KMS301 chạy dưới dạng một **Render Web Service** sử dụng môi trường **Docker**:
- **Repository**: Kết nối trực tiếp với GitHub repo `I-Ching-Knowledgement-Management-System`.
- **Nhánh theo dõi (Branch)**: `main`.
- **Docker Path**: `./Dockerfile`.
- **Base OS**: Debian 12 (Bookworm) cài đặt sẵn `msodbcsql18` và `unixodbc-dev`.
- **Lệnh chạy tự động**:
  ```bash
  uvicorn process_layer.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```
  *(Render sẽ cấp phát cổng động qua biến môi trường `$PORT`)*.

---

## 2. Dockerfile Chuẩn Cho Render

Dockerfile tại thư mục gốc dự án đã được tinh chỉnh để giải quyết các vấn đề tương thích với Microsoft ODBC Driver 18 trên Debian:

```dockerfile
FROM python:3.12-slim-bookworm

# Cài đặt ODBC Driver 18 for SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg2 unixodbc-dev ca-certificates \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements trước để tận dụng Docker layer cache
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn (chứa process_layer bao gồm app/prompts/ và schemas/)
COPY . .

EXPOSE 8000

# Khởi chạy qua sh -c để nhận biến PORT động do Render cấp phát
CMD ["sh", "-c", "uvicorn process_layer.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

---

## 3. Bảng Biến Môi Trường (Environment Variables) Bắt Buộc Trên Render

Khi tạo hoặc cấu hình Web Service trên Render Dashboard (`Settings -> Environment`), nhập đầy đủ các biến sau:

| Tên biến | Giá trị mẫu | Mục đích & Lưu ý |
| :--- | :--- | :--- |
| **`DB_SERVER`** | `mssql12.monsterasp.net,1433` | Host CSDL Cloud + cổng 1433 (SmarterASP/MonsterASP) |
| **`DB_NAME`** | `cXXXX_kinhdich` | Tên CSDL thực tế được cấp |
| **`DB_USER`** | `cXXXX_kinhdich` | Tên tài khoản CSDL |
| **`DB_PASSWORD`** | `********` | Mật khẩu CSDL Cloud |
| **`DB_DRIVER`** | `ODBC Driver 18 for SQL Server` | Bắt buộc dùng bản 18 cho Debian Bookworm |
| **`DB_TIMEOUT`** | `60` | Khắc phục hiện tượng Cold Start của CSDL Cloud |
| **`ALLOW_CLIENT_PAYLOAD`** | `false` | Bắt buộc `false` trên Production để đảm bảo an ninh |
| **`CORS_ORIGINS`** | `*` hoặc `https://ui-two-lake.vercel.app` | Cho phép Vercel UI gọi API |
| **`HMAC_SERVER_SECRET`** | `kinhdich_kms301_production_secret_key` | Khóa băm bảo mật định danh ca gieo quẻ |
| **`LLM_PROVIDER`** | `fake` hoặc `anthropic` | Mô hình LLM cho Trợ lý Dịch sư |
| **`LLM_API_KEY`** | `sk-ant-api03-...` | Chỉ cần nếu `LLM_PROVIDER=anthropic` |
| **`LLM_MODEL`** | `claude-3-5-sonnet-20241022` | Mô hình Claude chỉ định |

---

## 4. Xử Lý Hiện Tượng Cold Start Trên Render Free Tier

Render Free tier sẽ tạm "ngủ đông" (spin down) nếu không có yêu cầu nào trong 15 phút:
- **Thời gian khởi động lại**: Mất khoảng 30 - 50 giây cho lần gọi đầu tiên.
- **Biện pháp xử lý**:
  - `DB_TIMEOUT=60`: Đã được cấu hình trong `config.py` để tránh lỗi `HYT00 (Timeout)` khi CSDL và Backend cùng tỉnh giấc.
  - Vercel Frontend đã tích hợp cơ chế Retry & Banner chờ nếu Backend đang khởi động.

---

## 5. Quy Trình Cập Nhật (Trigger Deploy)

1. **Tự động (Auto-Deploy)**:
   Mỗi khi thực hiện `git push origin main`, Render nhận webhook và tự động build lại Docker image. Quá trình build mất khoảng 2 - 3 phút.
2. **Thủ công (Manual Deploy)**:
   Truy cập [Render Dashboard](https://dashboard.render.com/) -> Chọn dịch vụ `kinhdich-kb-api` -> Bấm nút **Manual Deploy** -> Chọn **Deploy latest commit** hoặc **Clear build cache & deploy**.

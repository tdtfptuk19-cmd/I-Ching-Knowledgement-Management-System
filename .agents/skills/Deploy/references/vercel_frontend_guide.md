# Hướng Dẫn Cấu Hình & Triển Khai Frontend Lên Vercel

Tài liệu này hướng dẫn chi tiết quy trình đóng gói, cấu hình biến môi trường và triển khai ứng dụng React/Vite (`ui/`) lên nền tảng Vercel.

---

## 1. Kiến Trúc Vận Hành Trên Vercel

- **Mã nguồn**: Thư mục `ui/` trong repository.
- **Framework Preset**: Vite / React.
- **Node.js Runtime**: Node 20.x hoặc 22.x.
- **Output Directory**: `ui/dist`.
- **Domain Production**: `https://ui-two-lake.vercel.app`.
- **Project Linkage File**: `ui/.vercel/project.json`
  ```json
  {"projectId":"prj_GLyAf5F3faOuMNErTKiImlQ0GFjc","orgId":"team_TRVn007ikIZZBDEDfR2X4qVF","projectName":"ui"}
  ```

---

## 2. Cấu Hình Môi Trường Production (`ui/.env.production`)

File này điều hướng Frontend chuyển từ mock/local sang gọi trực tiếp API thật trên Render:

```env
# Production environment on Vercel connected to Render.com Backend API
VITE_API_MODE=real
VITE_MOCK=false
VITE_API_BASE_URL=https://kinhdich-kb-api.onrender.com/api/v1
```

> [!IMPORTANT]
> Khi build cho production (`npm run build`), Vite sẽ tự động nạp các biến từ `.env.production`. Tuyệt đối không để `VITE_MOCK=true` trong bản production public.

---

## 3. Cấu Hình Định Tuyến SPA (`ui/vercel.json`)

Do ứng dụng là Single Page Application (SPA) dùng React Router, để tránh lỗi `404 Not Found` khi người dùng refresh hoặc truy cập trực tiếp vào các URL con (`/divination`, `/hexagrams`, `/search`, `/contribute`, `/review`), file `ui/vercel.json` phải chứa cấu hình rewrite:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Các Phương Thức Triển Khai Lên Vercel

### Phương thức 1: Sử dụng Script Tự Động (Khuyến nghị cho Windows)
Dự án có sẵn script `ui/deploy-vercel.bat` giúp kiểm tra Node.js, build bản production và đẩy thẳng lên Vercel:

```cmd
:: Chạy trực tiếp từ thư mục ui hoặc thư mục gốc
cd ui
deploy-vercel.bat
```

**Nội dung cốt lõi của script:**
1. Thêm đường dẫn Node.js vào `PATH`.
2. Chạy `npm run build` để kiểm tra lỗi biên dịch TypeScript và tối ưu bundle.
3. Chạy `npx --yes vercel --prod --yes` để đẩy bản build lên môi trường Production.

### Phương thức 2: Dòng Lệnh Trực Tiếp (CLI)
```bash
cd ui

# 1. Kiểm tra typecheck và build
npm run typecheck
npm run build

# 2. Deploy lên Vercel Production
npx vercel --prod
```

### Phương thức 3: Tự Động Qua GitHub Integration
Nếu dự án đã liên kết repository trên Vercel Dashboard:
- Mỗi khi `git push origin main`, Vercel sẽ tự động trigger build và deploy bản mới nhất.
- Khi tạo Pull Request, Vercel sẽ sinh Preview URL riêng biệt để kiểm thử trước khi merge.

---

## 5. Xử Lý Khi Vercel Yêu Cầu Xác Thực Lại (Authentication)

Nếu token của Vercel CLI hết hạn:
1. Chạy lệnh: `npx vercel login`
2. Chọn `Continue with GitHub` hoặc nhập email đăng ký.
3. Trình duyệt mở ra, xác nhận xác thực.
4. Quay lại terminal và thực hiện lại lệnh deploy.

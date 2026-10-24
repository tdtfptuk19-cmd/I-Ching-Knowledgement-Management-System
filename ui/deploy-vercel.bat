@echo off
chcp 65001 >nul
title Deploy KinhDich_KB UI to Vercel
cd /d "%~dp0"
set "PATH=C:\Users\84394\AppData\Local\Programs\node-v22.12.0-win-x64;%PATH%"

echo ===================================================================
echo   TIẾN TRÌNH DEPLOY TẦNG 3 (KINHDICH_KB UI) LÊN VERCEL
echo ===================================================================
echo.
echo 1. Trình duyệt sẽ mở ra trang Vercel để bạn bấm "Continue with GitHub".
echo 2. Sau khi đăng nhập xong, quay lại cửa sổ này và bấm Enter theo mặc định.
echo.
echo ===================================================================
echo.

npx --yes vercel

echo.
echo ===================================================================
echo   DEPLOY HOÀN TẤT! HÃY SAO CHÉP LINK .vercel.app Ở TRÊN ĐỂ DÙNG.
echo ===================================================================
pause

@echo off
chcp 65001 >nul
title Cổng Tri thức Kinh Dịch (KinhDich_KB) - Layer 3 UI
cd /d "%~dp0\ui"
set "PATH=C:\Users\84394\AppData\Local\Programs\node-v22.12.0-win-x64;%PATH%"

echo ===================================================================
echo   ĐANG MỞ CỔNG TRI THỨC KINH DỊCH (TẦNG 3) TRÊN TRÌNH DUYỆT...
echo ===================================================================
echo.
echo Địa chỉ truy cập: http://localhost:3000
echo.
start http://localhost:3000
npx vite preview --port 3000

pause

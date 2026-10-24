@echo off
chcp 65001 >nul
title Deploy KinhDich_KB UI to Vercel
cd /d "%~dp0\ui"
set "PATH=C:\Users\84394\AppData\Local\Programs\node-v22.12.0-win-x64;%PATH%"

echo ===================================================================
echo   TIẾN TRÌNH DEPLOY TẦNG 3 (KINHDICH_KB UI) LÊN VERCEL
echo ===================================================================
echo.
echo 1. Trình duyệt sẽ mở ra trang Vercel để bạn bấm "Continue with GitHub".
echo 2. Sau khi đăng nhập xong, quay lại cửa sổ này và bấm Enter theo mặc định:
echo    - Set up and deploy? [Y/n] - Bấm Y hoặc Enter
echo    - Which scope? - Bấm Enter
echo    - Link to existing project? - Bấm Enter
echo    - What's your project's name? - Bấm Enter
echo    - In which directory is your code located? - Bấm Enter
echo.
echo ===================================================================
echo.

npx --yes vercel

echo.
echo ===================================================================
echo   DEPLOY HOÀN TẤT! HÃY SAO CHÉP LINK .vercel.app Ở TRÊN ĐỂ DÙNG.
echo ===================================================================
pause

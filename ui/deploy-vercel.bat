@echo off
chcp 65001 >nul
title Deploy KinhDich_KB UI to Vercel
cd /d "%~dp0"

echo ===================================================================
echo   TIEN TRINH DEPLOY KINHDICH_KB UI LEN VERCEL PRODUCTION
echo ===================================================================
echo.

rem Kiem tra va them duong dan Node.js
if exist "C:\Users\84394\AppData\Local\Programs\node-v24.22.1-win-x64" (
    set "PATH=C:\Users\84394\AppData\Local\Programs\node-v24.22.1-win-x64;%PATH%"
)
if exist "C:\Users\84394\AppData\Local\Programs\node-v22.12.0-win-x64" (
    set "PATH=C:\Users\84394\AppData\Local\Programs\node-v22.12.0-win-x64;%PATH%"
)

echo [1/3] Dang kiem tra Node.js va NPM...
call node -v
call npm -v
echo.

echo [2/3] Dang build du an UI voi cau hinh API Render that...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Build that bai! Vui long kiem tra code.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [3/3] Dang deploy len Vercel Production...
call npx --yes vercel --prod --yes
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Neu gap loi dang nhap, Vercel se yeu cau xac thuc. Vui long lam theo huong dan tren man hinh.
)

echo.
echo ===================================================================
echo   DEPLOY HOAN TAT!
echo   Link web: https://ui-two-lake.vercel.app
echo ===================================================================
pause

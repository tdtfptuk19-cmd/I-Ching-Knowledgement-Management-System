<#
.SYNOPSIS
    Script kiểm tra nhanh trạng thái sẵn sàng triển khai và sức khỏe hệ thống live (KMS301)
#>

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   KMS301 / KinhDich_KB - Quick Deployment Status & Health Check " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Kiểm tra Git Status
Write-Host "`n[1/4] Kiểm tra trạng thái Git local..." -ForegroundColor Yellow
$gitStatus = git status --short
if (-not $gitStatus) {
    Write-Host "  -> Working tree sạch, sẵn sàng push/deploy!" -ForegroundColor Green
} else {
    Write-Host "  -> Cảnh báo: Có tệp chưa commit:" -ForegroundColor Magenta
    $gitStatus | ForEach-Object { Write-Host "     $_" }
}

# 2. Kiểm tra Remote URL
Write-Host "`n[2/4] Kiểm tra Git Remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
Write-Host "  -> Origin: $remote" -ForegroundColor Green

# 3. Kiểm tra Backend API trên Render
Write-Host "`n[3/4] Kiểm tra Backend API (Render.com)..." -ForegroundColor Yellow
$backendUrl = "https://kinhdich-kb-api.onrender.com/api/v1/health"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $res = Invoke-RestMethod -Uri $backendUrl -Method Get -TimeoutSec 30
    $sw.Stop()
    Write-Host ("  -> [ONLINE] Health Status: {0} | DB: {1} ({2}ms)" -f $res.status, $res.database, $sw.ElapsedMilliseconds) -ForegroundColor Green
} catch {
    $sw.Stop()
    Write-Host ("  -> [OFFLINE/COLD START] Lỗi: {0} ({1}ms)" -f $_.Exception.Message, $sw.ElapsedMilliseconds) -ForegroundColor Red
}

# 4. Kiểm tra Frontend Web trên Vercel
Write-Host "`n[4/4] Kiểm tra Frontend UI (Vercel)..." -ForegroundColor Yellow
$frontendUrl = "https://ui-two-lake.vercel.app"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $webRes = Invoke-WebRequest -Uri $frontendUrl -Method Get -TimeoutSec 15 -UseBasicParsing
    $sw.Stop()
    Write-Host ("  -> [ONLINE] Vercel HTTP Status: {0} ({1}ms)" -f $webRes.StatusCode, $sw.ElapsedMilliseconds) -ForegroundColor Green
} catch {
    $sw.Stop()
    Write-Host ("  -> [OFFLINE] Lỗi: {0} ({1}ms)" -f $_.Exception.Message, $sw.ElapsedMilliseconds) -ForegroundColor Red
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " Hoàn tất kiểm tra nhanh. Xem chi tiết tại references/" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

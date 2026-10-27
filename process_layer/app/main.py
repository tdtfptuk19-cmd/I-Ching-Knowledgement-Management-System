#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
main.py - Điểm khởi động chính của KinhDich_KB Process Layer API (FastAPI)
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from process_layer.app.core.config import settings
from process_layer.app.core.errors import AppError
from process_layer.app.api import divination, search, governance

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API Tầng 2 (Reasoning & Logic Engine) cho Hệ thống Quản trị Tri thức Kinh Dịch (KMS301 - Nhóm 5).",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler cho lỗi nghiệp vụ chuẩn hóa AppError
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
        headers={"Access-Control-Allow-Origin": "*"},
    )


# Exception handler bắt lỗi chung
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Đã xảy ra lỗi nội bộ trong hệ thống Process Layer.",
            "details": {"error_type": type(exc).__name__, "error_detail": str(exc)},
        },
        headers={"Access-Control-Allow-Origin": "*"},
    )


# Đăng ký các router
app.include_router(divination.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
app.include_router(governance.router, prefix=settings.API_V1_PREFIX)


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Health"])
def health_check():
    """Kiểm tra tình trạng hoạt động của Process Layer."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": settings.DB_NAME,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("process_layer.app.main:app", host="0.0.0.0", port=8000, reload=True)

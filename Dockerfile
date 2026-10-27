FROM python:3.12-slim

# Cài đặt ODBC Driver 18 for SQL Server (sử dụng gpg --dearmor chuẩn Debian 12)
# Cài đặt ODBC Driver 18 for SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg2 unixodbc-dev ca-certificates \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements trước để tận dụng Docker layer cache
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn (chứa process_layer bao gồm app/prompts/ và schemas/)
COPY . .

EXPOSE 8000

# Khởi chạy qua sh -c để nhận biến PORT động do Render cấp phát
CMD ["sh", "-c", "uvicorn process_layer.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

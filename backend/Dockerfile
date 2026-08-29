# ── HorizonStock AI Backend ──────────────────────────────────
# Multi-stage Docker build for a lean, production-ready image.
# Uses python:3.11-slim to keep the image size minimal.
# ─────────────────────────────────────────────────────────────

# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /build

# Install system-level build dependencies needed by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production image
FROM python:3.12-slim

WORKDIR /app

# Copy pre-built Python packages from builder stage
COPY --from=builder /install /usr/local

# Install runtime system dependencies:
#  - curl: for healthcheck
#  - Playwright deps: Chromium needs these shared libraries at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libwayland-client0 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright Chromium browser binary
RUN python -m playwright install chromium

# Copy application code
COPY . .

# Remove files not needed in production
RUN rm -rf .venv .env .env.example __pycache__ \
    nse_nifty500_fetcher.py test_*.py .gitignore

# Expose the port Render will inject via $PORT
EXPOSE 10000

# Run the FastAPI app with uvicorn
# Render injects PORT env var; default to 10000 if not set
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]

# Production-ready Dockerfile for Railway deployment
# Use Python slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PIP_NO_CACHE_DIR=1

# Install build dependencies and runtime dependencies
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for building frontend
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first (for better Docker cache)
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Build frontend
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps && npm run build

# Copy backend code
WORKDIR /app
COPY backend/ ./backend/

# Collect static files (ignore if not yet ready)
WORKDIR /app/backend
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:$PORT/ || exit 1

# Expose port
EXPOSE $PORT

# Start application
CMD ["sh", "-c", "python manage.py migrate && gunicorn beauty_ecommerce.wsgi --bind 0.0.0.0:$PORT --workers 3 --timeout 60"]

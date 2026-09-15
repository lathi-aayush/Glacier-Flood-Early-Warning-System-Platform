FROM python:3.12-slim

# libgomp1 required by XGBoost (OpenMP runtime)
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend package into /app/backend to preserve python module imports (backend.core, etc.)
COPY backend/ ./backend/

ENV PYTHONPATH=/app

EXPOSE 10000

# Render sets $PORT; run uvicorn with module backend.main:app
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-10000}"]

# Simple Dockerfile for local Django development
FROM python:3.11-slim

WORKDIR /app

COPY backend/ ./backend/
COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --upgrade pip && \
    pip install -r ./backend/requirements.txt

WORKDIR /app/backend

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

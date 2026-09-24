FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app/backend
WORKDIR /app

RUN useradd --create-home --uid 10001 docnear
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend /app/backend
COPY deploy /app/deploy
RUN mkdir -p /app/backend/staticfiles /app/backend/media \
    && chmod 0755 /app/deploy/render/start.sh \
    && chown -R docnear:docnear /app
USER docnear
WORKDIR /app/backend

EXPOSE 8000
CMD ["/app/deploy/render/start.sh"]

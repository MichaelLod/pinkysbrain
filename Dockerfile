FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt boto3

COPY server/ server/

ENV DATA_DIR=/app/data

EXPOSE 8765

CMD ["python", "-m", "server"]

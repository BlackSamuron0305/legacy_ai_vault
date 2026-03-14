FROM python:3.9-slim

WORKDIR /app

# Install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application source
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV PORT=5000
ENV FLASK_ENV=production

# Use gunicorn for production serving
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "120", "app:app"]

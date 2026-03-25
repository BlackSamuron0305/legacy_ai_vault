# Build Stage
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM nginx:1.27-bookworm-slim

# Install wget for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    client_max_body_size 50m; \
    \
    # gzip compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml; \
    gzip_min_length 256; \
    \
    # Static assets with cache headers \
    location /assets/ { \
        root /usr/share/nginx/html; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # SSE endpoint — disable buffering, long timeout \
    location ~ ^/api/sessions/.+/transcript/live$ { \
        proxy_pass http://backend:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Connection ""; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_buffering off; \
        proxy_cache off; \
        proxy_read_timeout 86400s; \
        chunked_transfer_encoding off; \
    } \
    \
    # Regular API proxy \
    location /api/ { \
        proxy_pass http://backend:3001/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 300s; \
        proxy_send_timeout 300s; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

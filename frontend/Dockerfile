# Build Stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
# If bun.lockb exists but no package-lock, npm might complain or generate one.
# Preferably use npm ci if lockfile exists, else npm install.
RUN npm install

COPY . .
# Build the application
RUN npm run build

# Production Stage
FROM nginx:alpine
# Copy the build output to replace the default nginx contents.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
# Using environment variable substition for backend URL is tricky in static nginx config without envsubst.
# Hardcoding 'backend' service name assumes docker-compose service name is 'backend'.
RUN echo 'server { \
    listen 80; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass http://backend:3001/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

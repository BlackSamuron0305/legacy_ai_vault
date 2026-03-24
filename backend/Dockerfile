FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app

# Chromium for Puppeteer PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium curl fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:3001/api/health || exit 1
CMD ["npm", "start"]

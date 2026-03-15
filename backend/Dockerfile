FROM node:18-alpine
WORKDIR /app

# Chromium for Puppeteer PDF generation
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]

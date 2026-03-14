#!/bin/bash

# Legacy AI Vault - Redeploy Script
# This script rebuilds and restarts all services

set -e  # Exit on any error

echo "🚀 Starting Legacy AI Vault redeploy..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_error ".env file not found in root directory!"
    echo "Please create .env file with required environment variables."
    exit 1
fi

log_info "✅ Found .env file"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml not found!"
    exit 1
fi

log_info "✅ Found docker-compose.yml"

# Stop existing services
log_info "🛑 Stopping existing services..."
docker-compose down

# Clean up old containers and images (optional)
read -p "Do you want to clean up old Docker images and containers? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "🧹 Cleaning up old Docker resources..."
    docker system prune -f
    docker volume prune -f
fi

# Build new images
log_info "🔨 Building new Docker images..."
docker-compose build --no-cache

# Start services
log_info "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
log_info "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
log_info "🏥 Checking service health..."

# Check backend health
echo -n "Backend: "
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log_success "✅ Healthy"
else
    log_warning "⚠️ Not responding (may still be starting)"
fi

# Check AI service health
echo -n "AI Service: "
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log_success "✅ Healthy"
else
    log_warning "⚠️ Not responding (may still be starting)"
fi

# Check frontend
echo -n "Frontend: "
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "✅ Healthy"
else
    log_warning "⚠️ Not responding (may still be starting)"
fi

# Show running containers
log_info "📋 Current container status:"
docker-compose ps

# Show logs for any failed services
log_info "📋 Recent service logs:"
docker-compose logs --tail=20

echo ""
log_success "🎉 Redeploy completed!"
echo ""
echo "🌐 Service URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001/api"
echo "  AI Service: http://localhost:5000/api"
echo ""
echo "📝 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart [service-name]"

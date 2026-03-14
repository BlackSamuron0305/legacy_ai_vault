# Legacy AI Vault - Redeploy Guide

## Quick Start

### Windows (Recommended)
```bash
# Run the Windows batch script
.\redeploy.bat
```

### Linux/Mac/WSL
```bash
# Make script executable (Linux/Mac)
chmod +x redeploy.sh

# Run the script
./redeploy.sh
```

## What the Script Does

### 🔄 **Complete Redeploy Process**

1. **Environment Validation**
   - ✅ Checks for `.env` file in root
   - ✅ Verifies `docker-compose.yml` exists

2. **Service Management**
   - 🛑 Stops all existing services
   - 🧹 Optional cleanup of old Docker resources
   - 🔨 Rebuilds all images from scratch
   - 🚀 Starts all services in detached mode

3. **Health Checks**
   - 🏥 Tests backend health endpoint
   - 🏥 Tests AI service health endpoint
   - 🏥 Tests frontend accessibility
   - 📋 Shows container status and recent logs

### 🌐 **Service Endpoints Checked**

| Service | URL | Health Check |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | HTTP GET |
| Backend API | http://localhost:3001/api/health | API endpoint |
| AI Service | http://localhost:5000/api/health | API endpoint |

## Manual Commands (If Script Fails)

### Stop Services
```bash
docker-compose down
```

### Rebuild Images
```bash
docker-compose build --no-cache
```

### Start Services
```bash
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service
```

## Troubleshooting

### 🚨 **Common Issues**

#### Port Already in Use
```bash
# Find what's using the port
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Linux/Mac

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac
```

#### Environment Variables Missing
```bash
# Check .env file exists
ls -la .env

# Verify required variables
cat .env
```

#### Docker Issues
```bash
# Reset Docker
docker system prune -a -f
docker volume prune -f
docker-compose down --volumes
```

#### Build Failures
```bash
# Clear build cache
docker builder prune -a

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
docker-compose build --no-cache ai-service
```

### 🔧 **Debug Mode**

For detailed debugging, run services individually:

```bash
# Start with logs
docker-compose up

# Build and run one service
docker-compose up --build backend
```

## Environment Variables Required

Your `.env` file should contain:

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...

# AI Services
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...
HUGGINGFACE_API_TOKEN=...

# Application
NODE_ENV=development
PORT=3001
FLASK_ENV=production

# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_AI_SERVICE_URL=http://localhost:5000/api
```

## Development Workflow

### 🔄 **Typical Development Cycle**

1. **Make code changes**
2. **Run redeploy script**
3. **Test functionality**
4. **Check logs if issues**
5. **Repeat**

### 📝 **Useful Commands**

```bash
# Quick restart (no rebuild)
docker-compose restart

# Rebuild single service
docker-compose build backend && docker-compose up -d backend

# View real-time logs
docker-compose logs -f --tail=100

# Enter container for debugging
docker-compose exec backend sh
docker-compose exec ai-service sh
```

## Production Considerations

- Use `NODE_ENV=production` in production
- Configure proper SSL certificates
- Set up proper database backups
- Monitor service health with proper tools
- Use environment-specific `.env` files

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify `.env` file contents
3. Ensure Docker is running properly
4. Check for port conflicts
5. Try a full Docker reset: `docker system prune -a`

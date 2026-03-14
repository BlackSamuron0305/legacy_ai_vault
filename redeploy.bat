@echo off
REM Legacy AI Vault - Redeploy Script (Windows)
REM This script rebuilds and restarts all services

setlocal enabledelayedexpansion

echo 🚀 Starting Legacy AI Vault redeploy...

REM Check if .env file exists
if not exist ".env" (
    echo [ERROR] .env file not found in root directory!
    echo Please create .env file with required environment variables.
    pause
    exit /b 1
)

echo [INFO] ✅ Found .env file

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found!
    pause
    exit /b 1
)

echo [INFO] ✅ Found docker-compose.yml

REM Stop existing services
echo [INFO] 🛑 Stopping existing services...
docker-compose down

REM Ask about cleanup
set /p cleanup="Do you want to clean up old Docker images and containers? (y/N): "
if /i "%cleanup%"=="y" (
    echo [INFO] 🧹 Cleaning up old Docker resources...
    docker system prune -f
    docker volume prune -f
)

REM Build new images
echo [INFO] 🔨 Building new Docker images...
docker-compose build --no-cache

REM Start services
echo [INFO] 🚀 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo [INFO] ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

REM Check service health
echo [INFO] 🏥 Checking service health...

REM Check backend health
echo Backend: 
curl -f http://localhost:3001/api/health >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] ✅ Healthy
) else (
    echo [WARNING] ⚠️ Not responding ^(may still be starting^)
)

REM Check AI service health
echo AI Service: 
curl -f http://localhost:5000/api/health >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] ✅ Healthy
) else (
    echo [WARNING] ⚠️ Not responding ^(may still be starting^)
)

REM Check frontend
echo Frontend: 
curl -f http://localhost:3000 >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] ✅ Healthy
) else (
    echo [WARNING] ⚠️ Not responding ^(may still be starting^)
)

REM Show running containers
echo [INFO] 📋 Current container status:
docker-compose ps

REM Show logs for any failed services
echo [INFO] 📋 Recent service logs:
docker-compose logs --tail=20

echo.
echo [SUCCESS] 🎉 Redeploy completed!
echo.
echo 🌐 Service URLs:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3001/api
echo   AI Service: http://localhost:5000/api
echo.
echo 📝 To view logs: docker-compose logs -f [service-name]
echo 🛑 To stop: docker-compose down
echo 🔄 To restart: docker-compose restart [service-name]
echo.
pause

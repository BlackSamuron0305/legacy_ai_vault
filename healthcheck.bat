@echo off
REM Legacy AI Vault - Health Check Script (Windows)
REM Comprehensive health monitoring for all services

setlocal enabledelayedexpansion

REM Configuration
set "ENV_FILE=%~dp0.env"
set "TIMEOUT=10"

REM Helper functions
:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [✓] %~1
goto :eof

:log_warning
echo [⚠] %~1
goto :eof

:log_error
echo [✗] %~1
goto :eof

:log_header
echo [HEADER] %~1
goto :eof

:log_service
echo [SERVICE] %~1
goto :eof

REM Load environment variables
:load_env
if not exist "%ENV_FILE%" (
    call :log_error "Environment file not found: %ENV_FILE%"
    exit /b 1
)

REM Load .env file line by line
for /f "usebackq tokens=1,2 delims==" %%a in ("%ENV_FILE%") do (
    if not "%%a"=="" if not "%%a"=="#" (
        set "%%a=%%b"
    )
)

call :log_success "Environment loaded from %ENV_FILE%"
goto :eof

REM Mask sensitive values
:mask_value
set "value=%~1"
if "%value%"=="" (
    echo (missing)
) else if "%value:~8%"=="" (
    echo ****
) else (
    echo %value:~0,4%...%value:~-4%
)
goto :eof

REM HTTP request with timeout
:http_request
set "url=%~1"
set "headers=%~2"
set "method=%~3"
if "%method%"=="" set "method=GET"

REM Use curl if available, otherwise fallback
curl -s -w "%%{http_code}" -m %TIMEOUT% -X %method% %headers% "%url%" 2>nul
goto :eof

REM Check service health
:check_service
set "service_name=%~1"
set "url=%~2"
set "expected_status=%~3"
if "%expected_status%"=="" set "expected_status=200"

call :log_service "Checking %service_name%..."

REM Get start time (approximate)
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set /a "start_time=%%a*360000 + %%b*6000 + %%c*100"
)

for /f %%i in ('call :http_request "%url% "" "%method%"') do set "response=%%i"

REM Get end time
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set /a "end_time=%%a*360000 + %%b*6000 + %%c*100"
)

set /a "duration=%end_time% - %start_time%"

if "%response%"=="%expected_status%" (
    call :log_success "%service_name% is healthy (%duration%ms)"
    set "result=0"
) else (
    call :log_error "%service_name% failed (HTTP %response%, %duration%ms)"
    set "result=1"
)
goto :eof

REM Check API authentication
:check_api_auth
set "service_name=%~1"
set "url=%~2"
set "auth_header=%~3"

call :log_service "Checking %service_name% authentication..."

for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set /a "start_time=%%a*360000 + %%b*6000 + %%c*100"
)

for /f %%i in ('call :http_request "%url%" "%auth_header%"') do set "response=%%i"
set "status=%response:~-3%"

for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set /a "end_time=%%a*360000 + %%b*6000 + %%c*100"
)

set /a "duration=%end_time% - %start_time%"

if "%status%"=="200" (
    call :log_success "%service_name% authentication OK (%duration%ms)"
    set "result=0"
) else (
    call :log_error "%service_name% authentication failed (HTTP %status%, %duration%ms)"
    set "result=1"
)
goto :eof

REM Check Docker services
:check_docker_services
call :log_header "Docker Services Status"
echo.

docker version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker not installed or not in PATH"
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker daemon not running"
    exit /b 1
)

REM Check if docker-compose is available
docker-compose version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        call :log_error "docker-compose not available"
        exit /b 1
    ) else (
        set "compose_cmd=docker compose"
    )
) else (
    set "compose_cmd=docker-compose"
)

for /f "usebackq tokens=1,2,3" %%a in (`%compose_cmd% ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2^>nul`) do (
    echo "%%a %%b %%c" | findstr /i "running" >nul
    if not errorlevel 1 (
        call :log_success "%%a is running"
    )
    echo "%%a %%b %%c" | findstr /i "exited" >nul
    if not errorlevel 1 (
        call :log_error "%%a has exited"
    )
)
goto :eof

REM Main health check function
:main_health_check
call :log_header "Legacy AI Vault - Health Check"
echo.

REM Load environment
call :load_env

echo.
call :log_header "Configuration Check"
echo.

set "config_ok=1"

if defined ELEVENLABS_API_KEY (
    call :log_success "ELEVENLABS_API_KEY: $(call :mask_value %ELEVENLABS_API_KEY%)"
) else (
    call :log_error "ELEVENLABS_API_KEY: missing"
    set "config_ok=0"
)

if defined HUGGINGFACE_API_TOKEN (
    call :log_success "HUGGINGFACE_API_TOKEN: $(call :mask_value %HUGGINGFACE_API_TOKEN%)"
) else (
    call :log_error "HUGGINGFACE_API_TOKEN: missing"
    set "config_ok=0"
)

if defined DATABASE_URL (
    call :log_success "DATABASE_URL: configured"
) else (
    call :log_error "DATABASE_URL: missing"
    set "config_ok=0"
)

if defined JWT_SECRET (
    call :log_success "JWT_SECRET: configured"
) else (
    call :log_error "JWT_SECRET: missing"
    set "config_ok=0"
)

echo.
call :log_header "Service Health Checks"
echo.

set "checks_passed=0"
set "total_checks=0"

REM Check AI Service
set /a "total_checks+=1"
call :check_service "AI Service" "http://localhost:5000/api/health"
if !result!==0 set /a "checks_passed+=1"

REM Check Backend API
set /a "total_checks+=1"
call :check_service "Backend API" "http://localhost:3001/api/health"
if !result!==0 set /a "checks_passed+=1"

REM Check Frontend
set /a "total_checks+=1"
call :check_service "Frontend" "http://localhost:8080"
if !result!==0 set /a "checks_passed+=1"

REM Check external APIs (optional)
echo.
call :log_header "External API Checks"
echo.

if defined ELEVENLABS_API_KEY (
    set /a "total_checks+=1"
    call :check_api_auth "ElevenLabs API" "https://api.elevenlabs.io/v1/user" "-H \"xi-api-key: %ELEVENLABS_API_KEY%\""
    if !result!==0 set /a "checks_passed+=1"
)

if defined HUGGINGFACE_API_TOKEN (
    set /a "total_checks+=1"
    call :check_api_auth "Hugging Face API" "https://huggingface.co/api/whoami-v2" "-H \"Authorization: Bearer %HUGGINGFACE_API_TOKEN%\""
    if !result!==0 set /a "checks_passed+=1"
)



REM Docker services check
echo.
call :check_docker_services

REM Summary
echo.
call :log_header "Health Check Summary"
echo.

if %checks_passed%==%total_checks% (
    call :log_success "All checks passed! (%checks_passed%/%total_checks%)"
    set "exit_code=0"
) else if %checks_passed% GTR %total_checks%/2 (
    call :log_warning "Partial success (%checks_passed%/%total_checks%)"
    set "exit_code=1"
) else (
    call :log_error "Major issues detected (%checks_passed%/%total_checks%)"
    set "exit_code=2"
)

echo.
call :log_info "Service URLs:"
echo   Frontend:   http://localhost:8080
echo   Backend:    http://localhost:3001/api
echo   AI Service: http://localhost:5000/api
echo.

exit /b %exit_code%

REM Run main function
call :main_health_check %*

#!/bin/bash

# Legacy AI Vault - Health Check Script
# Comprehensive health monitoring for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
TIMEOUT=10

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

log_service() {
    echo -e "${CYAN}[SERVICE]${NC} $1"
}

# Load environment variables
load_env() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        return 1
    fi
    
    # Load .env file
    set -a
    source "$ENV_FILE"
    set +a
    
    log_success "Environment loaded from $ENV_FILE"
}

# Mask sensitive values
mask_value() {
    local value="$1"
    if [[ -z "$value" ]]; then
        echo "(missing)"
    elif [[ ${#value} -le 8 ]]; then
        echo "****"
    else
        echo "${value:0:4}...${value: -4}"
    fi
}

# HTTP request with timeout
http_request() {
    local url="$1"
    local headers="$2"
    local method="${3:-GET}"
    
    if command -v curl >/dev/null 2>&1; then
        curl -s -w "%{http_code}" -m "$TIMEOUT" -X "$method" $headers "$url" 2>/dev/null
    elif command -v wget >/dev/null 2>&1; then
        wget -q -T "$TIMEOUT" -t 1 --method="$method" $headers "$url" -O - 2>/dev/null | tail -c 3
    else
        echo "000"
        return 1
    fi
}

# Check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    log_service "Checking $service_name..."
    
    local start_time=$(date +%s%3N)
    local response=$(http_request "$url")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [[ "$response" == *"$expected_status"* ]]; then
        log_success "$service_name is healthy (${duration}ms)"
        return 0
    else
        log_error "$service_name failed (HTTP $response, ${duration}ms)"
        return 1
    fi
}

# Check API authentication
check_api_auth() {
    local service_name="$1"
    local url="$2"
    local auth_header="$3"
    local success_pattern="$4"
    
    log_service "Checking $service_name authentication..."
    
    local start_time=$(date +%s%3N)
    local response=$(http_request "$url" "$auth_header")
    local status="${response: -3}"
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [[ "$status" == "200" ]]; then
        log_success "$service_name authentication OK (${duration}ms)"
        return 0
    else
        log_error "$service_name authentication failed (HTTP $status, ${duration}ms)"
        return 1
    fi
}

# Check Docker services
check_docker_services() {
    log_header "Docker Services Status"
    echo ""
    
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker not installed or not in PATH"
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon not running"
        return 1
    fi
    
    # Check if docker-compose is available
    local compose_cmd="docker-compose"
    if ! command -v docker-compose >/dev/null 2>&1; then
        if docker compose version >/dev/null 2>&1; then
            compose_cmd="docker compose"
        else
            log_error "docker-compose not available"
            return 1
        fi
    fi
    
    # Get service status
    local services_status=$($compose_cmd ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "")
    
    if [[ -z "$services_status" ]]; then
        log_warning "No services running"
        return 1
    fi
    
    echo "$services_status" | while IFS= read -r line; do
        if [[ "$line" =~ "running" ]]; then
            log_success "$(echo "$line" | awk '{print $1}') is running"
        elif [[ "$line" =~ "exited" ]]; then
            log_error "$(echo "$line" | awk '{print $1}') has exited"
        fi
    done
}

# Main health check function
main_health_check() {
    log_header "Legacy AI Vault - Health Check"
    echo ""
    
    # Load environment
    load_env
    
    echo ""
    log_header "Configuration Check"
    echo ""
    
    # Check critical environment variables
    local config_ok=true
    
    if [[ -n "$ELEVENLABS_API_KEY" ]]; then
        log_success "ELEVENLABS_API_KEY: $(mask_value "$ELEVENLABS_API_KEY")"
    else
        log_error "ELEVENLABS_API_KEY: missing"
        config_ok=false
    fi
    
    if [[ -n "$HUGGINGFACE_API_TOKEN" ]]; then
        log_success "HUGGINGFACE_API_TOKEN: $(mask_value "$HUGGINGFACE_API_TOKEN")"
    else
        log_error "HUGGINGFACE_API_TOKEN: missing"
        config_ok=false
    fi
    
    if [[ -n "$DATABASE_URL" ]]; then
        log_success "DATABASE_URL: configured"
    else
        log_error "DATABASE_URL: missing"
        config_ok=false
    fi
    
    if [[ -n "$JWT_SECRET" ]]; then
        log_success "JWT_SECRET: configured"
    else
        log_error "JWT_SECRET: missing"
        config_ok=false
    fi
    
    echo ""
    log_header "Service Health Checks"
    echo ""
    
    local checks_passed=0
    local total_checks=0
    
    # Check AI Service
    ((total_checks++))
    if check_service "AI Service" "http://localhost:5000/api/health"; then
        ((checks_passed++))
    fi
    
    # Check Backend API
    ((total_checks++))
    if check_service "Backend API" "http://localhost:3001/api/health"; then
        ((checks_passed++))
    fi
    
    # Check Frontend
    ((total_checks++))
    if check_service "Frontend" "http://localhost:8080"; then
        ((checks_passed++))
    fi
    
    # Check external APIs (optional)
    echo ""
    log_header "External API Checks"
    echo ""
    
    if [[ -n "$ELEVENLABS_API_KEY" ]]; then
        ((total_checks++))
        if check_api_auth "ElevenLabs API" "https://api.elevenlabs.io/v1/user" "-H \"xi-api-key: $ELEVENLABS_API_KEY\""; then
            ((checks_passed++))
        fi
    fi
    
    if [[ -n "$HUGGINGFACE_API_TOKEN" ]]; then
        ((total_checks++))
        if check_api_auth "Hugging Face API" "https://huggingface.co/api/whoami-v2" "-H \"Authorization: Bearer $HUGGINGFACE_API_TOKEN\""; then
            ((checks_passed++))
        fi
    fi
    

    
    # Docker services check
    echo ""
    check_docker_services
    
    # Summary
    echo ""
    log_header "Health Check Summary"
    echo ""
    
    if [[ $checks_passed -eq $total_checks ]]; then
        log_success "All checks passed! ($checks_passed/$total_checks)"
        exit_code=0
    elif [[ $checks_passed -gt $((total_checks / 2)) ]]; then
        log_warning "Partial success ($checks_passed/$total_checks)"
        exit_code=1
    else
        log_error "Major issues detected ($checks_passed/$total_checks)"
        exit_code=2
    fi
    
    echo ""
    log_info "Service URLs:"
    echo "  Frontend:   http://localhost:8080"
    echo "  Backend:    http://localhost:3001/api"
    echo "  AI Service: http://localhost:5000/api"
    echo ""
    
    exit $exit_code
}

# Run main function
main_health_check "$@"

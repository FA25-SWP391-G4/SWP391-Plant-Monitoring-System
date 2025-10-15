#!/bin/bash

# AI Features Integration Deployment Script
# This script deploys the complete AI-integrated plant monitoring system

set -e  # Exit on any error

echo "🚀 Starting AI Features Integration Deployment..."

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.ai.yml"
ENV_FILE=".env.${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        warn "Environment file $ENV_FILE not found, using default .env"
        ENV_FILE=".env"
    fi
    
    # Check compose file
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker Compose file $COMPOSE_FILE not found"
        exit 1
    fi
    
    log "Prerequisites check completed ✅"
}

# Backup existing data
backup_data() {
    log "Creating backup of existing data..."
    
    BACKUP_DIR="backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if running
    if docker-compose -f "$COMPOSE_FILE" ps postgresql | grep -q "Up"; then
        info "Backing up PostgreSQL database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgresql pg_dump -U postgres plant_monitoring > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup uploads directory
    if [ -d "ai-service/uploads" ]; then
        info "Backing up uploads directory..."
        cp -r ai-service/uploads "$BACKUP_DIR/"
    fi
    
    # Backup logs
    if [ -d "logs" ]; then
        info "Backing up logs..."
        cp -r logs "$BACKUP_DIR/"
    fi
    
    log "Backup completed: $BACKUP_DIR ✅"
}

# Build and deploy services
deploy_services() {
    log "Building and deploying services..."
    
    # Load environment variables
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    
    # Pull latest images
    info "Pulling latest base images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build custom images
    info "Building custom images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop existing services
    info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start infrastructure services first
    info "Starting infrastructure services..."
    docker-compose -f "$COMPOSE_FILE" up -d postgresql redis mosquitto
    
    # Wait for infrastructure to be ready
    info "Waiting for infrastructure services..."
    sleep 30
    
    # Run database migrations
    info "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" run --rm ai-service node database/setup-ai-database.js
    
    # Start application services
    info "Starting application services..."
    docker-compose -f "$COMPOSE_FILE" up -d main-server ai-service frontend
    
    # Start monitoring services
    info "Starting monitoring services..."
    docker-compose -f "$COMPOSE_FILE" up -d nginx prometheus grafana
    
    log "Services deployment completed ✅"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Wait for services to start
    info "Waiting for services to initialize..."
    sleep 60
    
    # Check main server
    info "Checking main server health..."
    if curl -f http://localhost:3010/health > /dev/null 2>&1; then
        log "Main server is healthy ✅"
    else
        error "Main server health check failed ❌"
        return 1
    fi
    
    # Check AI service
    info "Checking AI service health..."
    if curl -f http://localhost:3001/api/ai/health > /dev/null 2>&1; then
        log "AI service is healthy ✅"
    else
        error "AI service health check failed ❌"
        return 1
    fi
    
    # Check frontend
    info "Checking frontend health..."
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log "Frontend is healthy ✅"
    else
        error "Frontend health check failed ❌"
        return 1
    fi
    
    # Check database
    info "Checking database connection..."
    if docker-compose -f "$COMPOSE_FILE" exec -T postgresql pg_isready -U postgres > /dev/null 2>&1; then
        log "Database is healthy ✅"
    else
        error "Database health check failed ❌"
        return 1
    fi
    
    # Check Redis
    info "Checking Redis connection..."
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
        log "Redis is healthy ✅"
    else
        error "Redis health check failed ❌"
        return 1
    fi
    
    # Check MQTT broker
    info "Checking MQTT broker..."
    if docker-compose -f "$COMPOSE_FILE" exec -T mosquitto mosquitto_pub -h localhost -t test -m "health check" > /dev/null 2>&1; then
        log "MQTT broker is healthy ✅"
    else
        error "MQTT broker health check failed ❌"
        return 1
    fi
    
    log "All health checks passed ✅"
}

# Run integration tests
run_integration_tests() {
    log "Running integration tests..."
    
    # Run comprehensive system tests
    info "Running comprehensive system tests..."
    if node tests/run-comprehensive-system-tests.js; then
        log "System tests passed ✅"
    else
        error "System tests failed ❌"
        return 1
    fi
    
    # Run AI-specific tests
    info "Running AI feature tests..."
    if node tests/run-ai-e2e-tests.js; then
        log "AI tests passed ✅"
    else
        error "AI tests failed ❌"
        return 1
    fi
    
    # Run security tests
    info "Running security tests..."
    if node ai-service/run-security-tests.js; then
        log "Security tests passed ✅"
    else
        error "Security tests failed ❌"
        return 1
    fi
    
    log "All integration tests passed ✅"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and alerting..."
    
    # Create monitoring directories
    mkdir -p monitoring/prometheus monitoring/grafana/dashboards monitoring/grafana/datasources
    
    # Create Prometheus configuration
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'main-server'
    static_configs:
      - targets: ['main-server:3010']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:3001']
    metrics_path: '/api/ai/metrics'
    scrape_interval: 30s

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgresql:5432']
    scrape_interval: 60s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 60s

  - job_name: 'mosquitto'
    static_configs:
      - targets: ['mosquitto:1883']
    scrape_interval: 60s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

    # Create Grafana datasource configuration
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    # Create basic dashboard
    cat > monitoring/grafana/dashboards/ai-service.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "AI Service Dashboard",
    "tags": ["ai", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "title": "AI Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"ai-service\"}",
            "legendFormat": "AI Service Status"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "avg_response_time{job=\"ai-service\"}",
            "legendFormat": "Average Response Time"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    log "Monitoring setup completed ✅"
}

# Create nginx configuration
setup_nginx() {
    log "Setting up Nginx reverse proxy..."
    
    mkdir -p nginx
    
    cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream main-server {
        server main-server:3010;
    }
    
    upstream ai-service {
        server ai-service:3001;
    }
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=ai:10m rate=5r/s;
    
    server {
        listen 80;
        server_name localhost;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Main API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://main-server;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # AI Service API
        location /api/ai/ {
            limit_req zone=ai burst=10 nodelay;
            proxy_pass http://ai-service;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Increase timeout for AI operations
            proxy_read_timeout 300s;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    log "Nginx configuration completed ✅"
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker images
    info "Removing unused Docker images..."
    docker image prune -f
    
    # Remove unused volumes
    info "Removing unused Docker volumes..."
    docker volume prune -f
    
    # Clean up old logs (keep last 7 days)
    info "Cleaning up old logs..."
    find logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clean up old backups (keep last 30 days)
    info "Cleaning up old backups..."
    find backups -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
    
    log "Cleanup completed ✅"
}

# Display deployment summary
show_summary() {
    log "🎉 Deployment completed successfully!"
    
    echo ""
    echo "📊 Service URLs:"
    echo "  Frontend:     http://localhost:3000"
    echo "  Main API:     http://localhost:3010"
    echo "  AI Service:   http://localhost:3001"
    echo "  Nginx:        http://localhost:80"
    echo ""
    echo "🔍 Monitoring:"
    echo "  Prometheus:   http://localhost:9090"
    echo "  Grafana:      http://localhost:3030 (admin/admin123)"
    echo ""
    echo "🏥 Health Checks:"
    echo "  Main Server:  http://localhost:3010/health"
    echo "  AI Service:   http://localhost:3001/api/ai/health"
    echo "  Detailed:     http://localhost:3001/api/ai/health/detailed"
    echo ""
    echo "📖 Documentation:"
    echo "  API Docs:     http://localhost:3001/api/docs"
    echo "  AI API Docs:  http://localhost:3001/ai-service/docs/API_DOCUMENTATION.md"
    echo ""
    echo "🐳 Docker Commands:"
    echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "  Restart:      docker-compose -f $COMPOSE_FILE restart [service]"
    echo "  Stop all:     docker-compose -f $COMPOSE_FILE down"
    echo ""
    echo "🔧 Useful Commands:"
    echo "  Check status: docker-compose -f $COMPOSE_FILE ps"
    echo "  View metrics: curl http://localhost:3001/api/ai/health/detailed"
    echo "  Run tests:    npm run test:integration"
}

# Main deployment flow
main() {
    log "Starting deployment for environment: $ENVIRONMENT"
    
    # Run deployment steps
    check_prerequisites
    backup_data
    setup_nginx
    setup_monitoring
    deploy_services
    
    # Wait for services to stabilize
    info "Waiting for services to stabilize..."
    sleep 30
    
    # Run health checks and tests
    if run_health_checks; then
        log "Health checks passed ✅"
    else
        error "Health checks failed ❌"
        exit 1
    fi
    
    if run_integration_tests; then
        log "Integration tests passed ✅"
    else
        warn "Some integration tests failed, but deployment continues"
    fi
    
    # Cleanup and show summary
    cleanup
    show_summary
    
    log "🚀 AI Features Integration deployment completed successfully!"
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
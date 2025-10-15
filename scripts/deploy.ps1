# AI Features Integration Deployment Script (PowerShell)
# This script deploys the complete AI-integrated plant monitoring system on Windows

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false
)

# Configuration
$ComposeFile = "docker-compose.ai.yml"
$EnvFile = ".env.$Environment"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Warning {
    param([string]$Message)
    Write-Log "WARNING: $Message" -Color "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-Log "ERROR: $Message" -Color "Red"
}

function Write-Info {
    param([string]$Message)
    Write-Log "INFO: $Message" -Color "Blue"
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
    
    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed or not in PATH"
        exit 1
    }
    
    # Check environment file
    if (-not (Test-Path $EnvFile)) {
        Write-Warning "Environment file $EnvFile not found, using default .env"
        $script:EnvFile = ".env"
    }
    
    # Check compose file
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Docker Compose file $ComposeFile not found"
        exit 1
    }
    
    Write-Log "Prerequisites check completed ✅"
}

# Backup existing data
function Backup-Data {
    if ($SkipBackup) {
        Write-Info "Skipping backup as requested"
        return
    }
    
    Write-Log "Creating backup of existing data..."
    
    $BackupDir = "backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup database if running
    $postgresRunning = docker-compose -f $ComposeFile ps postgresql | Select-String "Up"
    if ($postgresRunning) {
        Write-Info "Backing up PostgreSQL database..."
        docker-compose -f $ComposeFile exec -T postgresql pg_dump -U postgres plant_monitoring | Out-File -FilePath "$BackupDir\database.sql" -Encoding UTF8
    }
    
    # Backup uploads directory
    if (Test-Path "ai-service\uploads") {
        Write-Info "Backing up uploads directory..."
        Copy-Item -Path "ai-service\uploads" -Destination "$BackupDir\" -Recurse
    }
    
    # Backup logs
    if (Test-Path "logs") {
        Write-Info "Backing up logs..."
        Copy-Item -Path "logs" -Destination "$BackupDir\" -Recurse
    }
    
    Write-Log "Backup completed: $BackupDir ✅"
}

# Build and deploy services
function Deploy-Services {
    Write-Log "Building and deploying services..."
    
    # Load environment variables
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Pull latest images
    Write-Info "Pulling latest base images..."
    docker-compose -f $ComposeFile pull
    
    # Build custom images
    Write-Info "Building custom images..."
    docker-compose -f $ComposeFile build --no-cache
    
    # Stop existing services
    Write-Info "Stopping existing services..."
    docker-compose -f $ComposeFile down
    
    # Start infrastructure services first
    Write-Info "Starting infrastructure services..."
    docker-compose -f $ComposeFile up -d postgresql redis mosquitto
    
    # Wait for infrastructure to be ready
    Write-Info "Waiting for infrastructure services..."
    Start-Sleep -Seconds 30
    
    # Run database migrations
    Write-Info "Running database migrations..."
    docker-compose -f $ComposeFile run --rm ai-service node database/setup-ai-database.js
    
    # Start application services
    Write-Info "Starting application services..."
    docker-compose -f $ComposeFile up -d main-server ai-service frontend
    
    # Start monitoring services
    Write-Info "Starting monitoring services..."
    docker-compose -f $ComposeFile up -d nginx prometheus grafana
    
    Write-Log "Services deployment completed ✅"
}

# Health checks
function Test-HealthChecks {
    Write-Log "Running health checks..."
    
    # Wait for services to start
    Write-Info "Waiting for services to initialize..."
    Start-Sleep -Seconds 60
    
    $healthChecks = @()
    
    # Check main server
    Write-Info "Checking main server health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3010/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "Main server is healthy ✅"
            $healthChecks += $true
        } else {
            Write-Error "Main server health check failed ❌"
            $healthChecks += $false
        }
    } catch {
        Write-Error "Main server health check failed: $($_.Exception.Message) ❌"
        $healthChecks += $false
    }
    
    # Check AI service
    Write-Info "Checking AI service health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/ai/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "AI service is healthy ✅"
            $healthChecks += $true
        } else {
            Write-Error "AI service health check failed ❌"
            $healthChecks += $false
        }
    } catch {
        Write-Error "AI service health check failed: $($_.Exception.Message) ❌"
        $healthChecks += $false
    }
    
    # Check frontend
    Write-Info "Checking frontend health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "Frontend is healthy ✅"
            $healthChecks += $true
        } else {
            Write-Error "Frontend health check failed ❌"
            $healthChecks += $false
        }
    } catch {
        Write-Error "Frontend health check failed: $($_.Exception.Message) ❌"
        $healthChecks += $false
    }
    
    # Check database
    Write-Info "Checking database connection..."
    try {
        $dbCheck = docker-compose -f $ComposeFile exec -T postgresql pg_isready -U postgres
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database is healthy ✅"
            $healthChecks += $true
        } else {
            Write-Error "Database health check failed ❌"
            $healthChecks += $false
        }
    } catch {
        Write-Error "Database health check failed: $($_.Exception.Message) ❌"
        $healthChecks += $false
    }
    
    # Check Redis
    Write-Info "Checking Redis connection..."
    try {
        $redisCheck = docker-compose -f $ComposeFile exec -T redis redis-cli ping
        if ($redisCheck -match "PONG") {
            Write-Log "Redis is healthy ✅"
            $healthChecks += $true
        } else {
            Write-Error "Redis health check failed ❌"
            $healthChecks += $false
        }
    } catch {
        Write-Error "Redis health check failed: $($_.Exception.Message) ❌"
        $healthChecks += $false
    }
    
    # Check MQTT broker
    Write-Info "Checking MQTT broker..."
    try {
        $mqttCheck = docker-compose -f $ComposeFile exec -T mosquitto mosquitto_pub -h localhost -t test -m "health check"
        if ($LASTEXITCODE -eq 0) {
            Write-Log "MQTT broker is healthy ✅"
            $healthChecks += $true
        } else {
            Write-Error "MQTT broker health check failed ❌"
            $healthChecks += $false
        }
    } catch {
        Write-Error "MQTT broker health check failed: $($_.Exception.Message) ❌"
        $healthChecks += $false
    }
    
    $failedChecks = $healthChecks | Where-Object { $_ -eq $false }
    if ($failedChecks.Count -eq 0) {
        Write-Log "All health checks passed ✅"
        return $true
    } else {
        Write-Error "$($failedChecks.Count) health checks failed ❌"
        return $false
    }
}

# Run integration tests
function Invoke-IntegrationTests {
    if ($SkipTests) {
        Write-Info "Skipping tests as requested"
        return $true
    }
    
    Write-Log "Running integration tests..."
    
    $testResults = @()
    
    # Run comprehensive system tests
    Write-Info "Running comprehensive system tests..."
    try {
        $result = node tests/run-comprehensive-system-tests.js
        if ($LASTEXITCODE -eq 0) {
            Write-Log "System tests passed ✅"
            $testResults += $true
        } else {
            Write-Error "System tests failed ❌"
            $testResults += $false
        }
    } catch {
        Write-Error "System tests failed: $($_.Exception.Message) ❌"
        $testResults += $false
    }
    
    # Run AI-specific tests
    Write-Info "Running AI feature tests..."
    try {
        $result = node tests/run-ai-e2e-tests.js
        if ($LASTEXITCODE -eq 0) {
            Write-Log "AI tests passed ✅"
            $testResults += $true
        } else {
            Write-Error "AI tests failed ❌"
            $testResults += $false
        }
    } catch {
        Write-Error "AI tests failed: $($_.Exception.Message) ❌"
        $testResults += $false
    }
    
    # Run security tests
    Write-Info "Running security tests..."
    try {
        $result = node ai-service/run-security-tests.js
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Security tests passed ✅"
            $testResults += $true
        } else {
            Write-Error "Security tests failed ❌"
            $testResults += $false
        }
    } catch {
        Write-Error "Security tests failed: $($_.Exception.Message) ❌"
        $testResults += $false
    }
    
    $failedTests = $testResults | Where-Object { $_ -eq $false }
    if ($failedTests.Count -eq 0) {
        Write-Log "All integration tests passed ✅"
        return $true
    } else {
        Write-Warning "$($failedTests.Count) test suites failed, but deployment continues"
        return $false
    }
}

# Setup monitoring
function Initialize-Monitoring {
    Write-Log "Setting up monitoring and alerting..."
    
    # Create monitoring directories
    New-Item -ItemType Directory -Path "monitoring\prometheus" -Force | Out-Null
    New-Item -ItemType Directory -Path "monitoring\grafana\dashboards" -Force | Out-Null
    New-Item -ItemType Directory -Path "monitoring\grafana\datasources" -Force | Out-Null
    
    # Create Prometheus configuration
    $prometheusConfig = @"
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
"@
    
    $prometheusConfig | Out-File -FilePath "monitoring\prometheus\prometheus.yml" -Encoding UTF8
    
    # Create Grafana datasource configuration
    $grafanaDatasource = @"
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
"@
    
    $grafanaDatasource | Out-File -FilePath "monitoring\grafana\datasources\prometheus.yml" -Encoding UTF8
    
    Write-Log "Monitoring setup completed ✅"
}

# Setup nginx configuration
function Initialize-Nginx {
    Write-Log "Setting up Nginx reverse proxy..."
    
    New-Item -ItemType Directory -Path "nginx" -Force | Out-Null
    
    $nginxConfig = @"
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
    limit_req_zone `$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone `$binary_remote_addr zone=ai:10m rate=5r/s;
    
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
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }
        
        # Main API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://main-server;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }
        
        # AI Service API
        location /api/ai/ {
            limit_req zone=ai burst=10 nodelay;
            proxy_pass http://ai-service;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            
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
"@
    
    $nginxConfig | Out-File -FilePath "nginx\nginx.conf" -Encoding UTF8
    
    Write-Log "Nginx configuration completed ✅"
}

# Cleanup old resources
function Remove-OldResources {
    Write-Log "Cleaning up old resources..."
    
    # Remove unused Docker images
    Write-Info "Removing unused Docker images..."
    docker image prune -f
    
    # Remove unused volumes
    Write-Info "Removing unused Docker volumes..."
    docker volume prune -f
    
    # Clean up old logs (keep last 7 days)
    Write-Info "Cleaning up old logs..."
    if (Test-Path "logs") {
        Get-ChildItem -Path "logs" -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force
    }
    
    # Clean up old backups (keep last 30 days)
    Write-Info "Cleaning up old backups..."
    if (Test-Path "backups") {
        Get-ChildItem -Path "backups" -Directory | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force
    }
    
    Write-Log "Cleanup completed ✅"
}

# Display deployment summary
function Show-Summary {
    Write-Log "🎉 Deployment completed successfully!" -Color "Green"
    
    Write-Host ""
    Write-Host "📊 Service URLs:" -ForegroundColor "Blue"
    Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor "White"
    Write-Host "  Main API:     http://localhost:3010" -ForegroundColor "White"
    Write-Host "  AI Service:   http://localhost:3001" -ForegroundColor "White"
    Write-Host "  Nginx:        http://localhost:80" -ForegroundColor "White"
    Write-Host ""
    Write-Host "🔍 Monitoring:" -ForegroundColor "Blue"
    Write-Host "  Prometheus:   http://localhost:9090" -ForegroundColor "White"
    Write-Host "  Grafana:      http://localhost:3030 (admin/admin123)" -ForegroundColor "White"
    Write-Host ""
    Write-Host "🏥 Health Checks:" -ForegroundColor "Blue"
    Write-Host "  Main Server:  http://localhost:3010/health" -ForegroundColor "White"
    Write-Host "  AI Service:   http://localhost:3001/api/ai/health" -ForegroundColor "White"
    Write-Host "  Detailed:     http://localhost:3001/api/ai/health/detailed" -ForegroundColor "White"
    Write-Host ""
    Write-Host "📖 Documentation:" -ForegroundColor "Blue"
    Write-Host "  API Docs:     http://localhost:3001/api/docs" -ForegroundColor "White"
    Write-Host ""
    Write-Host "🐳 Docker Commands:" -ForegroundColor "Blue"
    Write-Host "  View logs:    docker-compose -f $ComposeFile logs -f [service]" -ForegroundColor "White"
    Write-Host "  Restart:      docker-compose -f $ComposeFile restart [service]" -ForegroundColor "White"
    Write-Host "  Stop all:     docker-compose -f $ComposeFile down" -ForegroundColor "White"
    Write-Host ""
    Write-Host "🔧 Useful Commands:" -ForegroundColor "Blue"
    Write-Host "  Check status: docker-compose -f $ComposeFile ps" -ForegroundColor "White"
    Write-Host "  View metrics: Invoke-WebRequest http://localhost:3001/api/ai/health/detailed" -ForegroundColor "White"
    Write-Host "  Run tests:    npm run test:integration" -ForegroundColor "White"
}

# Main deployment flow
function Start-Deployment {
    Write-Log "Starting deployment for environment: $Environment" -Color "Blue"
    
    try {
        # Run deployment steps
        Test-Prerequisites
        Backup-Data
        Initialize-Nginx
        Initialize-Monitoring
        Deploy-Services
        
        # Wait for services to stabilize
        Write-Info "Waiting for services to stabilize..."
        Start-Sleep -Seconds 30
        
        # Run health checks and tests
        if (Test-HealthChecks) {
            Write-Log "Health checks passed ✅"
        } else {
            Write-Error "Health checks failed ❌"
            exit 1
        }
        
        if (Invoke-IntegrationTests) {
            Write-Log "Integration tests passed ✅"
        } else {
            Write-Warning "Some integration tests failed, but deployment continues"
        }
        
        # Cleanup and show summary
        Remove-OldResources
        Show-Summary
        
        Write-Log "🚀 AI Features Integration deployment completed successfully!" -Color "Green"
        
    } catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Error "Stack trace: $($_.ScriptStackTrace)"
        exit 1
    }
}

# Handle script interruption
trap {
    Write-Error "Deployment interrupted"
    exit 1
}

# Run main function
Start-Deployment
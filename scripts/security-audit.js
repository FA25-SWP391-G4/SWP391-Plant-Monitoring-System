#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script for AI Features Integration
 * Performs security checks, vulnerability scanning, and compliance validation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class SecurityAudit {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      critical: 0,
      issues: []
    };
    this.startTime = Date.now();
  }

  async runAudit() {
    console.log('🔒 Starting comprehensive security audit...');
    console.log('=' .repeat(50));
    
    try {
      await this.checkEnvironmentSecurity();
      await this.checkDependencyVulnerabilities();
      await this.checkFilePermissions();
      await this.checkAPIEndpointSecurity();
      await this.checkDataProtection();
      await this.checkAuthenticationSecurity();
      await this.checkInputValidation();
      await this.checkLoggingSecurity();
      await this.checkDockerSecurity();
      await this.checkNetworkSecurity();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Security audit failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironmentSecurity() {
    console.log('\n🔍 Checking environment security...');
    
    // Check for sensitive data in environment files
    const envFiles = ['.env', '.env.production', '.env.development', 'ai-service/.env'];
    
    for (const envFile of envFiles) {
      try {
        const content = await fs.readFile(envFile, 'utf8');
        
        // Check for hardcoded secrets
        const sensitivePatterns = [
          { pattern: /password\s*=\s*[^$]/i, message: 'Hardcoded password found' },
          { pattern: /secret\s*=\s*[^$]/i, message: 'Hardcoded secret found' },
          { pattern: /key\s*=\s*[^$]/i, message: 'Hardcoded API key found' },
          { pattern: /token\s*=\s*[^$]/i, message: 'Hardcoded token found' }
        ];
        
        for (const { pattern, message } of sensitivePatterns) {
          if (pattern.test(content)) {
            this.addIssue('critical', `${envFile}: ${message}`, 'Use environment variables or secure vaults');
          }
        }
        
        // Check for proper variable naming
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (value && !value.startsWith('$') && (
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('key')
            )) {
              this.addIssue('warning', `${envFile}:${i+1}: Sensitive value not using environment variable`, 'Use ${VARIABLE_NAME} syntax');
            }
          }
        }
        
        this.addPass(`Environment file ${envFile} security check`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not read ${envFile}`, error.message);
        }
      }
    }
  }

  async checkDependencyVulnerabilities() {
    console.log('\n🔍 Checking dependency vulnerabilities...');
    
    const packageFiles = ['package.json', 'ai-service/package.json', 'client/package.json'];
    
    for (const packageFile of packageFiles) {
      try {
        await fs.access(packageFile);
        
        // Run npm audit
        try {
          const auditResult = execSync(`npm audit --json --prefix ${path.dirname(packageFile)}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          });
          
          const audit = JSON.parse(auditResult);
          
          if (audit.vulnerabilities) {
            const vulnCount = Object.keys(audit.vulnerabilities).length;
            if (vulnCount > 0) {
              const critical = Object.values(audit.vulnerabilities).filter(v => v.severity === 'critical').length;
              const high = Object.values(audit.vulnerabilities).filter(v => v.severity === 'high').length;
              
              if (critical > 0) {
                this.addIssue('critical', `${packageFile}: ${critical} critical vulnerabilities found`, 'Run npm audit fix');
              }
              if (high > 0) {
                this.addIssue('warning', `${packageFile}: ${high} high severity vulnerabilities found`, 'Run npm audit fix');
              }
            } else {
              this.addPass(`No vulnerabilities found in ${packageFile}`);
            }
          }
          
        } catch (auditError) {
          // npm audit returns non-zero exit code when vulnerabilities are found
          if (auditError.stdout) {
            try {
              const audit = JSON.parse(auditError.stdout);
              if (audit.metadata && audit.metadata.vulnerabilities) {
                const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
                if (critical > 0) {
                  this.addIssue('critical', `${packageFile}: ${critical} critical vulnerabilities`, 'Run npm audit fix');
                }
                if (high > 0) {
                  this.addIssue('warning', `${packageFile}: ${high} high vulnerabilities`, 'Run npm audit fix');
                }
                if (moderate > 0) {
                  this.addIssue('info', `${packageFile}: ${moderate} moderate vulnerabilities`, 'Consider running npm audit fix');
                }
              }
            } catch (parseError) {
              this.addIssue('warning', `Could not parse audit results for ${packageFile}`, 'Manual review required');
            }
          }
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check dependencies for ${packageFile}`, error.message);
        }
      }
    }
  }

  async checkFilePermissions() {
    console.log('\n🔍 Checking file permissions...');
    
    const sensitiveFiles = [
      '.env',
      '.env.production',
      'ai-service/.env',
      'config/production.env',
      'scripts/deploy.sh',
      'scripts/deploy.ps1'
    ];
    
    for (const file of sensitiveFiles) {
      try {
        const stats = await fs.stat(file);
        const mode = stats.mode & parseInt('777', 8);
        
        // Check if file is world-readable
        if (mode & parseInt('004', 8)) {
          this.addIssue('warning', `${file} is world-readable`, 'chmod 600 or 640');
        }
        
        // Check if file is world-writable
        if (mode & parseInt('002', 8)) {
          this.addIssue('critical', `${file} is world-writable`, 'chmod 600 or 640');
        }
        
        this.addPass(`File permissions for ${file} are secure`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check permissions for ${file}`, error.message);
        }
      }
    }
  }

  async checkAPIEndpointSecurity() {
    console.log('\n🔍 Checking API endpoint security...');
    
    // Check AI service endpoints
    const aiServiceFiles = [
      'ai-service/routes/chatbotRoutes.js',
      'ai-service/routes/diseaseRoutes.js',
      'ai-service/routes/irrigationRoutes.js',
      'ai-service/routes/healthRoutes.js'
    ];
    
    for (const file of aiServiceFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for authentication middleware
        if (!content.includes('authenticateToken') && !content.includes('authMiddleware')) {
          this.addIssue('warning', `${file}: No authentication middleware found`, 'Add authentication to protected endpoints');
        }
        
        // Check for rate limiting
        if (!content.includes('rateLimit') && !content.includes('rateLimiters')) {
          this.addIssue('warning', `${file}: No rate limiting found`, 'Add rate limiting middleware');
        }
        
        // Check for input validation
        if (!content.includes('validate') && !content.includes('sanitize')) {
          this.addIssue('warning', `${file}: No input validation found`, 'Add input validation middleware');
        }
        
        // Check for SQL injection protection
        if (content.includes('query(') && !content.includes('$1')) {
          this.addIssue('critical', `${file}: Potential SQL injection vulnerability`, 'Use parameterized queries');
        }
        
        this.addPass(`API security check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  async checkDataProtection() {
    console.log('\n🔍 Checking data protection measures...');
    
    // Check encryption implementation
    const dataProtectionFiles = [
      'ai-service/services/dataProtectionService.js',
      'ai-service/services/imageStorageService.js',
      'ai-service/middleware/privacyMiddleware.js'
    ];
    
    for (const file of dataProtectionFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for encryption
        if (!content.includes('encrypt') && !content.includes('crypto')) {
          this.addIssue('critical', `${file}: No encryption implementation found`, 'Implement data encryption');
        }
        
        // Check for secure random generation
        if (content.includes('Math.random()')) {
          this.addIssue('critical', `${file}: Insecure random number generation`, 'Use crypto.randomBytes()');
        }
        
        // Check for GDPR compliance
        if (!content.includes('gdpr') && !content.includes('privacy') && !content.includes('consent')) {
          this.addIssue('warning', `${file}: No GDPR compliance indicators`, 'Ensure GDPR compliance');
        }
        
        this.addPass(`Data protection check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  async checkAuthenticationSecurity() {
    console.log('\n🔍 Checking authentication security...');
    
    const authFiles = [
      'ai-service/middleware/securityMiddleware.js',
      'middlewares/authMiddleware.js',
      'controllers/authController.js'
    ];
    
    for (const file of authFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for JWT security
        if (content.includes('jwt') || content.includes('jsonwebtoken')) {
          if (!content.includes('expiresIn')) {
            this.addIssue('warning', `${file}: JWT tokens without expiration`, 'Set token expiration');
          }
          
          if (content.includes('HS256') && !content.includes('RS256')) {
            this.addIssue('info', `${file}: Using symmetric JWT signing`, 'Consider asymmetric signing (RS256)');
          }
        }
        
        // Check for password hashing
        if (content.includes('password') && !content.includes('bcrypt') && !content.includes('hash')) {
          this.addIssue('critical', `${file}: Passwords not properly hashed`, 'Use bcrypt for password hashing');
        }
        
        // Check for session security
        if (content.includes('session') && !content.includes('secure') && !content.includes('httpOnly')) {
          this.addIssue('warning', `${file}: Insecure session configuration`, 'Set secure and httpOnly flags');
        }
        
        this.addPass(`Authentication security check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  async checkInputValidation() {
    console.log('\n🔍 Checking input validation...');
    
    const controllerFiles = [
      'ai-service/controllers/chatbotController.js',
      'ai-service/controllers/diseaseDetectionController.js',
      'ai-service/controllers/irrigationPredictionController.js'
    ];
    
    for (const file of controllerFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for XSS protection
        if (!content.includes('sanitize') && !content.includes('escape')) {
          this.addIssue('warning', `${file}: No XSS protection found`, 'Sanitize user inputs');
        }
        
        // Check for file upload validation
        if (content.includes('multer') || content.includes('upload')) {
          if (!content.includes('fileFilter') && !content.includes('mimetype')) {
            this.addIssue('critical', `${file}: No file type validation`, 'Validate uploaded file types');
          }
          
          if (!content.includes('limits')) {
            this.addIssue('warning', `${file}: No file size limits`, 'Set file size limits');
          }
        }
        
        // Check for command injection protection
        if (content.includes('exec') || content.includes('spawn')) {
          this.addIssue('critical', `${file}: Potential command injection`, 'Avoid executing user input');
        }
        
        this.addPass(`Input validation check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  async checkLoggingSecurity() {
    console.log('\n🔍 Checking logging security...');
    
    const logFiles = [
      'ai-service/utils/errorHandler.js',
      'utils/logger.js'
    ];
    
    for (const file of logFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for sensitive data logging
        const sensitivePatterns = [
          'password',
          'secret',
          'token',
          'key',
          'authorization'
        ];
        
        for (const pattern of sensitivePatterns) {
          if (content.toLowerCase().includes(pattern) && content.includes('log')) {
            this.addIssue('warning', `${file}: Potential sensitive data logging`, 'Avoid logging sensitive information');
          }
        }
        
        // Check for log injection protection
        if (!content.includes('sanitize') && content.includes('user')) {
          this.addIssue('warning', `${file}: No log injection protection`, 'Sanitize user data before logging');
        }
        
        this.addPass(`Logging security check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  async checkDockerSecurity() {
    console.log('\n🔍 Checking Docker security...');
    
    const dockerFiles = [
      'Dockerfile',
      'ai-service/Dockerfile',
      'client/Dockerfile',
      'docker-compose.ai.yml'
    ];
    
    for (const file of dockerFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for root user
        if (content.includes('USER root') || !content.includes('USER ')) {
          this.addIssue('warning', `${file}: Running as root user`, 'Use non-root user');
        }
        
        // Check for secrets in build
        if (content.includes('ARG') && (
          content.includes('PASSWORD') ||
          content.includes('SECRET') ||
          content.includes('KEY')
        )) {
          this.addIssue('critical', `${file}: Secrets in build arguments`, 'Use Docker secrets or runtime environment variables');
        }
        
        // Check for latest tag usage
        if (content.includes(':latest')) {
          this.addIssue('info', `${file}: Using latest tag`, 'Pin specific versions for security');
        }
        
        this.addPass(`Docker security check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  async checkNetworkSecurity() {
    console.log('\n🔍 Checking network security...');
    
    // Check CORS configuration
    const corsFiles = [
      'ai-service/app.js',
      'app.js'
    ];
    
    for (const file of corsFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for wildcard CORS
        if (content.includes('origin: "*"') || content.includes("origin: '*'")) {
          this.addIssue('critical', `${file}: Wildcard CORS origin`, 'Specify allowed origins');
        }
        
        // Check for HTTPS enforcement
        if (!content.includes('https') && !content.includes('secure')) {
          this.addIssue('warning', `${file}: No HTTPS enforcement`, 'Enforce HTTPS in production');
        }
        
        // Check for security headers
        const securityHeaders = [
          'X-Frame-Options',
          'X-Content-Type-Options',
          'X-XSS-Protection',
          'Strict-Transport-Security'
        ];
        
        for (const header of securityHeaders) {
          if (!content.includes(header)) {
            this.addIssue('warning', `${file}: Missing ${header} header`, 'Add security headers');
          }
        }
        
        this.addPass(`Network security check for ${file}`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addIssue('warning', `Could not check ${file}`, error.message);
        }
      }
    }
  }

  addIssue(severity, description, recommendation) {
    this.results.issues.push({
      severity,
      description,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    if (severity === 'critical') {
      this.results.critical++;
      console.log(`🚨 CRITICAL: ${description}`);
    } else if (severity === 'warning') {
      this.results.warnings++;
      console.log(`⚠️  WARNING: ${description}`);
    } else {
      console.log(`ℹ️  INFO: ${description}`);
    }
    
    this.results.failed++;
  }

  addPass(description) {
    console.log(`✅ ${description}`);
    this.results.passed++;
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const total = this.results.passed + this.results.failed;
    
    console.log('\n' + '='.repeat(50));
    console.log('🔒 SECURITY AUDIT REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📊 Summary:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Total Checks: ${total}`);
    console.log(`  Passed: ${this.results.passed}`);
    console.log(`  Failed: ${this.results.failed}`);
    console.log(`  Critical Issues: ${this.results.critical}`);
    console.log(`  Warnings: ${this.results.warnings}`);
    
    if (this.results.critical > 0) {
      console.log(`\n🚨 CRITICAL ISSUES (${this.results.critical}):`);
      this.results.issues
        .filter(issue => issue.severity === 'critical')
        .forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue.description}`);
          console.log(`     Recommendation: ${issue.recommendation}`);
        });
    }
    
    if (this.results.warnings > 0) {
      console.log(`\n⚠️  WARNINGS (${this.results.warnings}):`);
      this.results.issues
        .filter(issue => issue.severity === 'warning')
        .forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue.description}`);
          console.log(`     Recommendation: ${issue.recommendation}`);
        });
    }
    
    // Generate detailed report file
    this.saveDetailedReport();
    
    // Determine overall security status
    if (this.results.critical > 0) {
      console.log('\n❌ SECURITY AUDIT FAILED - Critical issues found');
      process.exit(1);
    } else if (this.results.warnings > 5) {
      console.log('\n⚠️  SECURITY AUDIT PASSED WITH WARNINGS - Review recommended');
      process.exit(0);
    } else {
      console.log('\n✅ SECURITY AUDIT PASSED - System is secure');
      process.exit(0);
    }
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        critical: this.results.critical,
        warnings: this.results.warnings
      },
      issues: this.results.issues,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '..', 'reports', 'security-audit-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.critical > 0) {
      recommendations.push('Address all critical security issues immediately before deployment');
    }
    
    if (this.results.warnings > 0) {
      recommendations.push('Review and address security warnings to improve overall security posture');
    }
    
    recommendations.push('Regularly update dependencies to patch security vulnerabilities');
    recommendations.push('Implement automated security scanning in CI/CD pipeline');
    recommendations.push('Conduct regular penetration testing');
    recommendations.push('Monitor security logs and implement alerting');
    
    return recommendations;
  }
}

// Run audit if called directly
if (require.main === module) {
  const audit = new SecurityAudit();
  audit.runAudit().catch(console.error);
}

module.exports = SecurityAudit;
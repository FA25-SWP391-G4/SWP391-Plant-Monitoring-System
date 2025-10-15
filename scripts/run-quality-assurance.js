#!/usr/bin/env node

/**
 * Master Quality Assurance Script for AI Features Integration
 * Orchestrates all quality assurance checks and tests
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class QualityAssuranceRunner {
  constructor() {
    this.results = {
      securityAudit: null,
      performanceOptimization: null,
      userAcceptanceTesting: null,
      productionReadiness: null
    };
    
    this.startTime = Date.now();
  }

  async runQualityAssurance() {
    console.log('🎯 Starting Comprehensive Quality Assurance...');
    console.log('=' .repeat(70));
    console.log('This will run all quality assurance checks and tests:');
    console.log('  1. Security Audit');
    console.log('  2. Performance Optimization');
    console.log('  3. User Acceptance Testing');
    console.log('  4. Production Readiness Checklist');
    console.log('=' .repeat(70));
    
    try {
      await this.runSecurityAudit();
      await this.runPerformanceOptimization();
      await this.runUserAcceptanceTesting();
      await this.runProductionReadinessCheck();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Quality assurance failed:', error.message);
      process.exit(1);
    }
  }

  async runSecurityAudit() {
    console.log('\n🔒 Running Security Audit...');
    console.log('-'.repeat(50));
    
    try {
      const output = execSync('node scripts/security-audit.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.results.securityAudit = {
        status: 'passed',
        output: output
      };
      
      console.log('✅ Security audit completed successfully');
      
    } catch (error) {
      this.results.securityAudit = {
        status: 'failed',
        error: error.message,
        output: error.stdout || error.stderr
      };
      
      console.log('❌ Security audit failed');
      console.log('Error:', error.message);
      
      // Don't exit here, continue with other checks
    }
  }

  async runPerformanceOptimization() {
    console.log('\n⚡ Running Performance Optimization...');
    console.log('-'.repeat(50));
    
    try {
      const output = execSync('node scripts/performance-optimization.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.results.performanceOptimization = {
        status: 'passed',
        output: output
      };
      
      console.log('✅ Performance optimization completed successfully');
      
    } catch (error) {
      this.results.performanceOptimization = {
        status: 'failed',
        error: error.message,
        output: error.stdout || error.stderr
      };
      
      console.log('❌ Performance optimization failed');
      console.log('Error:', error.message);
    }
  }

  async runUserAcceptanceTesting() {
    console.log('\n🧪 Running User Acceptance Testing...');
    console.log('-'.repeat(50));
    
    try {
      const output = execSync('node scripts/user-acceptance-testing.js', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });
      
      this.results.userAcceptanceTesting = {
        status: 'passed',
        output: output
      };
      
      console.log('✅ User acceptance testing completed successfully');
      
    } catch (error) {
      this.results.userAcceptanceTesting = {
        status: 'failed',
        error: error.message,
        output: error.stdout || error.stderr
      };
      
      console.log('❌ User acceptance testing failed');
      console.log('Error:', error.message);
    }
  }

  async runProductionReadinessCheck() {
    console.log('\n📋 Running Production Readiness Checklist...');
    console.log('-'.repeat(50));
    
    try {
      const output = execSync('node scripts/production-readiness-checklist.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.results.productionReadiness = {
        status: 'passed',
        output: output
      };
      
      console.log('✅ Production readiness check completed successfully');
      
    } catch (error) {
      this.results.productionReadiness = {
        status: 'failed',
        error: error.message,
        output: error.stdout || error.stderr
      };
      
      console.log('❌ Production readiness check failed');
      console.log('Error:', error.message);
    }
  }

  generateFinalReport() {
    const duration = Date.now() - this.startTime;
    const durationMinutes = Math.round(duration / 60000);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 COMPREHENSIVE QUALITY ASSURANCE REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n⏱️  Execution Summary:`);
    console.log(`  Total Duration: ${durationMinutes} minutes`);
    console.log(`  Completed: ${new Date().toISOString()}`);
    
    console.log(`\n📊 Results Summary:`);
    
    // Security Audit
    const securityStatus = this.results.securityAudit?.status || 'not_run';
    console.log(`  🔒 Security Audit: ${this.getStatusIcon(securityStatus)} ${securityStatus.toUpperCase()}`);
    
    // Performance Optimization
    const performanceStatus = this.results.performanceOptimization?.status || 'not_run';
    console.log(`  ⚡ Performance Optimization: ${this.getStatusIcon(performanceStatus)} ${performanceStatus.toUpperCase()}`);
    
    // User Acceptance Testing
    const uatStatus = this.results.userAcceptanceTesting?.status || 'not_run';
    console.log(`  🧪 User Acceptance Testing: ${this.getStatusIcon(uatStatus)} ${uatStatus.toUpperCase()}`);
    
    // Production Readiness
    const readinessStatus = this.results.productionReadiness?.status || 'not_run';
    console.log(`  📋 Production Readiness: ${this.getStatusIcon(readinessStatus)} ${readinessStatus.toUpperCase()}`);
    
    // Overall assessment
    const allPassed = Object.values(this.results).every(result => result?.status === 'passed');
    const criticalFailed = this.results.securityAudit?.status === 'failed' || 
                          this.results.productionReadiness?.status === 'failed';
    
    console.log(`\n🎯 Overall Assessment:`);
    
    if (allPassed) {
      console.log(`  ✅ ALL CHECKS PASSED - System is ready for production deployment!`);
      console.log(`  🚀 Deployment can proceed with confidence`);
    } else if (criticalFailed) {
      console.log(`  ❌ CRITICAL ISSUES FOUND - System is NOT ready for production`);
      console.log(`  🛑 Address critical issues before deployment`);
    } else {
      console.log(`  ⚠️  SOME ISSUES FOUND - Review required before production`);
      console.log(`  🔍 Check individual reports for details`);
    }
    
    console.log(`\n📄 Detailed Reports:`);
    console.log(`  Security Audit: reports/security-audit-report.json`);
    console.log(`  Performance: reports/performance-optimization-report.json`);
    console.log(`  User Testing: reports/user-acceptance-test-report.json`);
    console.log(`  Readiness: reports/production-readiness-report.json`);
    
    console.log(`\n🔧 Next Steps:`);
    
    if (allPassed) {
      console.log(`  1. ✅ All quality checks passed`);
      console.log(`  2. 🚀 Deploy to production: ./scripts/deploy.sh production`);
      console.log(`  3. 📊 Monitor system performance and health`);
      console.log(`  4. 🔄 Schedule regular quality assurance reviews`);
    } else {
      console.log(`  1. 📋 Review failed checks and address issues`);
      console.log(`  2. 🔧 Re-run specific checks after fixes`);
      console.log(`  3. 🧪 Run full QA suite again: node scripts/run-quality-assurance.js`);
      console.log(`  4. 🚀 Deploy only after all critical issues are resolved`);
    }
    
    console.log(`\n📞 Support:`);
    console.log(`  - Check individual report files for detailed information`);
    console.log(`  - Review logs in the logs/ directory`);
    console.log(`  - Run individual scripts for focused troubleshooting`);
    
    // Save comprehensive report
    this.saveFinalReport();
    
    // Exit with appropriate code
    if (criticalFailed) {
      console.log('\n❌ Quality assurance failed - critical issues found');
      process.exit(1);
    } else if (allPassed) {
      console.log('\n✅ Quality assurance completed successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️  Quality assurance completed with warnings');
      process.exit(0);
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'not_run': return '⏸️';
      default: return '❓';
    }
  }

  async saveFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        securityAudit: this.results.securityAudit?.status || 'not_run',
        performanceOptimization: this.results.performanceOptimization?.status || 'not_run',
        userAcceptanceTesting: this.results.userAcceptanceTesting?.status || 'not_run',
        productionReadiness: this.results.productionReadiness?.status || 'not_run'
      },
      overallStatus: this.getOverallStatus(),
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '..', 'reports', 'comprehensive-qa-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);
  }

  getOverallStatus() {
    const allPassed = Object.values(this.results).every(result => result?.status === 'passed');
    const criticalFailed = this.results.securityAudit?.status === 'failed' || 
                          this.results.productionReadiness?.status === 'failed';
    
    if (allPassed) return 'ready_for_production';
    if (criticalFailed) return 'not_ready_critical_issues';
    return 'ready_with_warnings';
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.securityAudit?.status === 'failed') {
      recommendations.push('Address security vulnerabilities before production deployment');
    }
    
    if (this.results.performanceOptimization?.status === 'failed') {
      recommendations.push('Implement performance optimizations for better user experience');
    }
    
    if (this.results.userAcceptanceTesting?.status === 'failed') {
      recommendations.push('Fix failing user acceptance tests to ensure feature functionality');
    }
    
    if (this.results.productionReadiness?.status === 'failed') {
      recommendations.push('Complete production readiness requirements before deployment');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All quality checks passed - system is ready for production');
      recommendations.push('Set up monitoring and alerting for production environment');
      recommendations.push('Schedule regular quality assurance reviews');
    }
    
    return recommendations;
  }
}

// Run quality assurance if called directly
if (require.main === module) {
  const runner = new QualityAssuranceRunner();
  runner.runQualityAssurance().catch(console.error);
}

module.exports = QualityAssuranceRunner;
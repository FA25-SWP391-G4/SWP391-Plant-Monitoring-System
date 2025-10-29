/**
 * AI Test Runner
 * Comprehensive test runner for all AI system tests
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class AITestRunner {
    constructor() {
        this.testSuites = [
            {
                name: 'AI Integration Tests',
                file: 'ai-integration.test.js',
                description: 'End-to-end AI functionality tests',
                timeout: 120000 // 2 minutes
            },
            {
                name: 'AI Performance Tests',
                file: 'ai-performance.test.js',
                description: 'Performance benchmarks and response time tests',
                timeout: 180000 // 3 minutes
            },
            {
                name: 'AI Resilience Tests',
                file: 'ai-resilience.test.js',
                description: 'Error handling, fallbacks, and system stability tests',
                timeout: 240000 // 4 minutes
            }
        ];
        
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            suites: []
        };
    }

    /**
     * Run all AI test suites
     */
    async runAllTests() {
        console.log('🤖 Starting AI System Test Suite');
        console.log('=====================================\n');

        const startTime = Date.now();

        for (const suite of this.testSuites) {
            await this.runTestSuite(suite);
        }

        const totalTime = Date.now() - startTime;
        this.printSummary(totalTime);
        
        return this.results;
    }

    /**
     * Run a specific test suite
     */
    async runTestSuite(suite) {
        console.log(`📋 Running: ${suite.name}`);
        console.log(`   ${suite.description}`);
        console.log(`   Timeout: ${suite.timeout / 1000}s\n`);

        const suiteResult = {
            name: suite.name,
            file: suite.file,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            error: null
        };

        try {
            const startTime = Date.now();
            
            // Run the test suite
            const command = `npx jest ${suite.file} --verbose --testTimeout=${suite.timeout}`;
            const output = execSync(command, {
                cwd: path.dirname(__dirname),
                encoding: 'utf8',
                stdio: 'pipe'
            });

            suiteResult.duration = Date.now() - startTime;
            
            // Parse Jest output
            this.parseJestOutput(output, suiteResult);
            
            console.log(`✅ ${suite.name} completed successfully`);
            console.log(`   Duration: ${(suiteResult.duration / 1000).toFixed(2)}s`);
            console.log(`   Tests: ${suiteResult.passed} passed, ${suiteResult.failed} failed, ${suiteResult.skipped} skipped\n`);

        } catch (error) {
            suiteResult.duration = Date.now() - startTime;
            suiteResult.error = error.message;
            
            // Try to parse output even on failure
            if (error.stdout) {
                this.parseJestOutput(error.stdout, suiteResult);
            }
            
            console.log(`❌ ${suite.name} failed`);
            console.log(`   Error: ${error.message.split('\n')[0]}`);
            console.log(`   Duration: ${(suiteResult.duration / 1000).toFixed(2)}s\n`);
        }

        this.results.suites.push(suiteResult);
        this.results.total += suiteResult.passed + suiteResult.failed + suiteResult.skipped;
        this.results.passed += suiteResult.passed;
        this.results.failed += suiteResult.failed;
        this.results.skipped += suiteResult.skipped;
    }

    /**
     * Parse Jest output to extract test results
     */
    parseJestOutput(output, suiteResult) {
        const lines = output.split('\n');
        
        for (const line of lines) {
            // Look for test result summary
            if (line.includes('Tests:')) {
                const matches = line.match(/(\d+) passed|(\d+) failed|(\d+) skipped/g);
                if (matches) {
                    matches.forEach(match => {
                        const [count, status] = match.split(' ');
                        const num = parseInt(count);
                        
                        switch (status) {
                            case 'passed':
                                suiteResult.passed = num;
                                break;
                            case 'failed':
                                suiteResult.failed = num;
                                break;
                            case 'skipped':
                                suiteResult.skipped = num;
                                break;
                        }
                    });
                }
            }
        }
    }

    /**
     * Print test summary
     */
    printSummary(totalTime) {
        console.log('🏁 AI Test Suite Summary');
        console.log('========================\n');

        // Overall results
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️  Skipped: ${this.results.skipped}`);
        console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s\n`);

        // Suite breakdown
        console.log('Suite Breakdown:');
        console.log('----------------');
        
        this.results.suites.forEach(suite => {
            const status = suite.failed > 0 ? '❌' : '✅';
            const duration = (suite.duration / 1000).toFixed(2);
            
            console.log(`${status} ${suite.name}`);
            console.log(`   Duration: ${duration}s`);
            console.log(`   Results: ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`);
            
            if (suite.error) {
                console.log(`   Error: ${suite.error.split('\n')[0]}`);
            }
            console.log('');
        });

        // Success rate
        const successRate = this.results.total > 0 ? 
            ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
        
        console.log(`Success Rate: ${successRate}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All AI tests passed successfully!');
        } else {
            console.log(`\n⚠️  ${this.results.failed} test(s) failed. Please review the output above.`);
        }
    }

    /**
     * Run specific test suite by name
     */
    async runSpecificSuite(suiteName) {
        const suite = this.testSuites.find(s => 
            s.name.toLowerCase().includes(suiteName.toLowerCase()) ||
            s.file.includes(suiteName)
        );

        if (!suite) {
            console.log(`❌ Test suite '${suiteName}' not found.`);
            console.log('Available suites:');
            this.testSuites.forEach(s => console.log(`  - ${s.name} (${s.file})`));
            return;
        }

        console.log(`🎯 Running specific suite: ${suite.name}\n`);
        const startTime = Date.now();
        
        await this.runTestSuite(suite);
        
        const totalTime = Date.now() - startTime;
        console.log(`\n⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
    }

    /**
     * Generate test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                successRate: this.results.total > 0 ? 
                    ((this.results.passed / this.results.total) * 100).toFixed(1) : 0
            },
            suites: this.results.suites.map(suite => ({
                name: suite.name,
                file: suite.file,
                duration: suite.duration,
                results: {
                    passed: suite.passed,
                    failed: suite.failed,
                    skipped: suite.skipped
                },
                status: suite.failed > 0 ? 'failed' : 'passed',
                error: suite.error
            }))
        };

        const reportPath = path.join(__dirname, 'ai-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Test report saved to: ${reportPath}`);
        return report;
    }
}

// CLI interface
if (require.main === module) {
    const runner = new AITestRunner();
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Run specific suite
        runner.runSpecificSuite(args[0])
            .then(() => runner.generateReport())
            .catch(error => {
                console.error('❌ Test runner error:', error);
                process.exit(1);
            });
    } else {
        // Run all suites
        runner.runAllTests()
            .then(() => {
                const report = runner.generateReport();
                
                // Exit with error code if tests failed
                if (report.summary.failed > 0) {
                    process.exit(1);
                }
            })
            .catch(error => {
                console.error('❌ Test runner error:', error);
                process.exit(1);
            });
    }
}

module.exports = AITestRunner;
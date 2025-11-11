# run-i18n-tests.ps1 - Script to run all i18n-related tests and validation tools

# Colors for better output
$Green = @{ForegroundColor = "Green"}
$Red = @{ForegroundColor = "Red"}
$Blue = @{ForegroundColor = "Blue"}
$Yellow = @{ForegroundColor = "Yellow"}

Write-Host "===== Plant System i18n Tests Runner =====" @Blue
Write-Host "Running all i18n tests and validation tools..." @Blue
Write-Host ""

# Function to run tests and check results
function Run-Test {
    param(
        [string]$TestName,
        [string]$TestCommand
    )
    
    Write-Host "Running $TestName..." @Yellow
    
    try {
        Invoke-Expression $TestCommand | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $TestName passed!" @Green
            return $true
        } else {
            Write-Host "✗ $TestName failed! (Exit code: $LASTEXITCODE)" @Red
            return $false
        }
    } catch {
        Write-Host "✗ $TestName failed with error: $_" @Red
        return $false
    }
}

# Create a results array
$Results = @()
$Failed = @()

# 1. Run Jest i18n tests
Write-Host "== Running Jest i18n Tests ==" @Blue
if (Run-Test -TestName "i18n Validation Test" -TestCommand "npx jest i18n-validation.test.js --forceExit") {
    $Results += "i18n Validation Test: PASS"
} else {
    $Results += "i18n Validation Test: FAIL"
    $Failed += "i18n Validation Test"
}

if (Run-Test -TestName "i18n Comprehensive Test" -TestCommand "npx jest i18n-comprehensive.test.js --forceExit") {
    $Results += "i18n Comprehensive Test: PASS"
} else {
    $Results += "i18n Comprehensive Test: FAIL"
    $Failed += "i18n Comprehensive Test"
}

if (Run-Test -TestName "Zones i18n Test" -TestCommand "npx jest zones-i18n.test.js --forceExit") {
    $Results += "Zones i18n Test: PASS"
} else {
    $Results += "Zones i18n Test: FAIL"
    $Failed += "Zones i18n Test"
}

Write-Host ""
Write-Host "== Running i18n Analysis Tools ==" @Blue

# 2. Run i18n structure analyzer
if (Run-Test -TestName "i18n Structure Analyzer" -TestCommand "node scripts/i18n-structure-analyzer.js") {
    $Results += "i18n Structure Analyzer: PASS"
} else {
    $Results += "i18n Structure Analyzer: FAIL"
    $Failed += "i18n Structure Analyzer"
}

# 3. Run i18n integrity checker
if (Run-Test -TestName "i18n Integrity Checker" -TestCommand "node scripts/i18n-integrity-checker.js") {
    $Results += "i18n Integrity Checker: PASS"
} else {
    $Results += "i18n Integrity Checker: FAIL"
    $Failed += "i18n Integrity Checker"
}

Write-Host ""
Write-Host "===== TEST SUMMARY =====" @Blue
foreach ($result in $Results) {
    if ($result -like "*: PASS") {
        Write-Host "✓ $result" @Green
    } else {
        Write-Host "✗ $result" @Red
    }
}

Write-Host ""
if ($Failed.Count -eq 0) {
    Write-Host "All tests passed successfully!" @Green
    exit 0
} else {
    Write-Host "$($Failed.Count) tests failed: $($Failed -join ', ')" @Red
    exit 1
}
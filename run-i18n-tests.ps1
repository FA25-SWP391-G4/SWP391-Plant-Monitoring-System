Write-Host "===== Plant System i18n Tests Runner =====" -ForegroundColor Green
Write-Host "Running all i18n tests and validation tools..." -ForegroundColor Cyan

Write-Host ""
Write-Host "Running i18n-validation.test.js..." -ForegroundColor Yellow
npx jest i18n-validation.test.js --forceExit

Write-Host ""
Write-Host "Running i18n-comprehensive.test.js..." -ForegroundColor Yellow
npx jest i18n-comprehensive.test.js --forceExit

Write-Host ""
Write-Host "Running zones-i18n.test.js..." -ForegroundColor Yellow
npx jest zones-i18n.test.js --forceExit

Write-Host ""
Write-Host "Running structure analyzer..." -ForegroundColor Yellow
node scripts/i18n-structure-analyzer.js

Write-Host ""
Write-Host "Running integrity checker..." -ForegroundColor Yellow
node scripts/i18n-integrity-checker.js

Write-Host ""
Write-Host "===== All i18n tests completed =====" -ForegroundColor Green
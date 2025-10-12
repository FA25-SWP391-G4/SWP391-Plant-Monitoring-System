@echo off
echo ===== Plant System i18n Tests Runner =====
echo Running all i18n tests and validation tools...

echo.
echo Running i18n-validation.test.js...
call npx jest i18n-validation.test.js --forceExit

echo.
echo Running i18n-comprehensive.test.js...
call npx jest i18n-comprehensive.test.js --forceExit

echo.
echo Running zones-i18n.test.js...
call npx jest zones-i18n.test.js --forceExit

echo.
echo Running structure analyzer...
node scripts/i18n-structure-analyzer.js

echo.
echo Running integrity checker...
node scripts/i18n-integrity-checker.js

echo.
echo ===== All i18n tests completed =====
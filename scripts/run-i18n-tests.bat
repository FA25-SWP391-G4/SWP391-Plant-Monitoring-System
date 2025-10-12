@echo off
REM run-i18n-tests.bat - Windows batch script to run all i18n tests

echo ===== Plant System i18n Tests Runner =====
echo Running all i18n tests and validation tools...
echo.

echo == Running Jest i18n Tests ==
echo Running i18n Validation Test...
call npx jest i18n-validation.test.js --forceExit
echo.

echo Running i18n Comprehensive Test...
call npx jest i18n-comprehensive.test.js --forceExit
echo.

echo Running Zones i18n Test...
call npx jest zones-i18n.test.js --forceExit
echo.

echo == Running i18n Analysis Tools ==
echo Running i18n Structure Analyzer...
node scripts/i18n-structure-analyzer.js
echo.

echo Running i18n Integrity Checker...
node scripts/i18n-integrity-checker.js
echo.

echo ===== TEST COMPLETE =====
echo Check the output above to verify all tests passed.
echo.
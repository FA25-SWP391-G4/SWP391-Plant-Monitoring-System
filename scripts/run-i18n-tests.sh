#!/bin/bash
# run-i18n-tests.sh - Script to run all i18n-related tests and validation tools

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Plant System i18n Tests Runner =====${NC}"
echo -e "${BLUE}Running all i18n tests and validation tools...${NC}"
echo ""

# Function to run tests and check results
run_test() {
    TEST_NAME=$1
    TEST_CMD=$2
    
    echo -e "${YELLOW}Running $TEST_NAME...${NC}"
    if eval $TEST_CMD; then
        echo -e "${GREEN}✓ $TEST_NAME passed!${NC}"
        return 0
    else
        echo -e "${RED}✗ $TEST_NAME failed!${NC}"
        return 1
    fi
    echo ""
}

# Create a results array
declare -a RESULTS=()
declare -a FAILED=()

# 1. Run Jest i18n tests
echo -e "${BLUE}== Running Jest i18n Tests ==${NC}"
if run_test "i18n Validation Test" "npx jest i18n-validation.test.js --forceExit"; then
    RESULTS+=("i18n Validation Test: PASS")
else
    RESULTS+=("i18n Validation Test: FAIL")
    FAILED+=("i18n Validation Test")
fi

if run_test "i18n Comprehensive Test" "npx jest i18n-comprehensive.test.js --forceExit"; then
    RESULTS+=("i18n Comprehensive Test: PASS")
else
    RESULTS+=("i18n Comprehensive Test: FAIL")
    FAILED+=("i18n Comprehensive Test")
fi

if run_test "Zones i18n Test" "npx jest zones-i18n.test.js --forceExit"; then
    RESULTS+=("Zones i18n Test: PASS")
else
    RESULTS+=("Zones i18n Test: FAIL")
    FAILED+=("Zones i18n Test")
fi

echo ""
echo -e "${BLUE}== Running i18n Analysis Tools ==${NC}"

# 2. Run i18n structure analyzer
if run_test "i18n Structure Analyzer" "node scripts/i18n-structure-analyzer.js"; then
    RESULTS+=("i18n Structure Analyzer: PASS")
else
    RESULTS+=("i18n Structure Analyzer: FAIL")
    FAILED+=("i18n Structure Analyzer")
fi

# 3. Run i18n integrity checker
if run_test "i18n Integrity Checker" "node scripts/i18n-integrity-checker.js"; then
    RESULTS+=("i18n Integrity Checker: PASS")
else
    RESULTS+=("i18n Integrity Checker: FAIL")
    FAILED+=("i18n Integrity Checker")
fi

echo ""
echo -e "${BLUE}===== TEST SUMMARY =====${NC}"
for result in "${RESULTS[@]}"; do
    if [[ $result == *": PASS" ]]; then
        echo -e "${GREEN}✓ $result${NC}"
    else
        echo -e "${RED}✗ $result${NC}"
    fi
done

echo ""
if [ ${#FAILED[@]} -eq 0 ]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}${#FAILED[@]} tests failed: ${FAILED[*]}${NC}"
    exit 1
fi
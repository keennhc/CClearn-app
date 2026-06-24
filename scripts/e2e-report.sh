#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="e2e-results"
ALLURE_RESULTS="$REPORT_DIR/allure-results"
ALLURE_REPORT="$REPORT_DIR/allure-report"
JUNIT_FILE="$ALLURE_RESULTS/junit-results.xml"

rm -rf "$REPORT_DIR"
mkdir -p "$ALLURE_RESULTS"

echo "Running Maestro E2E tests..."
echo ""

maestro test \
  --format JUNIT \
  --output "$JUNIT_FILE" \
  .maestro/ \
  "$@" || true

if [ ! -f "$JUNIT_FILE" ]; then
  echo "No test results produced. Is the app running and a device/simulator available?"
  exit 1
fi

echo ""
echo "Generating Allure report..."

npx allure generate "$ALLURE_RESULTS" -o "$ALLURE_REPORT" --clean

echo ""
echo "Opening report in browser..."
npx allure open "$ALLURE_REPORT"

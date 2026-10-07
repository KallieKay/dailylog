#!/usr/bin/env bash
# Build both Lambda deployment packages (API + weekly report).
set -euo pipefail

cd "$(dirname "$0")"

# Shared production requirements for the API Lambda
PROD_REQS=$(mktemp)
cat > "$PROD_REQS" <<REQ
fastapi==0.115.0
mangum==0.18.0
boto3==1.35.0
pydantic==2.9.0
REQ

# ---------- API Lambda ----------
API_BUILD="../build/lambda"
rm -rf "$API_BUILD"
mkdir -p "$API_BUILD"

cp -r app "$API_BUILD/app"
cp handler.py "$API_BUILD/handler.py"
pip install -r "$PROD_REQS" -t "$API_BUILD" --upgrade --quiet
find "$API_BUILD" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$API_BUILD" -type f -name "*.pyc" -delete 2>/dev/null || true

# ---------- Report Lambda ----------
REPORT_BUILD="../build/report"
rm -rf "$REPORT_BUILD"
mkdir -p "$REPORT_BUILD"

cp report/app.py "$REPORT_BUILD/app.py"
cp report/handler.py "$REPORT_BUILD/handler.py"
pip install boto3==1.35.0 -t "$REPORT_BUILD" --upgrade --quiet
find "$REPORT_BUILD" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$REPORT_BUILD" -type f -name "*.pyc" -delete 2>/dev/null || true

rm -f "$PROD_REQS"

# Report
echo ""
echo "API build:    $API_BUILD  ($(du -sm "$API_BUILD" | cut -f1) MB)"
echo "Report build: $REPORT_BUILD  ($(du -sm "$REPORT_BUILD" | cut -f1) MB)"
#!/usr/bin/env bash
# Build the Lambda deployment package.
# Produces Linux wheels — safe to deploy to AWS Lambda.
set -euo pipefail

cd "$(dirname "$0")"

BUILD_DIR="../build/lambda"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cp -r app "$BUILD_DIR/app"
cp handler.py "$BUILD_DIR/handler.py"

cat > ../build/prod-requirements.txt <<REQ
fastapi==0.115.0
mangum==0.18.0
boto3==1.35.0
pydantic==2.9.0
REQ

pip install -r ../build/prod-requirements.txt -t "$BUILD_DIR" --upgrade --quiet

find "$BUILD_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$BUILD_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true

size=$(du -sm "$BUILD_DIR" | cut -f1)
echo ""
echo "Build complete: $BUILD_DIR"
echo "Total size: ${size} MB"
echo ""
ls "$BUILD_DIR"

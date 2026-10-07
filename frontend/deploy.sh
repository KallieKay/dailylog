#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

API_URL=$(cd ../terraform && terraform output -raw api_url)
BUCKET=$(cd ../terraform && terraform output -raw frontend_bucket)
DIST_ID=$(cd ../terraform && terraform output -raw frontend_distribution_id)
FRONTEND_URL=$(cd ../terraform && terraform output -raw frontend_url)

BUILD=../build/frontend
rm -rf "$BUILD"
mkdir -p "$BUILD"

cp index.html "$BUILD/index.html"
cp styles.css "$BUILD/styles.css"
API_URL_CLEAN="${API_URL%/}"
sed "s|%%API_URL%%|${API_URL_CLEAN}|g" app.js > "$BUILD/app.js"

# HTML: short cache (5 min) — so deploys are visible quickly
aws s3 sync "$BUILD" "s3://${BUCKET}/" --delete \
  --exclude "*" --include "*.html" \
  --cache-control "public, max-age=300"

# CSS/JS: long cache (1 year, immutable) — busted by ETag changes on deploy
aws s3 sync "$BUILD" "s3://${BUCKET}/" \
  --exclude "*" --include "*.css" --include "*.js" \
  --cache-control "public, max-age=31536000, immutable"

aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" > /dev/null

echo ""
echo "Deployed."
echo "Frontend: $FRONTEND_URL"
echo "API:      $API_URL_CLEAN"

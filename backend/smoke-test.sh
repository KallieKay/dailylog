#!/usr/bin/env bash
# Smoke test the deployed API: verify every endpoint works end-to-end.
set -uo pipefail

cd "$(dirname "$0")"

URL=$(cd ../terraform && terraform output -raw api_url)
if [ -z "$URL" ]; then
  echo "No API URL. Run terraform apply first." >&2
  exit 1
fi

echo "Testing $URL"
echo ""

TODAY=$(date +%Y-%m-%d)
PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "0" ]; then
    echo "PASS  $label"
    PASS=$((PASS+1))
  else
    echo "FAIL  $label"
    FAIL=$((FAIL+1))
  fi
}

# Health
curl -fsS "$URL/health" > /dev/null
check "/health" $?

# Subjects
SUBJ=$(curl -fsS -X POST "$URL/subjects" \
  -H "content-type: application/json" \
  -d "{\"name\":\"smoke-$(date +%s)\",\"goal_hours_per_week\":1}")
check "POST /subjects" $?
SUBJ_ID=$(echo "$SUBJ" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -fsS "$URL/subjects" | grep -q "$SUBJ_ID"
check "GET /subjects" $?

# Sessions
SESS=$(curl -fsS -X POST "$URL/sessions" \
  -H "content-type: application/json" \
  -d "{\"subject_id\":\"$SUBJ_ID\",\"duration_min\":1,\"notes\":\"smoke\"}")
check "POST /sessions" $?
SESS_ID=$(echo "$SESS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -fsS "$URL/sessions?from=$TODAY&to=$TODAY" | grep -q "$SESS_ID"
check "GET /sessions" $?

# Habits
HABIT=$(curl -fsS -X POST "$URL/habits" \
  -H "content-type: application/json" \
  -d "{\"name\":\"smoke-$(date +%s)\",\"icon\":\"ok\"}")
check "POST /habits" $?
HABIT_ID=$(echo "$HABIT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -fsS "$URL/habits" | grep -q "$HABIT_ID"
check "GET /habits" $?

# Check-ins
curl -fsS -X POST "$URL/checkins" \
  -H "content-type: application/json" \
  -d "{\"habit_id\":\"$HABIT_ID\",\"completed\":true}" > /dev/null
check "POST /checkins" $?

curl -fsS "$URL/checkins?date=$TODAY" | grep -q "$HABIT_ID"
check "GET /checkins" $?

echo ""
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
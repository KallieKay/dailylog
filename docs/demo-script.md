# Demo Video Script (3 minutes)

A walkthrough of Daily Log recorded as a screen capture. The script is written to be read aloud or used as a cue sheet.

## Setup before recording

- Open in browser tabs, in this order:
    1. `https://d2dde2jq1dcye.cloudfront.net` (the live app)
    2. `https://github.com/KallieKay/dailylog` (the repo)
    3. `https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=dailylog-dev` (the CloudWatch dashboard)
- Open a terminal at the repo root, ready to run `make smoke` if needed
- Close everything else: Slack, email, other browser windows
- Record with OBS or QuickTime at 1080p

## Segment 1 — The pitch (0:00–0:20)

**On screen:** The live app, showing the Subjects, Sessions, Habits, and Summary sections.

**Narration:**

> "Daily Log is a personal study and habit tracker. You log study sessions, check off daily habits, and get a weekly email summarizing both. It runs entirely on AWS serverless primitives — no servers, no containers. Everything is defined in Terraform and deployed through GitHub Actions."

**Action:** click **Add Subject**, type "Math", click **Add**.

## Segment 2 — Using the app (0:20–0:50)

**Action:** Log a study session.

- Subject: Math
- Minutes: 45
- Notes: "Chapter 3"

Click **Log**. Watch it appear in "Today's Sessions."

**Narration:**

> "Every action hits a FastAPI backend running on Lambda, behind API Gateway. The frontend is served from a private S3 bucket through CloudFront — the bucket only accepts reads from that specific distribution."

**Action:** Add a habit. Check it off.

**Narration:**

> "The data model is a single DynamoDB table. Each item's sort key encodes its type — `SESSION#`, `HABIT#`, `CHECKIN#` — so every access pattern is a single-partition query with no secondary indexes."

## Segment 3 — The weekly email (0:50–1:15)

**Action:** Switch to a terminal, invoke the report Lambda manually.

```bash
aws lambda invoke \
  --function-name dailylog-dev-report \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/report-response.json
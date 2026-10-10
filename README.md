# Daily Log

A serverless study and habit tracker built entirely on AWS, deployed with Terraform, and observed with CloudWatch.

> **Status:** Work in progress — Day 3 of 10. The API and database are deployed and tested end-to-end; frontend pending.

### What works today
- All 9 API endpoints deployed and verified against live AWS infrastructure
- Full round-trip confirmed: API Gateway → Lambda → FastAPI → DynamoDB → back
- 6 automated tests passing (subjects, sessions, habits, check-ins, upsert logic) with moto-mocked DynamoDB

### Project log
| Day | Goal | Status |
|-----|------|--------|
| 1 | Deploy API + DynamoDB with Terraform | ✅ Done |
| 2 | Verify all endpoints, full test coverage, clean repo | ✅ Done |
| 3 | Frontend on S3 + CloudFront with OAC; CORS preflight fixed | ✅ Done |
| 4 | Habits UI, check-in toggles, weekly summary with habit completion | ✅ Done |
| 5 | Weekly report Lambda + EventBridge cron + SES email | ✅ Done |
| 6 | CloudFront cache tuning: short cache for HTML, immutable for assets, security headers, TLS 1.2 | ✅ Done|
| 4–10 | EventBridge report, SES, CloudWatch, CI/CD, load test, write-up | ⏳ Pending |

---

## What it does

Daily Log is a personal tracker with two things you can log:

- **Study sessions** — subject, duration, notes, timestamp
- **Daily habits** — sleep, exercise, water, whatever you choose — a tap-to-check list

Every Sunday morning, a scheduled job emails a summary: total study hours broken down by subject, and habit completion rate for the week.

It's a small app on purpose. The point of the project is the cloud architecture underneath it.

---

## Why this project exists

I'm applying to a **cloud computing elective** and wanted a project that demonstrates real cloud engineering, not just "a web app that happens to run on AWS."

That meant:

- Infrastructure as Code, not console clicking
- Event-driven architecture, not synchronous everything
- Observability from day one, not bolted on later
- A cost model I can defend, not hand-waving
- A production-shaped deployment pipeline

The app is deliberately simple so the cloud layer can be the subject of the work.

---
## Architecture
┌──────────────────────┐
│ Static frontend │
│ S3 + CloudFront │ (Day 6)
└──────────┬───────────┘
│
▼
┌──────────────────────┐
│ API Gateway (HTTP) │
└──────────┬───────────┘
│
▼
┌──────────────────────┐
│ Lambda (FastAPI + │
│ Mangum) │
└──────────┬───────────┘
│
▼
┌──────────────────────┐
│ DynamoDB │
│ (single table) │
└──────────┬───────────┘
│
▼
┌──────────────────────────────────────┐
│ EventBridge (Sun 08:00 cron) │ (Day 5)
│ │ │
│ ▼ │
│ Lambda (report generator) │
│ │ │
│ ▼ │
│ SES (weekly email) │
└──────────────────────────────────────┘
*(Architecture diagram placeholder — replace with Excalidraw export on Day 10.)*

---

## Weekly Report

Every Sunday at 08:00 UTC, an EventBridge rule invokes a dedicated Lambda that:

1. Queries the last 7 days of study sessions and habit check-ins from DynamoDB
2. Renders an HTML email with study totals per subject and habit completion rates
3. Sends the email via SES

This is a separate Lambda from the API — same codebase, different function, scoped IAM role. It only needs DynamoDB read + SES send, nothing else.

Test it manually:

    aws lambda invoke \
      --function-name dailylog-dev-report \
      --payload '{}' \
      --cli-binary-format raw-in-base64-out \
      /tmp/report-response.json

## Frontend caching and security

CloudFront uses two cache strategies:

- **`index.html` and `/`** — 5-minute cache so deploys are visible quickly
- **CSS/JS assets** — 1-year immutable cache, busted by S3 ETag changes on deploy

Security posture:

- HSTS enabled with `includeSubDomains` and `preload` (1 year)
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `Referrer-Policy: strict-origin-when-cross-origin`
- TLS 1.2 minimum enforced at the edge

Headers are attached via a CloudFront response headers policy on **all three cache behaviors** (the two ordered HTML behaviors and the default asset behavior). Attaching to only the default is a common footgun — ordered behaviors override the default, so the HTML was initially served without the headers.

Verify with:

    URL=$(terraform output -raw frontend_url)
    curl -sI "$URL/?v=$(date +%s)" | grep -iE 'strict-transport|x-content-type|x-frame|referrer'

## Observability

Operational visibility lives in CloudWatch and X-Ray.

**Dashboard:** `${var.project}-${var.stage}` in the CloudWatch console shows:

- API Lambda invocations, errors, p50/p95/p99 duration
- Report Lambda invocations and errors
- DynamoDB consumed read/write capacity
- API Gateway request and 5xx counts

**Alarms:** two CloudWatch alarms push to an SNS topic that emails the project owner.

- `dailylog-dev-api-5xx` — API Gateway 5xx count > 1 for 5 minutes
- `dailylog-dev-report-errors` — report Lambda error count > 0

Both fire on ALARM and recover on OK.

**Structured logging:** the API Lambda emits one JSON line per request:

    {"request_id": "...", "method": "POST", "path": "/subjects", "status": 201, "duration_ms": 45.3}

Query recent 5xx errors in CloudWatch Logs Insights:

    fields @timestamp, request_id, method, path, status, duration_ms
    | filter status >= 500
    | sort @timestamp desc
    | limit 50

Query the slowest requests:

    fields @timestamp, method, path, duration_ms
    | filter duration_ms > 500
    | sort duration_ms desc
    | limit 20

**Tracing:** AWS X-Ray is enabled on both Lambdas. Traces include DynamoDB queries and SES calls made by the report function.

    aws xray get-trace-summaries \
      --start-time $(date -u -d '5 minutes ago' +%s) \
      --end-time $(date -u +%s) \
      --query 'TraceSummaries[0:5].[Id,Duration,Http.HttpStatus]' \
      --output table

## Stack

| Layer | Technology | Why |
|---|---|---|
| Compute | AWS Lambda (Python 3.12) | Pay-per-request, zero idle cost, fits the free tier |
| API | API Gateway (HTTP API) | Cheaper than REST API, simpler |
| Framework | FastAPI + Mangum | Familiar locally, Lambda-compatible in production |
| Storage | DynamoDB (single table, on-demand) | Free tier, no capacity planning, clean access patterns |
| Scheduling | EventBridge | Managed cron, no servers |
| Email | Amazon SES | Cheap, reliable, free tier covers this many times over |
| CDN | CloudFront | Global edge caching for the frontend |
| IaC | Terraform | Everything is declared, nothing is clicked |
| CI/CD | GitHub Actions (OIDC) | No long-lived AWS keys in the repo |
| Observability | CloudWatch + X-Ray | Logs, metrics, traces, alarms |
| Load testing | k6 | Real numbers, not vibes |

---
## Repository layout
dailylog/
├── backend/
│ ├── app/
│ │ ├── main.py # FastAPI routes
│ │ ├── db.py # DynamoDB access patterns
│ │ ├── models.py # Pydantic models
│ │ └── config.py # env config
│ ├── tests/ # pytest, moto-mocked DynamoDB
│ ├── handler.py # Lambda entrypoint (Mangum)
│ ├── requirements.txt
│ └── build.ps1 # packages the Lambda zip
├── frontend/
│ └── index.html # (Day 3)
├── terraform/
│ ├── main.tf
│ ├── variables.tf
│ ├── dynamodb.tf
│ ├── lambda.tf
│ ├── apigateway.tf
│ ├── iam.tf
│ ├── s3.tf # (Day 3)
│ ├── cloudfront.tf # (Day 6)
│ ├── eventbridge.tf # (Day 5)
│ └── outputs.tf
└── .github/workflows/ # (Day 8)


---

## Data model

Single DynamoDB table, `PK = USER#me` for all items (single-user v1).

| Entity | PK | SK | Notes |
|---|---|---|---|
| Subject | `USER#me` | `SUBJECT#<id>` | name, color, goal hours/week |
| Study session | `USER#me` | `SESSION#<date>#<id>` | subject_id, duration, notes |
| Habit | `USER#me` | `HABIT#<id>` | name, icon, active |
| Check-in | `USER#me` | `CHECKIN#<date>#<habitId>` | completed |

**Access patterns:**
- List subjects → `begins_with(SK, "SUBJECT#")`
- Sessions in range → `SK BETWEEN "SESSION#<from>" AND "SESSION#<to>#zzzz"`
- Today's check-ins → `begins_with(SK, "CHECKIN#<today>")`

No GSIs, no scans. Every read is a single `query`.

---

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/subjects` | List subjects |
| `POST` | `/subjects` | Create subject |
| `GET` | `/sessions?from=&to=` | List sessions in range |
| `POST` | `/sessions` | Log a session |
| `GET` | `/habits` | List habits |
| `POST` | `/habits` | Create habit |
| `GET` | `/checkins?date=` | List check-ins for a day |
| `POST` | `/checkins` | Toggle a check-in |

---

## Running locally

**Prerequisites:** Python 3.12+, Terraform 1.6+, AWS CLI configured, an AWS account.

```powershell
# Backend: install and test
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -v

# Build the Lambda package
.\build.ps1

# Deploy
cd ..\terraform
terraform init
terraform plan
terraform apply


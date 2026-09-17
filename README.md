# Daily Log

A serverless study and habit tracker built entirely on AWS, deployed with Terraform, and observed with CloudWatch.

> **Status:** Work in progress — Day 2 of 10. The API and database are deployed; the frontend, weekly report job, and CI/CD are pending.

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
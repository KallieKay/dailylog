# Load Test Results

## Scenario

k6 runs a mixed workload against the deployed API:

| Step | Request |
|---|---|
| 1 | `GET /health` |
| 2 | `GET /subjects` |
| 3 | `POST /sessions` (only if a subject exists) |
| 4 | `GET /sessions?from=&to=` |

**Load profile:** 30s ramp to 8 virtual users, 2m hold, 30s ramp down. Total ~3 minutes.

**Command:** `make load`

## Environment

- **API:** https://lcvoutxijl.execute-api.us-east-1.amazonaws.com
- **Region:** us-east-1
- **Lambda:** 512 MB, python3.12, no provisioned concurrency
- **DynamoDB:** on-demand, single table
- **Client:** developer laptop on a home network

## The concurrency ceiling we discovered

The first two k6 runs (20 VUs) produced a suspicious latency distribution:

| Metric | Run 1 (20 VUs) | Run 2 (20 VUs) |
|---|---|---|
| Median latency | 286ms | 286ms |
| p(95) | 2.79s | 5.8s |
| Max | 8.48s | 18.9s |
| Errors | 0 | 1 |
| Throughput | 22 req/s | 12.8 req/s |

Same median, wildly different tail. That pattern points to throttling, not application slowness.

`aws lambda get-account-settings` confirmed the cause:

```json
{
  "AccountLimit": {
    "ConcurrentExecutions": 10,
    "UnreservedConcurrentExecutions": 10
  }
}
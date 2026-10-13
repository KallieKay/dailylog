# Cost Model

What Daily Log costs at 1, 100, 10,000, and 100,000 users.

## Assumptions

Each user:

- Logs 3 study sessions per day → ~90/month
- Checks 4 habits per day → ~120/month
- Opens the app 5 times per day → 150 `GET` requests/month
- Receives one weekly report email → 4 emails/month

**Monthly volume per user:**

| Endpoint | Calls/user/month |
|---|---|
| `POST /sessions` | 90 |
| `GET /sessions` | 150 |
| `POST /checkins` | 120 |
| `GET /checkins` | 150 |
| `GET /subjects` | 150 |
| `GET /habits` | 150 |
| **Total API Gateway requests** | **810** |
| **Lambda invocations** | **810** |
| **DynamoDB read/write ops** | **~2,000** |
| **SES emails (weekly report)** | **4** |

## AWS Free Tier (Always Free)

| Service | Free allowance |
|---|---|
| Lambda | 1M requests + 400,000 GB-seconds/month |
| API Gateway (HTTP) | 1M requests/month (12-month intro) |
| DynamoDB | 25 GB storage + 25 WCU/RCU |
| S3 | 5 GB storage + 20k GET + 2k PUT/month |
| CloudFront | 1 TB transfer + 10M requests/month |
| SES | 3,000 message charges/month |
| CloudWatch Logs | 5 GB ingestion + 5 GB storage |

## Cost at 1 user

Everything fits in the free tier. **$0/month.**

## Cost at 100 users

| Resource | Usage | Free? | Cost |
|---|---|---|---|
| Lambda | 81,000 invocations × ~100ms × 512MB = ~4,150 GB-s | ✅ under 400k | $0 |
| API Gateway | 81,000 requests | ✅ under 1M | $0 |
| DynamoDB | ~200,000 RCU/WU ops, well under 25 provisioned | ✅ | $0 |
| S3 | < 1 GB frontend assets | ✅ | $0 |
| CloudFront | < 1 GB transfer | ✅ | $0 |
| SES | 400 emails | ✅ under 3k | $0 |
| CloudWatch | < 200 MB logs | ✅ | $0 |
| **Total** | | | **$0/month** |

## Cost at 10,000 users

| Resource | Usage | Free tier? | Cost |
|---|---|---|---|
| Lambda | 8.1M invocations × 100ms × 512MB = ~415,000 GB-s | ❌ over 400k GB-s | ~$0.05 |
| Lambda requests | 8.1M | ❌ over 1M | ~$0.10 |
| API Gateway | 8.1M requests | ❌ over 1M | ~$8.10 |
| DynamoDB | ~20M ops on-demand | on-demand pricing | ~$12 |
| CloudFront | ~50 GB transfer | ✅ under 1 TB | $0 |
| SES | 40,000 emails | ❌ over 3k | ~$3.70 |
| CloudWatch Logs | ~15 GB | ❌ over 5 GB | ~$7.50 |
| S3 | < 2 GB | ✅ | $0 |
| **Total** | | | **~$32/month** |

## Cost at 100,000 users

| Resource | Usage | Cost |
|---|---|---|
| Lambda | 81M invocations × 100ms = 4.15M GB-s | ~$0.55 |
| API Gateway | 81M requests | ~$81 |
| DynamoDB | 200M ops on-demand + storage growth | ~$120 |
| CloudFront | ~500 GB transfer | ~$42 |
| SES | 400,000 emails | ~$40 |
| CloudWatch Logs | ~150 GB | ~$75 |
| **Total** | | **~$360/month** |

At this scale you'd switch DynamoDB to provisioned + autoscaling and add a CloudWatch Logs retention policy. That alone could cut $100/month.

## Where the money goes

At every scale above free tier, the **top three** cost drivers are:

1. **DynamoDB operations** — on-demand pricing adds up fast at scale
2. **CloudWatch Logs** — structured logging is great until you see the ingestion bill
3. **API Gateway** — $1/million requests after the free tier

Lambda compute itself is almost free at any realistic personal scale.

## Reducing cost at scale

- **Switch DynamoDB to provisioned capacity** with autoscaling → ~50% cheaper at high volume
- **Set a CloudWatch Logs retention policy** (currently defaults to "never expire") → saves GB-months
- **Aggregate logs before writing** (batch 10 requests per log line) → less ingestion
- **Cache `GET /subjects` and `GET /habits`** at the CloudFront or API Gateway layer → fewer Lambda invocations
- **Move static assets to a cheaper CDN** (e.g., Cloudflare free tier) → eliminates CloudFront transfer cost

## Current actual cost

The project runs inside the free tier. The billing alarm is set to $1; it has never fired.
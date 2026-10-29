# Daily Flow - Terraform AWS Infrastructure as Code (IaC)

**Project Identifier**: `WTC-DPY46VVK`

This directory contains the complete Infrastructure as Code (IaC) definitions using **Terraform** to provision the cloud architecture on **Amazon Web Services (AWS)**.

## Architecture Provisioned

1. **Authentication (AWS Cognito)**:
   - User Pool with email verification and password policies.
   - App Client supporting OAuth 2.0 flows (Google federation ready).

2. **Serverless Database (AWS DynamoDB)**:
   - `users`: User profiles and study bios.
   - `subjects`: User subjects and weekly hour goals.
   - `sessions`: Logged study sessions with `DateIndex` GSI.
   - `habits`: Daily tracked habits and tags.
   - `checkins`: Habit completion logs per date.
   - `posts`: Community circle photos, video reels, and study documents.
   - `active_sessions`: Real-time live presence for the "Members in Study" room with automatic TTL expiration.

3. **Media Storage (Amazon S3)**:
   - Dedicated S3 bucket with CORS configuration for direct upload of study photos, reels, and PDF lecture notes.
   - Public access blocks ensuring least-privilege security.

4. **Serverless Compute & API Gateway**:
   - HTTP API Gateway v2 for serverless REST endpoints.
   - IAM Execution Role with scoped least-privilege DynamoDB policies for AWS Lambda compute.

## How to Initialize & Plan

1. **Install Terraform** (`>= 1.0.0`) and configure AWS credentials:
   ```bash
   aws configure
   ```

2. **Initialize Terraform working directory**:
   ```bash
   cd terraform
   terraform init
   ```

3. **Review the execution plan**:
   ```bash
   terraform plan
   ```

4. **Apply infrastructure (when deploying to AWS)**:
   ```bash
   terraform apply
   ```

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

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
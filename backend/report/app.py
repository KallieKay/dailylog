"""Weekly report generator.

Triggered by EventBridge every Sunday at 08:00 UTC. Queries the last 7 days
of study sessions and check-ins, formats an HTML email, and sends it via SES.
"""

import os
import logging
from datetime import date, timedelta

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ.get("TABLE_NAME", "dailylog-dev")
RECIPIENT = os.environ.get("REPORT_RECIPIENT")
SENDER = os.environ.get("REPORT_SENDER")
REGION = os.environ.get("AWS_REGION", "us-east-1")
USER_ID = "USER#me"

dynamodb = boto3.resource("dynamodb", region_name=REGION)
ses = boto3.client("ses", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def _last_7_days():
    """Return (from_date, to_date) as ISO strings, inclusive of today."""
    today = date.today()
    start = today - timedelta(days=6)
    return start.isoformat(), today.isoformat()


def _query_between(prefix: str, from_date: str, to_date: str) -> list[dict]:
    """Query items with SK in [prefix#from, prefix#to#zzzz]."""
    resp = table.query(
        KeyConditionExpression="PK = :pk AND SK BETWEEN :a AND :b",
        ExpressionAttributeValues={
            ":pk": USER_ID,
            ":a": f"{prefix}#{from_date}",
            ":b": f"{prefix}#{to_date}#zzzz",
        },
    )
    return resp["Items"]


def _list_subjects() -> dict[str, str]:
    """Return {subject_id: name}."""
    resp = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": USER_ID, ":sk": "SUBJECT#"},
    )
    return {i["id"]: i["name"] for i in resp["Items"]}


def _list_habits() -> dict[str, str]:
    """Return {habit_id: label}."""
    resp = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": USER_ID, ":sk": "HABIT#"},
    )
    return {i["id"]: (i.get("icon", "") + " " + i["name"]).strip() for i in resp["Items"]}


def generate_report() -> str:
    from_date, to_date = _last_7_days()
    logger.info("Report range: %s to %s", from_date, to_date)

    subjects = _list_subjects()
    habits = _list_habits()

    # Study totals
    sessions = _query_between("SESSION", from_date, to_date)
    study_totals: dict[str, int] = {}
    for s in sessions:
        name = subjects.get(s["subject_id"], "Unknown")
        study_totals[name] = study_totals.get(name, 0) + int(s["duration_min"])

    # Habit check-ins per habit
    checkins = _query_between("CHECKIN", from_date, to_date)
    habit_counts: dict[str, int] = {hid: 0 for hid in habits}
    for c in checkins:
        if c.get("completed") and c["habit_id"] in habit_counts:
            habit_counts[c["habit_id"]] += 1

    # Build HTML
    study_rows = "".join(
        f"<tr><td>{name}</td><td style='text-align:right'>{mins / 60:.1f}h</td></tr>"
        for name, mins in sorted(study_totals.items(), key=lambda x: -x[1])
    ) or "<tr><td colspan='2'><em>No study sessions logged.</em></td></tr>"

    habit_rows = "".join(
        f"<tr><td>{label}</td><td style='text-align:right'>{habit_counts[hid]}/7</td></tr>"
        for hid, label in habits.items()
    ) or "<tr><td colspan='2'><em>No habits defined.</em></td></tr>"

    total_min = sum(study_totals.values())

    return f"""
    <html>
      <body style="font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
        <h1 style="font-size: 1.5rem;">Daily Log — Weekly Report</h1>
        <p style="color: #64748b;">{from_date} to {to_date}</p>

        <h2 style="font-size: 0.9rem; text-transform: uppercase; color: #64748b; margin-top: 2rem;">Study</h2>
        <p style="font-size: 1.1rem;"><strong>{total_min / 60:.1f} hours</strong> total</p>
        <table style="width: 100%; border-collapse: collapse;">
          {study_rows}
        </table>

        <h2 style="font-size: 0.9rem; text-transform: uppercase; color: #64748b; margin-top: 2rem;">Habits</h2>
        <table style="width: 100%; border-collapse: collapse;">
          {habit_rows}
        </table>

        <p style="color: #64748b; font-size: 0.85rem; margin-top: 2rem;">
          Sent by Daily Log.
        </p>
      </body>
    </html>
    """


def send_report(html_body: str) -> None:
    if not RECIPIENT or not SENDER:
        raise RuntimeError("REPORT_RECIPIENT and REPORT_SENDER must be set")
    ses.send_email(
        Source=SENDER,
        Destination={"ToAddresses": [RECIPIENT]},
        Message={
            "Subject": {"Data": "Daily Log — Weekly Report"},
            "Body": {"Html": {"Data": html_body}},
        },
    )
    logger.info("Report sent to %s", RECIPIENT)


def run() -> None:
    logger.info("Generating weekly report")
    html = generate_report()
    send_report(html)
    logger.info("Done")
"""Weekly report generator.

Triggered by EventBridge every Sunday at 08:00 UTC. Queries the last 7 days
of study sessions and check-ins, formats an HTML email, and sends it via SES.
"""

import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ.get("TABLE_NAME", "dailylog-dev")
RECIPIENT = os.environ.get("REPORT_RECIPIENT")
SENDER = os.environ.get("REPORT_SENDER")
REGION = os.environ.get("AWS_REGION", "us-east-1")


def generate_report() -> str:
    """Build and return the HTML email body for the last 7 days."""
    return "<html><body><h1>Daily Log — Weekly Report</h1><p>TODO</p></body></html>"


def send_report(html_body: str) -> None:
    """Send the report via SES. TODO."""
    logger.info("Would send report to %s (length=%d)", RECIPIENT, len(html_body))


def run() -> None:
    logger.info("Generating weekly report")
    html = generate_report()
    send_report(html)
    logger.info("Done")
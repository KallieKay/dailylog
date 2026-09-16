import os

TABLE_NAME = os.environ.get("TABLE_NAME", "dailylog")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
USER_ID = "USER#me"  # single-user v1
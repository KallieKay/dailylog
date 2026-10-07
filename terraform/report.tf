# ---------- Report Lambda ----------

data "archive_file" "report_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../build/report"
  output_path = "${path.module}/build/report.zip"
}

resource "aws_iam_role" "report_role" {
  name = "${var.project}-${var.stage}-report-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "report_policy" {
  name = "${var.project}-${var.stage}-report-policy"
  role = aws_iam_role.report_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "report" {
  function_name = "${var.project}-${var.stage}-report"
  role          = aws_iam_role.report_role.arn
  handler       = "handler.handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.report_zip.output_path
  source_code_hash = data.archive_file.report_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME       = aws_dynamodb_table.main.name
      REPORT_SENDER    = var.report_sender
      REPORT_RECIPIENT = var.report_recipient
    }
  }
}

# ---------- EventBridge schedule ----------

resource "aws_cloudwatch_event_rule" "weekly" {
  name                = "${var.project}-${var.stage}-weekly"
  description         = "Triggers the weekly report every Sunday at 08:00 UTC"
  schedule_expression = "cron(0 8 ? * SUN *)"
}

resource "aws_cloudwatch_event_target" "weekly_report" {
  rule      = aws_cloudwatch_event_rule.weekly.name
  target_id = "report-lambda"
  arn       = aws_lambda_function.report.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly.arn
}
# ---------- SNS topic for operational alerts ----------

resource "aws_sns_topic" "alarms" {
  name = "${var.project}-${var.stage}-alarms"
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.report_recipient
}

# ---------- Alarm: API 5xx rate ----------

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project}-${var.stage}-api-5xx"
  alarm_description   = "API Gateway 5xx rate is above 1% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  treat_missing_data  = "notBreaching"

  namespace   = "AWS/ApiGateway"
  metric_name = "5xx"
  statistic   = "Sum"
  period      = 300

  dimensions = {
    ApiId = aws_apigatewayv2_api.http.id
    Stage = "$default"
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

# ---------- Alarm: report Lambda errors ----------

resource "aws_cloudwatch_metric_alarm" "report_errors" {
  alarm_name          = "${var.project}-${var.stage}-report-errors"
  alarm_description   = "The weekly report Lambda threw an error"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  namespace   = "AWS/Lambda"
  metric_name = "Errors"
  statistic   = "Sum"
  period      = 300

  dimensions = {
    FunctionName = aws_lambda_function.report.function_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}
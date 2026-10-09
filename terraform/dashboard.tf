resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-${var.stage}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "# Daily Log — ${var.stage}\nOperational dashboard for the API and weekly report Lambdas."
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 12
        height = 6
        properties = {
          title  = "API Lambda — Invocations and Errors"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.api.function_name, { stat = "Sum", label = "Invocations" }],
            [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "right" }]
          ]
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 2
        width  = 12
        height = 6
        properties = {
          title  = "API Lambda — Duration (p50 / p95 / p99)"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api.function_name, { stat = "p50", label = "p50" }],
            ["...", { stat = "p95", label = "p95" }],
            ["...", { stat = "p99", label = "p99" }]
          ]
          view   = "timeSeries"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 8
        width  = 12
        height = 6
        properties = {
          title  = "Report Lambda — Invocations and Errors"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.report.function_name, { stat = "Sum", label = "Invocations" }],
            [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "right" }]
          ]
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 8
        width  = 12
        height = 6
        properties = {
          title  = "DynamoDB — Consumed Capacity"
          region = var.aws_region
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.main.name, { stat = "Sum", label = "Read" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum", label = "Write" }]
          ]
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 14
        width  = 24
        height = 6
        properties = {
          title  = "API Gateway — Requests and 5xx"
          region = var.aws_region
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.http.id, "Stage", "$default", { stat = "Sum", label = "Requests" }],
            [".", "5xx", ".", ".", ".", ".", { stat = "Sum", label = "5xx" }]
          ]
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
        }
      }
    ]
  })
}
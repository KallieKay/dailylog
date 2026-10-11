output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "table_name" {
  value = aws_dynamodb_table.main.name
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "frontend_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "frontend_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "report_function_name" {
  value = aws_lambda_function.report.function_name
}

output "weekly_rule_name" {
  value = aws_cloudwatch_event_rule.weekly.name
}

output "dashboard_url" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alarms_topic_arn" {
  value = aws_sns_topic.alarms.arn
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}
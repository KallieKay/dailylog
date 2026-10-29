output "cognito_user_pool_id" {
  description = "The ID of the AWS Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_app_client_id" {
  description = "The App Client ID for authentication"
  value       = aws_cognito_user_pool_client.client.id
}

output "dynamodb_tables" {
  description = "Map of provisioned DynamoDB tables"
  value = {
    users           = aws_dynamodb_table.users.name
    subjects        = aws_dynamodb_table.subjects.name
    sessions        = aws_dynamodb_table.sessions.name
    habits          = aws_dynamodb_table.habits.name
    checkins        = aws_dynamodb_table.checkins.name
    posts           = aws_dynamodb_table.posts.name
    buddies         = aws_dynamodb_table.buddies.name
    active_sessions = aws_dynamodb_table.active_study_sessions.name
  }
}

output "s3_media_bucket_name" {
  description = "The name of the S3 bucket for study reels and documents"
  value       = aws_s3_bucket.media_bucket.id
}

output "api_gateway_endpoint" {
  description = "The HTTP API Gateway default stage endpoint"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

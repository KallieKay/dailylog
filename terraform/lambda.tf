data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/build/lambda.zip"
  excludes    = [".venv", "__pycache__", ".pytest_cache", "tests", "*.pyc"]
}

resource "aws_lambda_function" "api" {
  function_name = "${var.project}-${var.stage}-api"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.handler"
  runtime       = "python3.12"
  timeout       = 15
  memory_size   = 512

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.main.name
    }
  }
}
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/build/lambda.zip"
  excludes    = [".venv", "__pycache__", ".pytest_cache", "tests"]
}
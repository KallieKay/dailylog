resource "aws_dynamodb_table" "main" {
  name         = "${var.project}-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}
terraform {
  backend "s3" {
    bucket = "dailylog-terraform-state-949847740139"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
  }
}
variable "aws_region" {
  default = "us-east-1"
}

variable "project" {
  default = "dailylog"
}

variable "stage" {
  default = "dev"
}

variable "report_sender" {
  description = "Verified SES email address used as the From address"
  type        = string
}

variable "report_recipient" {
  description = "Email address the weekly report is sent to"
  type        = string
}
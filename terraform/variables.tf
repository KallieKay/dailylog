variable "aws_region" {
  description = "The AWS Region to deploy cloud resources into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The target deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "The canonical project name"
  type        = string
  default     = "dailyflow"
}

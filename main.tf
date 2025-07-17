provider "aws" {
  region = "us-east-1"  # Matches your CLI config
}

resource "aws_db_instance" "ipam_db" {
  allocated_storage    = 20  # 20 GB, free-tier eligible
  engine               = "postgres"
  engine_version       = "16.3"  # Latest stable PostgreSQL
  instance_class       = "db.t3.micro"  # Small, free-tier instance
  db_name              = "ipamdb"  # Database name
  username             = "pgadmin"  # DB admin username
  password             = "L3arn!ng2C0d3MyWay"  # CHANGE THIS to a strong password (at least 8 chars, mix of letters/numbers/symbols)
  parameter_group_name = "default.postgres16"
  skip_final_snapshot  = true  # No backup on delete (for testing)
  publicly_accessible  = true  # Allows local connection for testing; change to false for production security
  vpc_security_group_ids = [aws_security_group.db_sg.id]  # We'll add security below
}

resource "aws_security_group" "db_sg" {
  name        = "ipam-db-sg"
  description = "Allow inbound PostgreSQL traffic"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allows from anywhere (testing only; restrict to your IP in production)
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "db_endpoint" {
  value = aws_db_instance.ipam_db.endpoint
}

# EC2 for Backend (Go)
resource "aws_instance" "backend_server" {
  ami           = "ami-08ae91d91a31119d0"  # Amazon Linux 2 - find latest in AWS EC2 > Launch Instance > Search "Amazon Linux"
  instance_type = "t2.micro"
  security_group_ids = [aws_security_group.app_sg.id]
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y golang git
    git clone https://github.com/kalazzawi/ironcore-saas-mvp.git
    cd ironcore-saas-mvp/backend
    go mod download
    nohup go run main.go &
  EOF
}

# EC2 for AI (Python)
resource "aws_instance" "ai_server" {
  ami           = "ami-08ae91d91a31119d0"
  instance_type = "t2.micro"
  security_group_ids = [aws_security_group.app_sg.id]
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y python3 git
    git clone https://github.com/kalazzawi/ironcore-saas-mvp.git
    cd ironcore-saas-mvp/ai-endpoint
    python3 -m venv .venv
    source .venv/bin/activate
    pip install fastapi uvicorn pydantic
    nohup uvicorn app:app --host 0.0.0.0 --port 8000 &
  EOF
}

# Security Group for Apps (allow ports)
resource "aws_security_group" "app_sg" {
  name        = "app-sg"
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# S3 for Frontend
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "ironcore-frontend-bucket-unique"  # Make unique if duplicate error
}

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_public" {
  bucket = aws_s3_bucket.frontend_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
    }]
  })
}

# Outputs for URLs
output "backend_url" {
  value = "http://${aws_instance.backend_server.public_ip}:8080"
}

output "ai_url" {
  value = "http://${aws_instance.ai_server.public_ip}:8000"
}

output "frontend_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend_website.website_endpoint}"
}
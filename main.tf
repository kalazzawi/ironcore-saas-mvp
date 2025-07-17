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
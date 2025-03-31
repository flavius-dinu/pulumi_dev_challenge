---
sidebar_position: 2
---

# Infrastructure as Code

Infrastructure as Code (IaC) allows you to **manage and provision infrastructure through code** rather than manual processes.

## Benefits of Infrastructure as Code

- **Consistency**: Infrastructure is deployed the same way every time
- **Version Control**: Infrastructure changes can be tracked and versioned
- **Automation**: Reduces manual effort and human error
- **Documentation**: The code itself serves as documentation
- **Scalability**: Easily replicate environments at scale

## Create Your First Terraform Configuration

Create a file named `main.tf`:

```hcl title="main.tf"
provider "aws" {
  region = "us-west-2"
}

resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  
  tags = {
    Name = "example-instance"
    Environment = "dev"
  }
}
```

This simple Terraform configuration will provision an EC2 instance in AWS.

## Initialize and Apply

To deploy your infrastructure:

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

## Configure Multiple Environments

You can use variables to manage different environments:

```hcl title="variables.tf"
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}
```

Then reference these variables in your main configuration:

```hcl title="main.tf" {4,8}
resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  
  tags = {
    Name = "example-instance"
    Environment = var.environment
  }
}
```

This approach allows you to maintain consistent infrastructure across different environments while customizing specific parameters as needed.

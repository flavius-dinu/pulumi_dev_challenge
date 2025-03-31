---
sidebar_position: 1
---

# Managing Multiple Environments

Learn how to effectively **manage multiple environments** in your DevOps workflow.

## Environment Types

A typical DevOps pipeline includes several environments:

1. **Development**: Where developers work and test their changes
2. **Testing/QA**: Where QA teams perform testing
3. **Staging**: A production-like environment for final verification
4. **Production**: The live environment used by end users

## Infrastructure as Code for Multiple Environments

Use Terraform workspaces to manage different environments:

```bash
# Create workspaces for each environment
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Select an environment to work with
terraform workspace select dev
```

Then use the workspace in your configuration:

```hcl title="main.tf"
locals {
  env = terraform.workspace
  
  instance_type = {
    dev     = "t2.micro"
    staging = "t2.medium"
    prod    = "t2.large"
  }
}

resource "aws_instance" "example" {
  instance_type = local.instance_type[local.env]
  # Other configuration...
}
```

## Environment-Specific Configuration

Use environment variables or configuration files for application settings:

```yaml title="config/env.yaml"
development:
  database_url: "postgres://user:pass@dev-db:5432/myapp"
  log_level: "debug"
  
staging:
  database_url: "postgres://user:pass@staging-db:5432/myapp"
  log_level: "info"
  
production:
  database_url: "postgres://user:pass@prod-db:5432/myapp"
  log_level: "warn"
```

## Environment Promotion Strategy

Implement a promotion strategy to move code through environments:

1. **Automated promotion to development**: On every merge to the development branch
2. **Manual promotion to staging**: After passing QA in the development environment
3. **Manual promotion to production**: After passing verification in staging

Example GitHub Actions workflow:

```yaml title=".github/workflows/promote.yml"
name: Environment Promotion

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'dev'
        type: choice
        options:
        - dev
        - staging
        - prod

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
        
    - name: Deploy to ${{ github.event.inputs.environment }}
      run: |
        echo "Deploying to ${{ github.event.inputs.environment }}"
        # Add deployment commands here
```

This workflow allows manual promotion of code to different environments.

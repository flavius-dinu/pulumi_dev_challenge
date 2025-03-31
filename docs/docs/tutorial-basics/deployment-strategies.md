---
sidebar_position: 5
---

# Cloud Deployment Strategies

Learn about different **deployment strategies** for your applications in cloud environments.

## Common Deployment Strategies

### Blue-Green Deployment

Blue-green deployment involves running two identical production environments:
- **Blue**: The current production environment
- **Green**: The new version being deployed

Traffic is switched from blue to green once the new version is verified.

```bash
# Example using AWS CLI to update a load balancer
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$NEW_TARGET_GROUP_ARN
```

### Canary Deployment

Canary deployment gradually shifts traffic from the old version to the new version:

```yaml title="kubernetes-canary.yaml"
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: my-service
spec:
  hosts:
  - my-service
  http:
  - route:
    - destination:
        host: my-service
        subset: v1
      weight: 80
    - destination:
        host: my-service
        subset: v2
      weight: 20
```

This Kubernetes configuration with Istio sends 20% of traffic to the new version (v2) and 80% to the old version (v1).

### Rolling Deployment

Rolling deployment gradually replaces instances of the old version with the new version:

```yaml title="kubernetes-rolling.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    # Pod template
```

This Kubernetes configuration updates one pod at a time, ensuring at least 4 pods are always available.

## Automating Deployments

Use infrastructure as code tools to automate your deployments:

```hcl title="terraform-deployment.tf"
resource "aws_codedeploy_deployment_group" "example" {
  app_name               = aws_codedeploy_app.example.name
  deployment_group_name  = "example-group"
  service_role_arn       = aws_iam_role.example.arn
  deployment_config_name = "CodeDeployDefault.OneAtATime"
  
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
}
```

This Terraform configuration sets up AWS CodeDeploy with automatic rollback on failure.

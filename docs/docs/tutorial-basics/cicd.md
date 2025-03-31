---
sidebar_position: 3
---

# CI/CD Pipeline Implementation

Learn how to set up a **Continuous Integration and Continuous Deployment (CI/CD) pipeline** to automate your software delivery process.

## What is CI/CD?

- **Continuous Integration (CI)**: Automatically building and testing code changes
- **Continuous Delivery (CD)**: Automatically deploying code changes to staging or production environments

## Create a GitHub Actions Workflow

Create a file at `.github/workflows/ci-cd.yml`:

```yaml title=".github/workflows/ci-cd.yml"
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'
        
    - name: Install dependencies
      run: npm ci
        
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here
```

This workflow will:
1. Trigger on pushes to main or pull requests
2. Build and test your application
3. Deploy to production if the build succeeds and the branch is main

## Jenkins Pipeline Alternative

If you prefer Jenkins, create a `Jenkinsfile` in your repository:

```groovy title="Jenkinsfile"
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to production...'
                // Add your deployment commands here
            }
        }
    }
}
```

Configure your Jenkins server to use this pipeline configuration for your repository.

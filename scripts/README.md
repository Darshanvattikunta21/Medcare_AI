# Production Build and Deployment Scripts

This directory contains scripts for building, validating, and deploying the MediCare AI platform.

## Available Scripts

### build-production.sh
Builds the entire production codebase and Docker images.

```bash
bash scripts/build-production.sh
```

### deploy-docker.sh
Deploys services locally using Docker Compose.

```bash
bash scripts/deploy-docker.sh
```

### deploy-k8s.sh
Deploys to Kubernetes cluster.

```bash
bash scripts/deploy-k8s.sh [cluster-name] [namespace] [registry]

# Example:
bash scripts/deploy-k8s.sh medicare-ai-prod default docker.io
```

### validate-production.sh
Validates that all production prerequisites and files are in place.

```bash
bash scripts/validate-production.sh
```

## Usage Examples

### Full Production Build and Validation

```bash
# First validate environment
bash scripts/validate-production.sh

# Build production images
bash scripts/build-production.sh

# Deploy locally for testing
bash scripts/deploy-docker.sh
```

### Kubernetes Deployment

```bash
# Validate setup
bash scripts/validate-production.sh

# Build and push images
bash scripts/build-production.sh

# Deploy to cluster
bash scripts/deploy-k8s.sh my-cluster production myregistry
```

## Prerequisites

- Bash 4.0+
- Node.js 22+
- pnpm 9.15.0+
- Docker 20.10+
- Docker Compose 2.0+ (for Docker deployment)
- kubectl (for Kubernetes deployment)

## Environment Setup

Before running deployment scripts:

1. Copy environment files:
   ```bash
   cp .env.example .env.production.local
   cp .env.example .env.staging.local
   ```

2. Update domains and configurations in environment files

3. For Kubernetes: Ensure cluster access and appropriate credentials

4. For Docker Registry: Login to your registry
   ```bash
   docker login your-registry
   ```

#!/bin/bash

# Deploy to Kubernetes cluster

set -e

CLUSTER_NAME=${1:-"medicare-ai-prod"}
NAMESPACE=${2:-"default"}
REGISTRY=${3:-"docker.io"}

echo "🚀 Deploying to Kubernetes"
echo "=========================="
echo "Cluster: $CLUSTER_NAME"
echo "Namespace: $NAMESPACE"
echo "Registry: $REGISTRY"

# Build images
echo "Building Docker images..."
docker build -t medicareai-api:latest .
docker build -f Dockerfile.web -t medicareai-web:latest .

# Tag images
docker tag medicareai-api:latest $REGISTRY/medicareai-api:latest
docker tag medicareai-web:latest $REGISTRY/medicareai-web:latest

# Push images
echo "Pushing images to registry..."
docker push $REGISTRY/medicareai-api:latest
docker push $REGISTRY/medicareai-web:latest

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply configurations
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/api-deployment.yaml -n $NAMESPACE
kubectl apply -f k8s/web-deployment.yaml -n $NAMESPACE

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/medicare-ai-api -n $NAMESPACE
kubectl rollout status deployment/medicare-ai-web -n $NAMESPACE

echo ""
echo "✅ Deployment successful!"
echo ""
echo "Get service info:"
echo "  kubectl get svc -n $NAMESPACE"
echo ""
echo "View logs:"
echo "  kubectl logs -f deployment/medicare-ai-api -n $NAMESPACE"
echo "  kubectl logs -f deployment/medicare-ai-web -n $NAMESPACE"

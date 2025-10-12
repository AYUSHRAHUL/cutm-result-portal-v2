#!/bin/bash

# CUTM Portal Deployment Script
set -e

echo "🚀 Starting CUTM Portal Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_warning "kubectl not found. Skipping Kubernetes deployment."
    K8S_DEPLOY=false
else
    K8S_DEPLOY=true
fi

# Build Docker image
print_status "Building Docker image..."
docker build -t cutm-portal:latest .

if [ $? -eq 0 ]; then
    print_status "✅ Docker image built successfully"
else
    print_error "❌ Docker build failed"
    exit 1
fi

# Deploy with Docker Compose
print_status "Starting services with Docker Compose..."
docker-compose up -d

if [ $? -eq 0 ]; then
    print_status "✅ Services started successfully"
    print_status "🌐 Application is available at: http://localhost:3000"
    print_status "📊 Health check: http://localhost:3000/api/health"
else
    print_error "❌ Docker Compose deployment failed"
    exit 1
fi

# Deploy to Kubernetes if available
if [ "$K8S_DEPLOY" = true ]; then
    print_status "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Apply configurations
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/redis-deployment.yaml
    kubectl apply -f k8s/mongodb-deployment.yaml
    kubectl apply -f k8s/app-deployment.yaml
    kubectl apply -f k8s/ingress.yaml
    
    print_status "✅ Kubernetes deployment completed"
    print_status "🔍 Check pods: kubectl get pods -n cutm-portal"
    print_status "🔍 Check services: kubectl get svc -n cutm-portal"
else
    print_warning "Kubernetes deployment skipped (kubectl not found)"
fi

print_status "🎉 Deployment completed successfully!"
print_status "📝 Next steps:"
print_status "   1. Update environment variables in .env file"
print_status "   2. Configure your domain in k8s/ingress.yaml"
print_status "   3. Set up SSL certificates for production"
print_status "   4. Monitor logs: docker-compose logs -f"

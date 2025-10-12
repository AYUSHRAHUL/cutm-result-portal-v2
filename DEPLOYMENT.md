# CUTM Portal - Deployment Guide

This guide covers deploying the CUTM Result Portal using Docker, Redis, and Kubernetes.

## 🐳 Docker Deployment

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd cutm-portal
   cp env.example .env
   # Edit .env with your configuration
   ```

2. **Deploy with Docker Compose:**
   ```bash
   # Install dependencies
   npm install
   
   # Start all services
   docker-compose up -d
   
   # Check status
   docker-compose ps
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - Health Check: http://localhost:3000/api/health
   - MongoDB: localhost:27017
   - Redis: localhost:6379

### Docker Commands

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
docker-compose logs -f

# Scale application
docker-compose up -d --scale app=3
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured
- Docker image built and pushed to registry

### Deploy to Kubernetes

1. **Build and push Docker image:**
   ```bash
   # Build image
   docker build -t cutm-portal:latest .
   
   # Tag for registry (replace with your registry)
   docker tag cutm-portal:latest your-registry/cutm-portal:latest
   
   # Push to registry
   docker push your-registry/cutm-portal:latest
   ```

2. **Update image in Kubernetes manifests:**
   ```bash
   # Edit k8s/app-deployment.yaml
   # Change image: cutm-portal:latest to your-registry/cutm-portal:latest
   ```

3. **Deploy to Kubernetes:**
   ```bash
   # Apply all manifests
   kubectl apply -f k8s/
   
   # Check deployment status
   kubectl get pods -n cutm-portal
   kubectl get svc -n cutm-portal
   ```

4. **Access the application:**
   ```bash
   # Get external IP
   kubectl get svc cutm-portal-service -n cutm-portal
   
   # Port forward for local access
   kubectl port-forward svc/cutm-portal-service 3000:80 -n cutm-portal
   ```

### Kubernetes Commands

```bash
# Check pods
kubectl get pods -n cutm-portal

# Check services
kubectl get svc -n cutm-portal

# Check logs
kubectl logs -f deployment/cutm-portal-app -n cutm-portal

# Scale application
kubectl scale deployment cutm-portal-app --replicas=5 -n cutm-portal

# Delete deployment
kubectl delete namespace cutm-portal
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Application port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://admin:password123@mongodb:27017/cutm1` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | SMTP password | `your-app-password` |

### Redis Configuration

Redis is used for:
- Session management
- OTP storage
- API response caching
- Rate limiting

### MongoDB Configuration

MongoDB stores:
- User accounts
- Academic records
- CBCS data
- System logs

## 📊 Monitoring

### Health Checks

- **Application Health:** `/api/health`
- **MongoDB:** Connection ping
- **Redis:** Connection ping

### Logs

```bash
# Docker Compose logs
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f redis

# Kubernetes logs
kubectl logs -f deployment/cutm-portal-app -n cutm-portal
kubectl logs -f deployment/mongodb -n cutm-portal
kubectl logs -f deployment/redis -n cutm-portal
```

## 🔒 Security

### Production Checklist

- [ ] Change default JWT secret
- [ ] Use strong MongoDB passwords
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup strategy

### SSL/TLS Setup

For production, configure SSL certificates:

```yaml
# In k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - cutm-portal.example.com
    secretName: cutm-portal-tls
```

## 🚀 Production Deployment

### Using the deployment script:

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### Manual deployment:

1. **Build and push image to registry**
2. **Update Kubernetes manifests with registry image**
3. **Apply configurations**
4. **Set up monitoring and logging**
5. **Configure SSL certificates**
6. **Set up backup strategy**

## 🆘 Troubleshooting

### Common Issues

1. **Application won't start:**
   - Check environment variables
   - Verify database connections
   - Check logs for errors

2. **Database connection failed:**
   - Verify MongoDB is running
   - Check connection string
   - Verify network connectivity

3. **Redis connection failed:**
   - Verify Redis is running
   - Check Redis URL
   - Verify Redis configuration

4. **Kubernetes pods not ready:**
   - Check pod logs
   - Verify resource limits
   - Check health probes

### Debug Commands

```bash
# Docker
docker-compose logs -f
docker exec -it cutm-portal-app sh

# Kubernetes
kubectl describe pod <pod-name> -n cutm-portal
kubectl exec -it <pod-name> -n cutm-portal -- sh
```

## 📞 Support

For issues and questions:
- Check logs first
- Review this documentation
- Create an issue in the repository

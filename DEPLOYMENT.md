# MediCare AI - Deployment Guide

This guide covers deploying the MediCare AI platform (API, Web App, and Mobile App) to production.

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Node.js 22+ and pnpm 9.15.0+
- Git and GitHub account (for CI/CD)
- Cloud provider account (AWS, GCP, Azure, etc.)
- Vercel account (for web deployment - optional)
- EAS account (for mobile builds - optional)

## Environment Configuration

### 1. Set Up Environment Variables

Create production environment files:

```bash
# Production
cp .env.production .env.production.local

# Staging
cp .env.staging .env.staging.local
```

Update the URLs to your production domains:

```env
# .env.production.local
CORS_ORIGIN=https://medicareai.com,https://app.medicareai.com
NEXT_PUBLIC_API_BASE_URL=https://api.medicareai.com
EXPO_PUBLIC_API_BASE_URL=https://api.medicareai.com
API_BASE_URL=https://api.medicareai.com
```

## API Deployment

### Option 1: Docker Compose (Local/Self-hosted)

```bash
# Build and start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api
```

### Option 2: Cloud Deployment (AWS EC2/ECS, Google Cloud Run, etc.)

#### Build Docker Image

```bash
# Build the image
docker build -t medicareai-api:latest .

# Tag for registry
docker tag medicareai-api:latest your-registry/medicareai-api:latest

# Push to registry
docker push your-registry/medicareai-api:latest
```

#### AWS ECS Example

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name medicare-ai

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster medicare-ai \
  --service-name medicareai-api \
  --task-definition medicareai-api:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Google Cloud Run Example

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/medicareai-api

# Deploy
gcloud run deploy medicareai-api \
  --image gcr.io/PROJECT_ID/medicareai-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,APP_ENV=production"
```

### Health Check

Verify the API is running:

```bash
curl https://api.medicareai.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "medicare-ai-api",
  "env": "production"
}
```

## Web App Deployment

### Option 1: Vercel (Recommended for Next.js)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE_URL=https://api.medicareai.com`
3. Deploy:

```bash
vercel --prod
```

### Option 2: Docker Deployment

```bash
docker build -f Dockerfile.web -t medicareai-web:latest .
docker push your-registry/medicareai-web:latest
```

### Option 3: Traditional Hosting (Ubuntu/Nginx)

```bash
# SSH into server
ssh ubuntu@your-server

# Install Node.js and pnpm
curl -fsSL https://nodejs.org/dist/v22.0.0/node-v22.0.0-linux-x64.tar.xz | sudo tar -xJ -C /usr/local/

# Clone repository
git clone https://github.com/your-org/medicare-ai.git
cd medicare-ai

# Install dependencies
pnpm install --prod

# Build
pnpm --filter web build

# Run with PM2
npm install -g pm2
pm2 start "pnpm --filter web start" --name medicare-ai-web
pm2 startup
pm2 save
```

## Mobile App Deployment

### iOS (App Store)

Prerequisites:
- Apple Developer Account
- EAS CLI installed

```bash
# Configure EAS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

### Android (Google Play)

Prerequisites:
- Google Play Developer Account
- Keystore file and credentials

```bash
# Configure EAS
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

### Development Build

```bash
# Create development build
eas build --platform ios --profile development
eas build --platform android --profile development

# Install on device
eas build:list
```

## Database and Data Persistence

### Current Setup

The API uses a JSON file-based database located at `/app/data/db.json`.

For production, consider:

1. **PostgreSQL/MySQL Migration**
   ```bash
   # Install database dependencies
   pnpm add -w pg
   ```

2. **MongoDB**
   ```bash
   docker run -d --name mongodb \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=password \
     -p 27017:27017 \
     mongo:latest
   ```

3. **Cloud Databases**
   - AWS RDS
   - Google Cloud SQL
   - Azure Database

## CI/CD Pipeline

GitHub Actions workflow is configured in `.github/workflows/deploy.yml`:

1. Tests and builds on every push
2. Builds Docker image
3. Pushes to registry
4. Deploys to production on main branch

To enable:

1. Add secrets to GitHub:
   - `DOCKER_USERNAME` and `DOCKER_PASSWORD` (for Docker Hub)
   - `VERCEL_TOKEN` (for Vercel deployment)
   - Cloud provider credentials as needed

2. Workflows run automatically on push to main

## Security Checklist

- [ ] Environment variables are not committed to Git
- [ ] HTTPS is enabled on all domains
- [ ] CORS_ORIGIN is restricted to known domains
- [ ] API has rate limiting configured
- [ ] Database has backups enabled
- [ ] Logs are centralized (CloudWatch, DataDog, etc.)
- [ ] Monitoring and alerts are configured
- [ ] Regular security audits scheduled

## Monitoring and Logging

### Health Checks

```bash
# API health
curl https://api.medicareai.com/health

# Web app
curl https://medicareai.com
```

### Logs

```bash
# Docker Compose
docker-compose logs -f api

# Cloud platforms
aws logs tail /ecs/medicareai-api --follow

gcloud logging read --limit 50 --format json
```

### Metrics

Set up monitoring:
- **Datadog**: APM, logs, infrastructure monitoring
- **New Relic**: Application performance monitoring
- **CloudWatch**: AWS native monitoring
- **Grafana**: Open-source visualization

## Rollback Procedures

### Docker/Kubernetes

```bash
# Rollback to previous image
docker pull medicareai-api:previous-tag
docker-compose down
docker-compose up -d
```

### Vercel

Automatic rollback available in Vercel dashboard for previous deployments.

### Manual Rollback

```bash
git revert HEAD
git push origin main
# CI/CD will rebuild and redeploy
```

## Post-Deployment Verification

1. Test API endpoints
2. Verify web app loads correctly
3. Check mobile app connectivity
4. Monitor error rates and performance
5. Validate data persistence
6. Test user authentication flow
7. Verify payment processing (if applicable)
8. Check email notifications (if applicable)

## Support and Troubleshooting

### Common Issues

**API not responding**
```bash
# Check container logs
docker-compose logs api

# Verify environment variables
docker-compose exec api env | grep -E "CORS|PORT|APP_ENV"

# Test health endpoint
curl http://localhost:4000/health
```

**Web app not loading API**
```bash
# Check environment variables in browser console
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)

# Verify CORS settings
curl -H "Origin: https://medicareai.com" http://api:4000/health
```

**Mobile app connection issues**
```bash
# Check Expo logs
eas logs --platform android --tail

# Verify API endpoint in app config
# Check EXPO_PUBLIC_API_BASE_URL environment variable
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Expo Deployment](https://docs.expo.dev/distribution/introduction/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## Contact

For deployment assistance, contact: devops@medicareai.com

# MediCare AI

Monorepo scaffold for the MediCare AI platform described in the May 2025 product documentation. This repository is organized for parallel development of:

- Web app
- Android app
- iOS app
- Backend API
- Shared product packages and design assets

## Workspace layout

```text
apps/
  api/       Express API for auth, catalog, orders, prescriptions, and AI orchestration
  mobile/    Single Expo codebase that builds for both Android and iOS
  web/       Next.js web app and PWA shell
docs/        Product requirements, architecture, and implementation plan
packages/
  core/      Shared domain types, route map, feature flags, and seed data
  design/    Shared design tokens for web and mobile
tools/
  figma-plugin/  Existing 42-screen Figma generator preserved from the original workspace
```

## Product scope captured from the brief

- AI symptom-to-medicine flow
- Prescription OCR and verification
- Drug interaction detection
- Smart pharmacy selection
- Live delivery tracking
- Patient health profile and prescription vault

## Suggested first build order

1. `apps/api`: authentication, catalog, cart, order, and prescription endpoints
2. `apps/web`: customer-facing PWA for discovery, ordering, and account management
3. `apps/mobile`: native-feeling Android and iOS experience on top of the same product model
4. AI services: OCR, symptom analysis, and interaction checks behind API contracts

## Mobile platform note

`apps/mobile` is the unified app for both Android and iOS. We do not need separate repositories for those platforms unless later native-only requirements force a split.

## Getting started

```bash
pnpm install
pnpm dev:web
pnpm dev:mobile
pnpm dev:api
```

Dependencies are not installed yet in this scaffold-only setup.

## Deployment

The platform is production-ready with comprehensive deployment support:

### Quick Start

```bash
# Validate production setup
pnpm validate:prod

# Build production images
pnpm build:prod

# Deploy with Docker Compose
pnpm docker:compose
```

### Deployment Options

- **Docker Compose**: Local testing and small deployments
- **Kubernetes**: Production-grade with auto-scaling
- **Cloud Providers**: AWS, GCP, Azure, or DigitalOcean
- **Vercel**: Web app deployment
- **EAS Build**: Mobile app (iOS/Android)

### Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Fastest deployment path
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide (200+ lines)
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Production launch checklist

### Available Scripts

```bash
# Development
pnpm dev:web        # Start web app
pnpm dev:mobile     # Start mobile app
pnpm dev:api        # Start API

# Production
pnpm validate:prod  # Validate production setup
pnpm build:prod     # Build all production images
pnpm deploy:docker  # Deploy with Docker Compose
pnpm deploy:k8s     # Deploy to Kubernetes

# Utilities
pnpm docker:build   # Build Docker images
pnpm docker:compose # Start Docker Compose
pnpm build          # Build all apps
pnpm lint           # Lint all apps
pnpm typecheck      # Type check all apps
```

### Environment Variables

See `.env.example` for all required variables. For deployment, use:
- `.env.production` for production
- `.env.staging` for staging

### Health Checks

Once deployed:

```bash
# API health
curl http://localhost:4000/health
# Expected: {"status":"ok","service":"medicare-ai-api","env":"production"}

# API ready
curl http://localhost:4000/ready
# Expected: {"ready":true,"service":"medicare-ai-api"}

# Run health check script
bash scripts/health-check.sh http://localhost:4000 http://localhost:3000
```

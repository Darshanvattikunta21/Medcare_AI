# Complete App Checklist

This repository is a strong product scaffold, but it is not yet a complete production app. The current implementation has:

- Web and mobile UI coverage for many flows
- A simple Express API with mock-like behavior
- Shared domain data and seed content
- Deployment scaffolding for Docker, Kubernetes, Vercel, and Expo

What it does not yet have is a full production-grade backend, a real database, secure auth, payment processing, storage, OCR/AI integrations, operational monitoring, and full end-to-end business workflows.

## Current State Summary

### Frontend

- Many screens exist in `apps/web` and `apps/mobile`
- Most pages are powered by shared seed data or fallback API responses
- Core flows are visually scaffolded, but not fully connected to persistent business logic

### Backend

- API routes exist for auth, catalog, orders, profile, prescriptions, symptoms
- Business logic is mostly development-mode placeholder logic
- Auth is not secure or stateful
- Payments, delivery, OCR, notifications, and pharmacy logic are not implemented

### Database

- Persistence currently uses a local JSON file via `apps/api/src/lib/file-db.ts`
- There is no real relational or document database
- There are no migrations, indexes, audit tables, or multi-user data boundaries

## What Needs To Be Done

## 1. Frontend Work

### Web and mobile app wiring

- Replace seed-driven and fallback-driven rendering with live API-backed data everywhere
- Add proper loading, empty, error, retry, and offline states for all critical screens
- Centralize auth state, session refresh, logout, and protected route handling
- Add real form validation for login, signup, address, checkout, profile, and uploads
- Persist cart state per logged-in user
- Connect order history, order detail, and tracking screens to real backend records
- Connect profile editing to update APIs instead of static profile data
- Connect prescription upload and vault screens to real storage and review workflows
- Connect AI symptom flow to real analysis APIs and guardrails

### Feature completeness

- Implement searchable medicine catalog with filters, sort, pagination, and stock availability
- Implement medicine detail flow with dosage info, warnings, reviews, and prescription requirement checks
- Implement cart operations: add, remove, quantity update, substitution rules, pricing updates
- Implement checkout flow with address selection, payment status, order confirmation, and failure recovery
- Implement reorder flow from previous orders
- Implement notifications center backed by actual events
- Implement review and ratings submission flow
- Implement support/help flows

### UX and product quality

- Add accessibility support: color contrast, keyboard nav, focus states, screen-reader labels, text scaling
- Add elderly-friendly mode if it remains in scope
- Add responsive QA across desktop, tablet, and mobile web
- Add PWA polish: manifest validation, icons, installability, offline caching strategy, service worker behavior
- Add analytics for funnel drop-off, search, cart abandonment, and conversion

## 2. Backend Work

### Authentication and authorization

- Replace `dev-token-medicare-ai` style auth with real auth
- Implement signup, login, logout, refresh tokens, password reset, OTP verification
- Hash passwords securely
- Add JWT or session-based auth with expiry and refresh strategy
- Add role support at minimum for patient, admin, pharmacist, delivery partner
- Protect all user-specific endpoints
- Add rate limiting, brute-force protection, and audit logging for auth events

### Core domain APIs

- Expand catalog APIs to support filtering, search, pagination, stock, pricing, and prescription flags
- Add cart APIs for CRUD operations and price recalculation
- Expand orders APIs to support draft order, placed order, paid, packed, shipped, delivered, cancelled, returned
- Add profile update endpoints
- Add address CRUD endpoints
- Add prescription upload, status, review, resubmission, and history endpoints
- Add pharmacy discovery and assignment endpoints
- Add notification APIs or event feeds

### Business rules

- Validate prescription-required medicines before checkout
- Validate medicine availability by pharmacy and region
- Prevent ordering conflicting or disallowed combinations without pharmacist review
- Add pricing rules, taxes, fees, discounts, and substitutions
- Add cancellation and return eligibility rules
- Add refill eligibility rules for chronic medication flows

### Real integrations

- OCR provider integration for prescription extraction
- AI symptom analysis service integration
- Drug interaction checking service or rules engine
- Payment gateway integration such as Razorpay or Stripe
- SMS/email/WhatsApp notification integration
- Cloud storage integration for prescription images and documents
- Maps and geolocation integration for address validation and delivery ETA
- Delivery provider integration or internal dispatch workflow

### Platform and API quality

- Add request validation for all endpoints
- Standardize error response shapes
- Add API versioning strategy
- Add idempotency for checkout and payment confirmation
- Add structured logging and request correlation IDs
- Add background job processing for OCR, notifications, payment reconciliation, reminder scheduling
- Add admin APIs or internal tools for support and operations

## 3. Database Work

### Replace file storage with a real database

Recommended baseline:

- PostgreSQL for transactional data
- Redis for caching, sessions, rate limiting, and queues
- S3-compatible object storage for prescription files and media

### Schema design

Create production tables for:

- users
- sessions or refresh_tokens
- roles and permissions
- user_profiles
- addresses
- medicines
- medicine_categories
- inventory
- pharmacies
- pharmacy_inventory
- carts
- cart_items
- orders
- order_items
- payments
- payment_events
- prescriptions
- prescription_files
- prescription_reviews
- symptom_assessments
- interaction_checks
- notifications
- delivery_tracking_events
- audit_logs

### Database capabilities

- Add migrations
- Add seed scripts for local and staging
- Add indexes for search and order lookups
- Add foreign keys and constraints
- Add soft-delete or archival strategy where needed
- Add audit history for sensitive health and order data
- Add backup and restore plan
- Add encryption strategy for sensitive data

### Compliance and data protection

- Separate PII and health-related data carefully
- Encrypt sensitive fields at rest where required
- Define data retention and deletion workflows
- Add consent tracking if AI analysis or health data processing requires it
- Add access logs for sensitive record views and changes

## 4. Admin and Operations Work

### Internal operations surfaces

- Admin dashboard for users, orders, prescriptions, payments, refunds, catalog, inventory
- Pharmacist review dashboard for prescription verification and medicine substitution approvals
- Delivery operations dashboard for assignment and status updates
- Support tooling for order issues, refunds, address fixes, and account help

### Monitoring and reliability

- Error monitoring
- Metrics and uptime monitoring
- Centralized logs
- Alerts for API failures, payment failures, OCR failures, queue delays
- Health checks for dependencies, not just process liveness

## 5. Security Work

- Replace permissive `CORS_ORIGIN=*` defaults for production
- Add secret management
- Add CSRF strategy if using cookies
- Add input validation and sanitization
- Add file upload validation and malware scanning strategy
- Add API throttling and abuse detection
- Add dependency and container vulnerability scanning
- Add least-privilege access for storage, DB, CI/CD, and cloud services

## 6. Testing Work

- Unit tests for services and domain rules
- Integration tests for API routes and database persistence
- End-to-end tests for login, browse, checkout, upload prescription, and tracking
- Contract tests between clients and API
- Payment webhook tests
- Load testing for catalog search and checkout paths
- Mobile device QA and browser QA matrix

## 7. Deployment and Release Work

### Web

- Confirm `vercel.json` matches the actual Next.js deployment needs
- Verify monorepo root settings and env injection in Vercel
- Ensure the web app points to a deployed API, not localhost

### API

- Deploy API separately to a host that supports the Node service and database access
- Add real production env vars
- Add database connection management
- Add worker deployment if background jobs are introduced

### Mobile

- Configure Expo/EAS for staging and production
- Add push notification credentials
- Add store-ready metadata, icons, splash, permissions, privacy disclosures

### CI/CD

- Add pull request checks for lint, typecheck, tests, and builds
- Add deployment pipelines for staging and production
- Add rollback procedure

## Recommended Build Order

## Phase 1: Make the app real

- Choose the backend stack details: PostgreSQL, ORM, auth method, storage, payment provider
- Replace JSON file persistence with database models and migrations
- Implement secure auth
- Implement catalog, cart, address, profile, and order APIs against the database
- Wire web and mobile to the real APIs

## Phase 2: Make commerce safe

- Add prescription-required medicine rules
- Add payment integration
- Add order lifecycle and status tracking
- Add notification system
- Add admin and pharmacist operations flows

## Phase 3: Add AI and advanced workflows

- Add prescription OCR pipeline
- Add symptom analysis service
- Add drug interaction engine
- Add pharmacy scoring and assignment logic
- Add refill reminders and proactive health features

## Highest Priority Gaps In This Repo

- Auth is placeholder and not secure
- Database is a local JSON file, not production-ready
- Orders, prescriptions, and symptoms use mocked or simplified logic
- Frontend is not fully connected to persistent user-specific APIs
- Payment flow is not implemented
- File upload and document storage are not implemented
- No automated tests are present
- Production observability and security hardening are incomplete

## Suggested Immediate Next Tasks

1. Add PostgreSQL plus ORM and create the first real schema
2. Implement secure auth with hashed passwords and JWT/session handling
3. Build cart, address, profile, and order APIs on the real database
4. Connect web checkout and account flows to the live backend
5. Add prescription file storage and review workflow
6. Add payment integration
7. Add tests and CI before expanding AI features

## Relevant Files Reviewed

- `apps/api/src/lib/file-db.ts`
- `apps/api/src/services/auth.service.ts`
- `apps/api/src/services/orders.service.ts`
- `apps/api/src/services/prescriptions.service.ts`
- `apps/api/src/services/symptoms.service.ts`
- `packages/api-client/src/index.ts`
- `apps/web/app/page.tsx`
- `apps/mobile/lib/use-app-snapshot.ts`
- `vercel.json`

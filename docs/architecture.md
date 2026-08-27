# Architecture

## Monorepo choice

The product brief spans web, Android, iOS, API, and AI services. A monorepo keeps:

- shared types consistent across all clients
- feature delivery aligned across platforms
- roadmap and docs in one place

## Application map

### `apps/web`

- Next.js App Router
- Tailwind-based styling
- PWA shell for installable browser usage
- Best for browse, search, upload, checkout, and profile management

### `apps/mobile`

- Expo Router
- Android and iOS from one codebase
- Camera, biometric auth, notifications, and live tracking entry point
- Shared navigation and feature logic across both mobile platforms
- Native packaging targets configured through Expo for Android and iOS builds

### `apps/api`

- Express TypeScript service
- Handles auth, catalog, prescriptions, carts, orders, payments, and delivery orchestration
- Exposes stable contracts for future Python AI services

## Shared packages

### `packages/core`

- product routes
- feature flags
- shared domain models
- seeded categories and dashboard content

### `packages/design`

- colors
- spacing
- radius scale
- typography tokens

## External integrations planned

- OCR: Google Vision and Tesseract pipeline
- Maps: Google Maps or HERE
- Payments: Razorpay and Stripe
- Storage: AWS S3 or Firebase Storage
- Auth: OAuth, JWT, biometric extensions

## Backend domain modules

- `auth`
- `users`
- `health-profile`
- `catalog`
- `prescriptions`
- `drug-safety`
- `cart`
- `orders`
- `pharmacy-network`
- `delivery`
- `payments`

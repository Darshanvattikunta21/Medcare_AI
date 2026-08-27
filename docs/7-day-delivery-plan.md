# 7-Day Delivery Plan

## Delivery Target

This sprint targets a strong end-to-end demo build in 7 days, not a medically validated or production-complete healthcare platform.

By the end of Day 7, the repo should support:

- real PostgreSQL-backed persistence
- secure auth and protected API access
- working catalog, cart, checkout, orders, addresses, and profile flows
- prescription upload plus OCR-backed extraction
- basic symptom analysis and medicine recommendation flow
- basic drug interaction checks
- deployment-ready Docker and Kubernetes configuration
- updated project documentation that matches the actual implementation

## Scope Guardrails

The following items are intentionally simplified for this sprint:

- delivery tracking may be simulated with staged order statuses
- pharmacy scoring may be rule-based instead of ML-based
- symptom analysis may use a provider-backed or rule-backed service instead of a custom trained model
- OCR may rely on a single provider instead of a multi-model pipeline
- compliance, analytics, and admin tooling may be thin but structured

## Day 1 Outcomes

Day 1 is focused on foundation work:

- freeze the 7-day feature scope
- adopt PostgreSQL as the primary application database
- scaffold Prisma ORM and the initial database schema
- wire `DATABASE_URL` and persistence strategy flags into the environment
- prepare Docker Compose and Kubernetes configs for the database-backed architecture

## Proposed Build Order

1. Day 1: foundation and database scaffold
2. Day 2: auth, users, profile, addresses
3. Day 3: catalog, cart, checkout, orders
4. Day 4: prescriptions, uploads, storage, OCR
5. Day 5: symptom engine and interaction checks
6. Day 6: smart workflow logic and deployment readiness
7. Day 7: integration, bug fixes, verification, docs, and demo prep

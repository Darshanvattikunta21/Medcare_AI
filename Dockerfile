# Multi-stage build for MediCare AI API
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.0

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api ./apps/api
COPY packages/core ./packages/core
COPY packages/api-client ./packages/api-client
COPY tsconfig.base.json ./

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @medicare/core build
RUN pnpm --filter @medicare/api-client build
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9.15.0

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma
COPY packages/core/package.json ./packages/core/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/api-client/dist ./packages/api-client/dist

RUN mkdir -p /app/data
RUN mkdir -p /app/storage/prescriptions
RUN pnpm install --frozen-lockfile --prod
RUN pnpm --filter api prisma:generate

WORKDIR /app/apps/api

EXPOSE 4000

ENV NODE_ENV=production
ENV APP_ENV=production
ENV PORT=4000

CMD ["node", "dist/index.js"]

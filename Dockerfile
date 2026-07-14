FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY . .
RUN pnpm --filter @devpilot/shared build
RUN cd apps/backend && ./node_modules/.bin/prisma generate
RUN pnpm --filter @devpilot/backend build

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/backend/node_modules
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 devpilot
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/infrastructure ./infrastructure
USER devpilot
EXPOSE 4000
CMD ["sh", "-c", "cd apps/backend && node dist/setup.js 2>&1 && echo '=== Setup complete ===' && node dist/index.js"]

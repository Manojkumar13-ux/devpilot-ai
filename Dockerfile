FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @devpilot/shared build
RUN cd apps/backend && npx --no-install prisma generate
RUN pnpm --filter @devpilot/backend build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "cd apps/backend && node dist/setup.js 2>&1; echo '=== Starting server ==='; node dist/index.js"]

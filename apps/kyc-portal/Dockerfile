# ── Stage 1: Prune ────────────────────────────────────────────────────────────
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@latest
WORKDIR /app
COPY . .
ARG APP_NAME=kyc-portal
RUN turbo prune --scope=${APP_NAME} --docker

# ── Stage 2: Install & Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
ARG APP_NAME=kyc-portal
RUN pnpm turbo run build --filter=${APP_NAME}...

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 appuser

ARG APP_NAME=kyc-portal
COPY --from=builder /app/apps/${APP_NAME}/public             ./public
COPY --from=builder --chown=appuser:nodejs \
     /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs \
     /app/apps/${APP_NAME}/.next/static      ./.next/static

USER appuser
EXPOSE 3013
ENV PORT=3013
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

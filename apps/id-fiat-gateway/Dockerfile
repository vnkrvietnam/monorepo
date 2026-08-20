# ── Stage 1: Prune monorepo — chỉ giữ lại deps của app này ──────────────────
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@latest
WORKDIR /app
COPY . .
ARG APP_NAME=id-fiat-gateway
RUN turbo prune --scope=${APP_NAME} --docker

# ── Stage 2: Install & Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
WORKDIR /app

# Tận dụng cache layer: copy json trước, install sau
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Copy toàn bộ source đã prune, rồi build
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
ARG APP_NAME=id-fiat-gateway
RUN pnpm turbo run build --filter=${APP_NAME}...

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 appuser

ARG APP_NAME=id-fiat-gateway
COPY --from=builder /app/apps/${APP_NAME}/public             ./public
COPY --from=builder --chown=appuser:nodejs \
     /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs \
     /app/apps/${APP_NAME}/.next/static      ./.next/static

USER appuser
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

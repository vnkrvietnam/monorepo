# syntax=docker/dockerfile:1
# ─── VNKR Swift Adapter — Runtime Container ───────────────────────────────────
# Provides a Node.js 20 + OpenJDK 17 environment for running services that
# depend on @vnkrvietnam/swift-adapter.  The SWIFT SDK JAR utilities
# (file-encryptor-decryptor, swift-messaging-sdk) require a JRE to operate.
#
# Build:
#   docker build -f packages/swift-adapter/Dockerfile -t vnkr/swift-adapter .
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base

# Install OpenJDK 17 JRE + bash (required by SWIFT vendor install scripts)
RUN apk add --no-cache openjdk17-jre bash

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps

WORKDIR /var/www

# Copy workspace manifests for pnpm install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/swift-adapter/package.json ./packages/swift-adapter/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --filter @vnkrvietnam/swift-adapter...

# ─── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder

WORKDIR /var/www

COPY packages/swift-adapter/ ./packages/swift-adapter/
COPY packages/config/ ./packages/config/
COPY packages/types/ ./packages/types/

# Run the SWIFT vendor install scripts
RUN chmod +x /var/www/packages/swift-adapter/vendor/swift-sdk-2.17.10-6/install.sh && \
    bash /var/www/packages/swift-adapter/vendor/swift-sdk-2.17.10-6/install.sh || true

RUN chmod +x /var/www/packages/swift-adapter/vendor/swift-security-sdk-2.17.5-6/install.sh && \
    bash /var/www/packages/swift-adapter/vendor/swift-security-sdk-2.17.5-6/install.sh || true

RUN pnpm --filter @vnkrvietnam/swift-adapter build

# ─── Runtime ──────────────────────────────────────────────────────────────────
FROM base AS runtime

WORKDIR /var/www

# Copy only the compiled output and vendor JARs
COPY --from=builder /var/www/packages/swift-adapter/dist ./packages/swift-adapter/dist
COPY --from=builder /var/www/packages/swift-adapter/vendor ./packages/swift-adapter/vendor
COPY --from=builder /var/www/packages/swift-adapter/package.json ./packages/swift-adapter/

ENV NODE_ENV=production

CMD ["node", "packages/swift-adapter/dist/index.js"]

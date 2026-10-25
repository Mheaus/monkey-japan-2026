# syntax=docker/dockerfile:1

# ── Base ─────────────────────────────────────────────────────────────
FROM node:26-alpine AS base
COPY --from=ghcr.io/pnpm/pnpm:12.15.0-alpine@sha256:f164ca19f7736a0994dae195b81756cd969542a93ef692f5ab466759d06c1da9 /opt/pnpm /opt/pnpm
RUN ln -s /opt/pnpm/pnpm /usr/local/bin/pnpm
WORKDIR /app

# ── Install all dependencies ─────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm build

# ── Production dependencies ──────────────────────────────────────────
FROM base AS prod-deps
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ── Runtime ──────────────────────────────────────────────────────────
FROM node:26-alpine AS runtime
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "node_modules/@react-router/serve/bin.js", "./build/server/index.js"]

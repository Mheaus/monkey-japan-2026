# syntax=docker/dockerfile:1

# ── Base ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /app

# ── Install all dependencies ─────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm build

# ── Production dependencies ──────────────────────────────────────────
FROM base AS prod-deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ── Runtime ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "node_modules/@react-router/serve/bin.js", "./build/server/index.js"]

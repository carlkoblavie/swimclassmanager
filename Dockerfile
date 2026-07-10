# syntax=docker/dockerfile:1
#
# Based on the official AdonisJS deployment Dockerfile
# (https://docs.adonisjs.com/guides/getting-started/deployment), adapted for:
#   - pinned Node (matches package.json "engines": "24.x")
#   - the private @adonisplus registry (needs ADONIS_PLUS_TOKEN at install time)
#   - native better-sqlite3 (needs a build toolchain)
#   - optional migrate-on-boot via MIGRATE=true (see docker-entrypoint.sh)
#
# Build and runtime share the SAME Node base image, so native modules are always
# compiled against the exact Node that runs them (no NODE_MODULE_VERSION mismatch).

ARG NODE_VERSION=24

# ---- base: Node + toolchain for native modules (better-sqlite3) ----------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Stage 1: install all dependencies -----------------------------------------
FROM base AS deps
ARG ADONIS_PLUS_TOKEN
ENV ADONIS_PLUS_TOKEN=${ADONIS_PLUS_TOKEN}
COPY package*.json .npmrc ./
RUN npm ci

# ---- Stage 2: build the application --------------------------------------------
FROM deps AS build
COPY . .
RUN node ace build

# ---- Stage 3: production dependencies only (compiled against this same Node) ----
FROM base AS prod-deps
ARG ADONIS_PLUS_TOKEN
ENV ADONIS_PLUS_TOKEN=${ADONIS_PLUS_TOKEN}
COPY package*.json .npmrc ./
RUN npm ci --omit=dev

# ---- Stage 4: production runtime (no toolchain, no token in the final image) ----
FROM node:${NODE_VERSION}-bookworm-slim AS production
ENV NODE_ENV=production
ENV PORT=3333
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./
COPY docker-entrypoint.js ./
EXPOSE 3333
# Runs migrations first when MIGRATE=true, then starts the server.
CMD ["node", "docker-entrypoint.js"]

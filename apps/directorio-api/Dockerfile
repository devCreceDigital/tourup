FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9 --quiet

# Workspace config + package.json files (para cache de capas)
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/

RUN pnpm install --no-frozen-lockfile

# Source + build config
COPY . .
RUN pnpm run build

# ── Runtime ───────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist/
CMD ["node", "--enable-source-maps", "dist/index.mjs"]

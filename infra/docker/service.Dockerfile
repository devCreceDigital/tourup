FROM node:24-bookworm-slim AS deps
WORKDIR /workspace
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
COPY package*.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
RUN pnpm install
RUN pnpm --filter @totem/shared-kernel run build && pnpm --filter @totem/service-runtime run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
RUN addgroup --system totem && adduser --system --ingroup totem totem
COPY --from=deps /workspace /workspace
USER totem
CMD ["pnpm", "run", "start"]

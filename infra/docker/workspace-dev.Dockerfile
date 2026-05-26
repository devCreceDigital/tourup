FROM node:24-bookworm-slim

WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

CMD ["pnpm", "--version"]

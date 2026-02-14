# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Production image ──
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy project files
COPY package.json tsconfig.json explorer.config.json proxies.txt ./
COPY src/ ./src/

# Default command — run the explorer
CMD ["npx", "ts-node", "src/index.ts"]

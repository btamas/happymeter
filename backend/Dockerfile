# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files (including package-lock.json) and TypeScript config
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built code from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Cloud Run uses PORT environment variable (default 8080)
# but we keep 4000 as fallback for local development
EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/index.js"]

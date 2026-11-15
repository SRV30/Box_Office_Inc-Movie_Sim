# Multi-stage production container configuration for Box Office Inc
# Aligned with Node.js 22 LTS (matches CI workflow in .github/workflows/ci.yml)

# Stage 1: Build Frontend client
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend runtime
FROM node:22-alpine AS backend-runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend application source
COPY backend/ ./

# Copy built frontend assets into public static serving directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Run as non-root user for container security
USER node

# Container healthcheck targeting the API health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

EXPOSE 5000

CMD ["node", "server.js"]

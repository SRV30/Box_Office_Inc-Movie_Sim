# ============================================================
# Box Office Inc — Multi-Stage Production Dockerfile
# ============================================================

# Stage 1: Install backend dependencies
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

LABEL maintainer="Box Office Inc Team"
LABEL description="Box Office Inc - Movie Studio Simulator API"

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy backend dependencies and source
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend assets
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Switch to non-root user
USER appuser

# Start the backend server
WORKDIR /app/backend
CMD ["node", "server.js"]

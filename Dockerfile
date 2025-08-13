# Production Dockerfile for Railway deployment
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build

FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final production image
FROM nginx:alpine

# Install Node.js for the backend
RUN apk add --no-cache nodejs npm curl

# Copy backend build
COPY --from=backend-builder /app/backend/dist /app/backend
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-builder /app/backend/package.json /app/backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist/frontend /usr/share/nginx/html

# Copy nginx config for SPA routing and API proxy
COPY nginx-production.conf /etc/nginx/conf.d/default.conf

# Create database directory
RUN mkdir -p /app/database && chmod 755 /app/database

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/backend && node server.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

EXPOSE ${PORT:-8080}

CMD ["/start.sh"]
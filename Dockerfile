# Neuro-Diagnostic System - production image
# Build:  docker build -t neuro-assessment-system .
# Run:    docker run -p 8080:8080 neuro-assessment-system

FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app

# No runtime dependencies: only the server, its manifest and the static app.
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public ./public

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" >/dev/null || exit 1

CMD ["node", "server.js"]

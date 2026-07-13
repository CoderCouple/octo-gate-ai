# syntax=docker/dockerfile:1.6
FROM node:22-slim AS builder
WORKDIR /repo

# The build context is the REPO ROOT (see .dockerignore). We copy the
# workspace manifests first so npm's dependency graph can install without
# also invalidating on source changes.
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/backend/package.json packages/backend/
COPY packages/widget/package.json packages/widget/
# Skip web — it's not needed for the backend deploy (Vercel hosts it).
RUN npm install --workspaces --include-workspace-root --ignore-scripts --no-audit --no-fund

COPY packages/core packages/core
COPY packages/backend packages/backend
COPY packages/widget packages/widget

# Build order: core (typed API surface) → widget (bundled into backend/public)
# → backend (tsc).
RUN npm run build -w @octogate/core
RUN npm run build -w @octogate/widget
RUN npm run build -w @octogate/backend

# Prune dev deps for the runtime image.
RUN npm prune --omit=dev --workspaces --include-workspace-root

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/core/dist ./packages/core/dist
COPY --from=builder /repo/packages/core/package.json ./packages/core/package.json
COPY --from=builder /repo/packages/backend/dist ./packages/backend/dist
COPY --from=builder /repo/packages/backend/public ./packages/backend/public
COPY --from=builder /repo/packages/backend/package.json ./packages/backend/package.json
COPY --from=builder /repo/package.json ./package.json

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "packages/backend/dist/index.js"]

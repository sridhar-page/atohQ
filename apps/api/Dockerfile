FROM node:20-alpine AS builder

WORKDIR /app

# Copy lockfile and all package.json files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/eslint-config/package*.json ./packages/eslint-config/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build the API with debug checks
RUN npm run build --workspace=api && \
    ls -la apps/api/dist && \
    [ -f apps/api/dist/index.js ] || (echo "ERROR: apps/api/dist/index.js not found after build!" && exit 1)

# Prune devDependencies to keep the image small
# and VERIFY that express still exists in the node_modules structure.
RUN npm prune --omit=dev && \
    ( [ -d node_modules/express ] || [ -d apps/api/node_modules/express ] ) || (echo "ERROR: express removed by prune!" && exit 1)

# Final stage
FROM node:20-alpine

# Set WORKDIR to the API folder to ensure Node finds local and root node_modules
WORKDIR /app/apps/api

# Copy root node_modules (where hoisted things are) to /app/node_modules
COPY --from=builder /app/node_modules /app/node_modules

# Copy built app and config into /app/apps/api/
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/node_modules ./node_modules

EXPOSE 3001

CMD ["npm", "run", "start:prod"]

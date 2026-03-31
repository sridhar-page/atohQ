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

# Build the API
RUN npm run build --workspace=api

# Prune devDependencies to keep the image small
RUN npm prune --omit=dev

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy built app
COPY --from=builder /app/apps/api/dist ./dist
# Copy package.json and Prisma files
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

# Copy pruned node_modules (only production dependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 3001

CMD ["npm", "run", "start:prod"]

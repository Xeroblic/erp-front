# Multi-stage Dockerfile for Vite React app
# Builder stage: install deps and build the app
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools (some deps might need native compilation)
RUN apk add --no-cache python3 g++ make

# Enable corepack and prepare Yarn (Node 20 includes corepack)
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy lockfile and package manifest first for better caching
COPY package.json yarn.lock ./

# Install dependencies (for production build). We avoid --immutable flags here to
# allow Yarn v4 migration inside the build if needed. This stage is used only
# when building production assets.
RUN yarn install || yarn install

# Copy rest of the source and build
COPY . .
RUN yarn build

# Runner stage: serve static files with nginx
FROM nginx:stable-alpine AS runner

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a simple nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# 
### Development stage
# This stage is used by docker-compose.dev.yml via `build.target: dev`.
FROM node:20-alpine AS dev
WORKDIR /app

# Install build tools useful for native deps during development
RUN apk add --no-cache python3 g++ make

# Enable corepack and yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package manifests and install deps (allow migration if yarn wants it)
COPY package.json yarn.lock ./
RUN yarn install || yarn install

# Copy source (during dev we mount the project over /app, but keeping copy
# here ensures image has the files if you run without mounts)
COPY . .

EXPOSE 5173
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]
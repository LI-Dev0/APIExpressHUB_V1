# syntax=docker/dockerfile:1

ARG NODE_VERSION=20-alpine

# Step 1: Base image for all stages
FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app
COPY package.json package-lock.json ./

# Step 2: Test stage - Runs tests during build
FROM base AS test
RUN npm ci
COPY . .
RUN npm test && touch .test-passed

# Step 3: Production dependency installer
FROM base AS deps
# Ensure production build fails if tests fail
COPY --from=test /usr/src/app/.test-passed .test-passed
RUN npm ci --omit=dev

# Step 4: Final production image
FROM node:${NODE_VERSION}
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy production dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application source code
COPY --chown=node:node . .

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 4700

# Run the application.
CMD [ "npm", "start" ]
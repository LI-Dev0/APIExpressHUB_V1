# syntax=docker/dockerfile:1

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION}

ENV NODE_ENV production

WORKDIR /usr/src/app

# Copy dependency files to use Docker layer caching.
COPY package.json package-lock.json ./

# Install dependencies.
RUN npm ci --omit=dev

# Run the application as a non-root user.
USER node

# Copy the rest of the source files and ensure they are owned by the node user.
COPY --chown=node:node . .

# Expose the port that the application listens on.
EXPOSE 4747

# Run the application.
CMD [ "npm", "start" ]
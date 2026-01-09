FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Switch to root to perform installations if needed (though ghcr image usually has what we need)
# The puppeteer image sets a non-root user 'pptruser' by default. 
# We need to switch to root to copy files and install dependencies, then switch back.

USER root

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
# We use --ignore-scripts to prevent puppeteer from trying to download chrome again, 
# as it's already in the base image.
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Clean up dev dependencies to save space (optional, but good practice)
# RUN npm prune --production

# Expose the port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]

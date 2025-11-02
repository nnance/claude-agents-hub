# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-slim

# Install basic development tools and iptables/ipset
RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  aggregate \
  jq \
  nano \
  vim \
  ripgrep \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create .env placeholder (will be provided at runtime)
RUN echo "# Environment variables should be provided at runtime" > .env

# Set user to non-root for security
RUN useradd -m -u 1001 nodejs

USER nodejs

# Set working directory for input files (to be mounted at runtime)
WORKDIR /app/input

# Default entrypoint
ENTRYPOINT ["node", "../dist/index.js"]

# Default command (can be overridden with docker run)
CMD ["Please provide a prompt as a command argument"]

FROM node:20-slim
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Run vite dev server with host flag for container access
CMD ["pnpm", "dev", "--host"]

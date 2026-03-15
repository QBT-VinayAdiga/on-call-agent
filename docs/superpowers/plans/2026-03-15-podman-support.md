# Podman Support Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the project to a multi-container architecture for Podman/Docker Compose, separating the frontend and backend for better development experience (HMR).

**Architecture:** Split the current monolithic Dockerfile into `Dockerfile.backend` and `Dockerfile.frontend`. Orchestrate them using a `docker-compose.yml` that handles networking, proxying, and volume mounting for live reloading.

**Tech Stack:** Podman, Python 3.11, FastAPI, Node.js 20, Vite, Pnpm, `uv`.

---

## File Structure

- **New:** `Dockerfile.backend` - Backend container definition using `uv`.
- **New:** `Dockerfile.frontend` - Frontend container definition using `pnpm`.
- **New:** `docker-compose.yml` - Orchestration for both services.
- **Modify:** `frontend/vite.config.ts` - Remove the proxy path rewrite to match FastAPI's `/api` prefix.
- **Modify:** `.dockerignore` - Ensure it covers both new Dockerfiles.

---

## Chunk 1: Infrastructure Setup

### Task 1: Create Backend Dockerfile

**Files:**
- Create: `Dockerfile.backend`

- [ ] **Step 1: Write the Backend Dockerfile**

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY app/ ./app/

# Expose FastAPI port
EXPOSE 8000

# Run with reload for development
CMD ["uv", "run", uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile.backend
git commit -m "feat: add Dockerfile.backend for decoupled backend service"
```

### Task 2: Create Frontend Dockerfile

**Files:**
- Create: `Dockerfile.frontend`

- [ ] **Step 1: Write the Frontend Dockerfile**

```dockerfile
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
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile.frontend
git commit -m "feat: add Dockerfile.frontend for decoupled frontend service"
```

### Task 3: Create Compose Orchestration

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write the docker-compose.yml**

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app/app
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app/frontend
      - /app/frontend/node_modules
    depends_on:
      backend:
        condition: service_healthy
    environment:
      - VITE_API_URL=http://backend:8000
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose.yml for service orchestration"
```

---

## Chunk 2: Configuration Adjustments

### Task 4: Fix Vite Proxy Configuration

**Files:**
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Update proxy to remove rewrite**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // REMOVED
      },
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "fix: update vite proxy to match backend API prefix"
```

### Task 5.5: Configure Braintrust Settings

**Files:**
- Modify: `app/braintrust_integration.py`
- Modify: `.env.template`

- [ ] **Step 1: Update Braintrust initialization logic**

Update `app/braintrust_integration.py` to use `BRAINTRUST_ORG` and `BRAINTRUST_PROJECT`.

- [ ] **Step 2: Update .env.template**

Add `BRAINTRUST_ORG` and `BRAINTRUST_PROJECT` to the template.

- [ ] **Step 3: Commit**

```bash
git add app/braintrust_integration.py .env.template
git commit -m "chore: configure Braintrust organization and project"
```

---

## Chunk 3: Validation

### Task 6: Verify Build and Connectivity

- [ ] **Step 1: Run with Podman Compose**

Run: `podman compose up --build -d`
Expected: Both containers start, backend healthcheck passes.

- [ ] **Step 2: Verify Health Endpoint**

Run: `curl http://localhost:8000/health`
Expected: `{"status": "ok"}`

- [ ] **Step 3: Verify Frontend Proxy**

Run: `curl http://localhost:127.0.0.1:5173/api/health` (Assuming Vite is on 5173)
Expected: `{"status": "ok"}` (Proxied from backend)

- [ ] **Step 4: Cleanup (Optional)**

Run: `podman compose down`

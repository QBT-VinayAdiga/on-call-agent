# Design Spec: Podman Support for On-Call Agent

**Date:** 2026-03-15
**Status:** Approved
**Topic:** Podman Support (Multi-container architecture)

## 1. Overview
The goal is to provide a seamless development and deployment experience using Podman. This spec transitions the project from a single bundled Dockerfile to a multi-container architecture using `podman compose` (or Docker Compose).

## 2. Architecture
The application will be split into two primary services:

### 2.1. Backend Service (`backend`)
- **Technology:** Python 3.11-slim + FastAPI + LangGraph.
- **Image:** Based on `python:3.11-slim`.
- **Port:** 8000.
- **Responsibilities:**
  - Running the incident analysis graph.
  - Serving API endpoints.
  - Telemetry and redaction logic.

### 2.2. Frontend Service (`frontend`)
- **Technology:** React (Vite) + Tailwind CSS + Pnpm.
- **Image:** Based on `node:20-slim`.
- **Port:** 5173.
- **Responsibilities:**
  - Serving the UI.
  - Hot Module Replacement (HMR) for rapid development.
  - Proxying requests starting with `/api` to the backend service.

## 3. Data Flow
1. User interacts with the Frontend on `localhost:5173`.
2. Vite development server proxies `/api` calls to `http://backend:8000`.
3. Proxy Configuration:
   - Target: `http://backend:8000`
   - Path Rewrite: Removed (FastAPI expects the `/api` prefix).
4. Backend processes the request and returns JSON.

## 4. Orchestration
A `docker-compose.yml` file will be added to the root of the project to define:
- `backend` service:
  - Context: `.`
  - Dockerfile: `Dockerfile.backend`
  - Ports: `8000:8000`
  - Volumes: `./app:/app/app` (for live code reloading).
  - Env: `.env` file containing secrets.
  - Healthcheck: Uses `curl -f http://localhost:8000/health`.
- `frontend` service:
  - Context: `./frontend`
  - Dockerfile: `Dockerfile.frontend`
  - Ports: `5173:5173`
  - Volumes:
    - `./frontend:/app/frontend` (for HMR and config access).
    - Anonymous volume for `node_modules` to prevent host overrides.
  - Depends On: `backend` with `service_healthy`.

## 5. Components to be Created

### 5.1. `Dockerfile.backend`
- Installs `uv` for dependency management.
- Syncs Python dependencies.
- Runs `uvicorn` in watch mode for development (`--reload`).

### 5.2. `Dockerfile.frontend`
- Installs `pnpm`.
- Installs frontend dependencies.
- Runs `vite` in dev mode (`--host` to allow container access).

### 5.3. `docker-compose.yml`
- Defines the services, networking, and volume mounts.
- Includes `env_file: .env` for the backend service.

## 6. Testing and Validation
- **Local Run:** Execute `podman compose up` (preferred) or `docker-compose up`.
- **Connectivity:** Verify that the frontend can reach the backend `/health` and `/invoke` endpoints via the proxy.
- **HMR:** Modify a frontend component and verify the browser updates automatically.
- **Backend Reload:** Modify a backend file and verify `uvicorn` reloads.

## 7. Security
- Use non-root users in production-ready versions of these Dockerfiles.
- Ensure `.env` files containing secrets are ignored by `.dockerignore` and git.

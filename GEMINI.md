# on-call-agent Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-15

## Active Technologies

- Python 3.11+ + FastAPI, LangGraph, Google GenAI SDK (Vertex AI), Braintrust, jsonschema, structlog, tenacity (001-on-call-copilot)
- Podman / Podman Compose (Multi-container architecture)

## Project Structure

```text
app//         # FastAPI backend source
frontend//    # Vite + React source
tests//       # Automated tests
scripts//     # Scenario invokers
```

## Commands

- **Backend**: `uv run uvicorn app.main:app --reload`
- **Frontend**: `cd frontend && pnpm dev`
- **Compose**: `podman compose up --build`
- **Tests**: `uv run python -m pytest`
- **Invoker**: `uv run python scripts/invoke.py scripts/scenarios/sev1_checkout_latency.json`

## Recent Changes

- 001-on-call-copilot: Added Python 3.11+ + FastAPI, LangGraph, Google GenAI SDK (Vertex AI), Braintrust, jsonschema, structlog, tenacity
- 2026-03-15: Added Podman Compose support with split `Dockerfile.backend` and `Dockerfile.frontend`. Configured Braintrust organization as 'Adiga' and project as 'on-call-agent'.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

# On-Call Copilot (LangGraph + Gemini 2.0)

A multi-agent incident analysis system that processes alerts, logs, and metrics to provide technical triage, stakeholder communications, and post-incident reports. Built with LangGraph for orchestration and Google Gemini 2.0 Flash for high-speed, structured inference.

## Key Features

- **Parallel Orchestration**: Uses LangGraph's `Send` API to execute four specialized agents (Triage, Summary, Comms, PIR) simultaneously.
- **Structured Output**: Enforces strict JSON schemas using Gemini 2.0 native JSON mode.
- **Observability**: Deep tracing and evaluation with Braintrust.
- **Security**: Pre-LLM redaction pipeline to strip secrets from logs and alerts.
- **Modern Tooling**: Managed with `uv` for Python and `pnpm` for Vite/React.

## Architecture

- **Orchestration**: LangGraph StateGraph (Fan-out/Fan-in)
- **LLM**: Google Gemini 2.0 Flash
- **API**: FastAPI (Backend)
- **Frontend**: Vite + React + Tailwind CSS
- **Observability**: Braintrust

## Getting Started

### Prerequisites
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- [pnpm](https://pnpm.io/) (Node package manager)
- [Podman](https://podman.io/) or Docker

### Local Setup

1.  **Install dependencies**:
    ```bash
    cd backend && uv sync
    cd ../frontend && pnpm install && cd ..
    ```

2.  **Configure environment**:
    Copy `.env.template` to `.env` in the backend folder and add your API keys:
    ```bash
    cp backend/.env.template backend/.env
    # Required: GEMINI_API_KEY, BRAINTRUST_API_KEY
    ```

3.  **Run the Backend**:
    ```bash
    cd backend && uv run uvicorn app.main:app --reload
    ```

4.  **Run the Frontend**:
    ```bash
    cd frontend && pnpm dev
    ```

## Running with Podman (Compose)

The project uses a multi-container architecture for development with Hot Module Replacement (HMR).

1.  **Start the services**:
    ```bash
    podman compose up --build
    ```
    - **Frontend**: `http://localhost:5173` (with live reload)
    - **Backend**: `http://localhost:8000` (with auto-restart)
    - **API Docs**: `http://localhost:8000/docs`

## Testing & Evaluation

### Scenario Invocation
Test the system against pre-defined incident scenarios:
```bash
cd backend && uv run python scripts/invoke.py scripts/scenarios/sev1_checkout_latency.json
```

### Automated Tests
Run the unit and integration test suite:
```bash
cd backend && uv run python -m pytest
```

### Braintrust Evals
Run evaluations against the "golden set" of incident data:
```bash
cd backend && uv run braintrust eval tests/test_evals.py
```

## Project Structure

- `backend/`: FastAPI backend monorepo source.
  - `app/`: Application source (agents, graph, schemas).
  - `scripts/`: Scenario invokers and evaluation datasets.
  - `tests/`: Unit, integration, and evaluation tests.
  - `Dockerfile`: Container definition for backend.
- `frontend/`: Vite + React + Tailwind CSS source.
- `docs/`: Project-wide documentation and specifications.
- `docker-compose.yml`: Orchestration for local development.
## Braintrust Integration

The system uses Braintrust for observability and evaluation.

- **Organization**: `Adiga`
- **Project**: `on-call-agent`
- **Tracing**: All agent calls are wrapped with `traced_agent_call` for automated spans in the Braintrust UI.

# On-Call Copilot (LangGraph + Gemini)

Multi-agent incident analysis system that processes alerts, logs, and metrics to provide technical triage, stakeholder communications, and post-incident reports.

## Architecture

- **Orchestration**: LangGraph StateGraph (Parallel fan-out)
- **LLM**: Google Gemini 2.0 Flash
- **API**: FastAPI
- **Observability**: Braintrust

## Getting Started

1.  **Install dependencies**:
    ```bash
    uv sync
    ```

2.  **Configure environment**:
    Copy `.env.template` to `.env` and add your API keys:
    ```bash
    cp .env.template .env
    # Edit .env with GEMINI_API_KEY, BRAINTRUST_API_KEY
    ```

3.  **Run the service**:
    ```bash
    uv run uvicorn app.main:app --reload
    ```

4.  **Test an incident**:
    ```bash
    uv run python scripts/invoke.py scripts/scenarios/sev1_checkout_latency.json
    ```

## Running with Podman (Docker)

The project supports both single-container and multi-container architectures.

### Multi-container (Recommended for Development)
Uses `podman compose` (or `docker-compose`) to run the frontend and backend as separate services with Hot Module Replacement (HMR) and live code reloading.

1.  **Configure environment**:
    Ensure `.env` has `GEMINI_API_KEY` and optional `BRAINTRUST_*` settings.

2.  **Start the services**:
    ```bash
    podman compose up --build
    ```
    - **Frontend**: `http://localhost:5173`
    - **Backend**: `http://localhost:8000`

### Single-container (Production-like)
Bundles the React frontend and FastAPI backend into a single image.

1.  **Build the image**:
    ```bash
    podman build -t on-call-agent .
    ```

2.  **Run the container**:
    ```bash
    podman run -p 8000:8000 --env-file .env on-call-agent
    ```
    The bundled application will be available at `http://localhost:8000`.

## Braintrust Integration

The system uses Braintrust for observability and evaluation.

- **Organization**: Configure `BRAINTRUST_ORG` (defaults to `Adiga`).
- **Project**: Configure `BRAINTRUST_PROJECT` (defaults to `on-call-agent`).
- **Tracing**: Wrap agent calls with `traced_agent_call` for automated spans.

## Development

- `app/graph.py`: The LangGraph definition.
- `app/agents/`: Individual agent nodes (Triage, Summary, Comms, PIR).
- `app/schemas.py`: Input/Output JSON schemas and system instructions.
- `tests/`: Automated test suite.

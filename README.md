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

## Running with Docker (Podman)

The project includes a multi-stage `Dockerfile` that bundles the React frontend and FastAPI backend into a single container.

1.  **Build the image**:
    ```bash
    podman build -t on-call-agent .
    ```

2.  **Run the container**:
    ```bash
    podman run -p 8000:8000 --env-file .env on-call-agent
    ```
    The application will be available at `http://localhost:8000`.

## Development

- `app/graph.py`: The LangGraph definition.
- `app/agents/`: Individual agent nodes (Triage, Summary, Comms, PIR).
- `app/schemas.py`: Input/Output JSON schemas and system instructions.
- `tests/`: Automated test suite.

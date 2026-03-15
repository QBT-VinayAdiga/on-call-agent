# app/main.py

import uuid
import logging
import jsonschema
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, APIRouter
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# Import Braintrust integration to initialize it
import app.braintrust_integration
from app.graph import create_incident_graph
from app.schemas import INCIDENT_INPUT_SCHEMA
from app.telemetry import redact_secrets, get_correlation_id

# Load environment variables
load_dotenv()

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="On-Call Copilot — LangGraph + Gemini", version="2.0.0")

# Router for API endpoints called by the frontend (matches the /api prefix in UI code)
api_router = APIRouter(prefix="/api")

# Lazy-load graph to allow dependency injection or overrides
_graph = None
def get_graph():
    global _graph
    if _graph is None:
        _graph = create_incident_graph()
    return _graph

@api_router.post("/invoke")
async def invoke_incident(request: Request) -> JSONResponse:
    try:
        payload = await request.json()
        # Handle both direct incident object or {incident: {}, provider: ""}
        if "incident" in payload:
            incident = payload["incident"]
            provider = payload.get("provider", "gemini")
        else:
            incident = payload
            provider = "gemini"
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 1. Validate input against schema
    try:
        jsonschema.validate(instance=incident, schema=INCIDENT_INPUT_SCHEMA)
    except jsonschema.ValidationError as e:
        raise HTTPException(status_code=422, detail=e.message)

    # 2. Redact secrets BEFORE any LLM invocation
    incident = redact_secrets(incident)

    # 3. Generate correlation ID for tracing
    correlation_id = get_correlation_id()
    logger.info("incident_received", extra={
        "incident_id": incident.get("incident_id"),
        "correlation_id": correlation_id,
        "severity": incident.get("severity"),
        "provider": provider
    })

    # 4. Invoke the LangGraph StateGraph
    initial_state = {
        "incident": incident,
        "triage_output": None,
        "summary_output": None,
        "comms_output": None,
        "pir_output": None,
        "correlation_id": correlation_id,
        "agent_errors": {},
        "telemetry": {"provider_override": provider},
    }

    try:
        graph = get_graph()
        result = await graph.ainvoke(initial_state)
    except Exception as e:
        logger.error("graph_invocation_failed", extra={"error": str(e), "correlation_id": correlation_id})
        raise HTTPException(status_code=500, detail="Internal processing error")

    # 5. Handle partial or total failure
    agent_errors = result.get("telemetry", {}).get("agent_errors", {})
    if len(agent_errors) >= 4:
        logger.error("all_agents_failed", extra={"correlation_id": correlation_id, "errors": agent_errors})
        raise HTTPException(status_code=500, detail={
            "message": "All analysis agents failed",
            "errors": agent_errors
        })

    return JSONResponse(content=result, status_code=200)

@api_router.post("/structure")
async def structure_incident(request: Request) -> JSONResponse:
    correlation_id = get_correlation_id()
    try:
        data = await request.json()
        raw_text = data.get("text", "")
        provider = data.get("provider", "openrouter")

        logger.info("structure_request_received", extra={
            "correlation_id": correlation_id,
            "text_length": len(raw_text) if raw_text else 0,
            "provider": provider
        })
        
        if not raw_text:
            raise HTTPException(status_code=400, detail="No text provided")
        
        from app.llm_client import structure_incident_data
        structured_data = structure_incident_data(raw_text, provider=provider)
        return JSONResponse(content=structured_data, status_code=200)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("structuring_failed", extra={
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail=f"Failed to structure incident data: {str(e)}")

# Register the API router
app.include_router(api_router)

# Health checks at the root level
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ready")
async def ready():
    # Simple check for model availability (if configured)
    return {"status": "ready"}

# Serve static files from the frontend/dist directory
# This must be at the end to not catch API routes
# In Docker, we copy the build output to /app/frontend/dist
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

# Observability Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate Braintrust tracing into a unified request hierarchy and remove agent-level boilerplate using a decorator.

**Architecture:** 
1. A root Braintrust span is created at the FastAPI route level for each request.
2. A `@trace_agent_node` decorator handles child spans, timing, and error reporting for LangGraph agents.
3. `structure_incident_data` is instrumented to ensure full visibility.
4. Token usage and correlation IDs are explicitly tracked in all spans.

**Tech Stack:** FastAPI, Braintrust, LangGraph, structlog

---

## Chunk 1: Infrastructure & Core Decorator

### Task 1: Create the `@trace_agent_node` Decorator

**Files:**
- Modify: `backend/app/braintrust_integration.py`

- [ ] **Step 1: Implement the decorator**
    Add the `trace_agent_node` function to handle spans, timing, and error state.

```python
import functools
import time
from app.telemetry import logger

def trace_agent_node(name: str, output_key: str):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(state: "AgentState", *args, **kwargs):
            incident = state.get("incident", {})
            correlation_id = state.get("correlation_id")
            
            with braintrust.start_span(
                name=name, 
                input={"incident_id": incident.get("incident_id"), "correlation_id": correlation_id}
            ) as span:
                start = time.monotonic()
                try:
                    # Execute the node function
                    result = func(state, *args, **kwargs)
                    
                    latency_ms = (time.monotonic() - start) * 1000
                    
                    # Log to Braintrust
                    span.log(
                        output=result, 
                        metrics={"latency_ms": latency_ms},
                        metadata={"correlation_id": correlation_id}
                    )
                    
                    # Structured logging
                    logger.info(f"agent_node_success", extra={
                        "node": name,
                        "latency_ms": latency_ms,
                        "correlation_id": correlation_id
                    })
                    
                    return {output_key: result}
                    
                except Exception as e:
                    latency_ms = (time.monotonic() - start) * 1000
                    span.log(
                        output={"_error": str(e)}, 
                        metrics={"latency_ms": latency_ms},
                        status="error",
                        metadata={"correlation_id": correlation_id}
                    )
                    logger.error(f"agent_node_failed", extra={
                        "node": name,
                        "error": str(e),
                        "correlation_id": correlation_id
                    })
                    return {
                        output_key: {},
                        "agent_errors": {name.split("-")[0]: str(e)}
                    }
        return wrapper
    return decorator
```

- [ ] **Step 2: Commit changes**
```bash
git add backend/app/braintrust_integration.py
git commit -m "feat: add trace_agent_node decorator in braintrust_integration.py"
```

---

## Chunk 2: Root Tracing & Instrumentation

### Task 2: Implement Root Spans in `main.py`

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Wrap `/api/invoke` in a root span**
    Modify the `invoke_incident` route to start a Braintrust span that covers the entire request.

- [ ] **Step 2: Wrap `/api/structure` in a root span**
    Modify the `structure_incident` route to start a Braintrust span.

- [ ] **Step 3: Commit changes**
```bash
git add backend/app/main.py
git commit -m "feat: wrap API routes in root Braintrust spans"
```

### Task 3: Instrument `structure_incident_data`

**Files:**
- Modify: `backend/app/llm_client.py`

- [ ] **Step 1: Wrap `structure_incident_data` logic with `braintrust.start_span`**

- [ ] **Step 2: Commit changes**
```bash
git add backend/app/llm_client.py
git commit -m "feat: instrument structure_incident_data with Braintrust"
```

---

## Chunk 3: Agent Refactoring

### Task 4: Refactor Triage Agent

**Files:**
- Modify: `backend/app/agents/triage.py`

- [ ] **Step 1: Apply `@trace_agent_node` and remove boilerplate**

- [ ] **Step 2: Commit changes**
```bash
git add backend/app/agents/triage.py
git commit -m "refactor: use decorator for triage agent"
```

### Task 5: Refactor Summary Agent

**Files:**
- Modify: `backend/app/agents/summary.py`

- [ ] **Step 1: Apply `@trace_agent_node` and remove boilerplate**

- [ ] **Step 2: Commit changes**
```bash
git add backend/app/agents/summary.py
git commit -m "refactor: use decorator for summary agent"
```

### Task 6: Refactor Comms & PIR Agents

**Files:**
- Modify: `backend/app/agents/comms.py`
- Modify: `backend/app/agents/pir.py`

- [ ] **Step 1: Apply `@trace_agent_node` and remove boilerplate in both files**

- [ ] **Step 2: Commit changes**
```bash
git add backend/app/agents/comms.py backend/app/agents/pir.py
git commit -m "refactor: use decorator for comms and pir agents"
```

---

## Chunk 4: Verification

### Task 7: Final Verification

- [ ] **Step 1: Run backend tests**
Run: `cd backend && uv run python -m pytest`
Expected: All tests PASS.

- [ ] **Step 2: Verify tracing with a manual invocation**
Run: `cd backend && uv run python scripts/invoke.py scripts/scenarios/sev1_checkout_latency.json`
Expected: Script succeeds, and Braintrust (if logged) would show the hierarchical spans.

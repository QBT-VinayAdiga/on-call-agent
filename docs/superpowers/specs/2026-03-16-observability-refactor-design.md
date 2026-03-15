# Design: Observability Refactor (Unified Tracing & Metrics)

**Date**: 2026-03-16
**Status**: Draft
**Owner**: Gemini CLI

## 1. Problem Statement
The current observability setup for the On-Call Copilot project is fragmented. 
- Braintrust spans are disconnected ("orphan" spans) because there is no parent request trace.
- Agent node logic is cluttered with 20+ lines of repetitive Braintrust boilerplate.
- Key LLM functions (like `structure_incident_data`) are not instrumented.
- Manual latency calculation is duplicated across multiple files.

## 2. Proposed Design

### 2.1 Unified Request Tracing (Root Spans)
We will wrap the entire request lifecycle in `backend/app/main.py` (specifically for `/api/invoke` and `/api/structure`) in a parent Braintrust span.

**Details:**
- **Parent Span**: `incident-analysis` or `incident-structuring`.
- **Metadata**: Attach `correlation_id`, `incident_id`, and `severity` at the root level.
- **Context Propagation**: By starting a root span at the FastAPI route level, all downstream agent calls will automatically become child spans in Braintrust.

### 2.2 Agent Node Decorator (`@trace_agent_node`)
We will implement a decorator in `backend/app/braintrust_integration.py` to handle the heavy lifting of tracing, timing, and error state management.

**Decorator Responsibilities:**
- Start/End Braintrust child spans.
- Capture `latency_ms` metrics.
- Catch `LLMCallError` and generic `Exception`.
- Update the LangGraph `AgentState` with outputs and errors.

**Example Implementation (Conceptual):**
```python
def trace_agent_node(name: str, output_key: str):
    def decorator(func):
        def wrapper(state: AgentState):
            with braintrust.start_span(name=name, input=state["incident"]) as span:
                start = time.monotonic()
                try:
                    result = func(state)
                    latency = (time.monotonic() - start) * 1000
                    span.log(output=result, metrics={"latency_ms": latency})
                    return {output_key: result}
                except Exception as e:
                    # Log error to span and state
                    ...
        return wrapper
    return decorator
```

### 2.3 Instrumentation of `structure_incident_data`
Wrap the core LLM logic in `backend/app/llm_client.py`'s `structure_incident_data` function with a Braintrust span named `structure-incident-data`.

## 3. Alternative Approaches Considered

### 3.1 Approach A: Manual Wrapping (Current)
Keep the manual `braintrust.start_span` in every agent.
- **Pros**: Explicit, no magic decorators.
- **Cons**: Extremely repetitive, high risk of inconsistent error handling, harder to refactor.

### 3.2 Approach B: OpenTelemetry (OTel)
Replace Braintrust with a full OTel stack (Jaeger/Prometheus).
- **Pros**: Industry standard, decoupled from LLM providers.
- **Cons**: Overkill for the current prototype phase; doesn't integrate as natively with Braintrust's AI-specific evaluation features.

### 3.3 Approach C: Decorator + Middleware (Selected)
- **Pros**: Cleanest code, unified traces, consistent metrics. Best balance of effort and visibility for AI-native applications.

## 4. Implementation Plan
1. Create `@trace_agent_node` in `braintrust_integration.py`.
2. Wrap `/api/invoke` and `/api/structure` in `main.py` with a root span.
3. Refactor all 4 agents (`triage`, `summary`, `comms`, `pir`) to use the decorator.
4. Wrap `structure_incident_data` in `llm_client.py` with a span.
5. Verify end-to-end tracing in the Braintrust UI.

## 5. Success Criteria
- [ ] A single trace ID links the FastAPI request to all downstream agent calls in Braintrust.
- [ ] No manual `time.monotonic()` or `span.log` boilerplate remains in agent files.
- [ ] All LLM calls (including structuring) are visible in Braintrust.
- [ ] `latency_ms` metrics are consistently recorded for all steps.

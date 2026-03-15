# Implementation Plan: On-Call Copilot

**Branch**: `001-on-call-copilot` | **Date**: 2026-03-15 | **Spec**: [specs/001-on-call-copilot/spec.md](spec.md)
**Input**: Feature specification from `specs/001-on-call-copilot/spec.md` and Technical Specification from `spec.md`.

## Summary
Implement a multi-agent incident analysis system using LangGraph for parallel orchestration of four specialized Gemini-powered agents (Triage, Summary, Comms, PIR). The system features pre-LLM secret redaction, Braintrust for tracing and evals, and is served via FastAPI on GCP Cloud Run.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, LangGraph, Google GenAI SDK (Vertex AI), Braintrust, jsonschema, structlog, tenacity
**Storage**: Stateless (incident data provided per-request); Braintrust for telemetry storage
**Testing**: pytest, Braintrust Evals, jsonschema for output validation
**Target Platform**: GCP Cloud Run
**Project Type**: web-service (REST API)
**Performance Goals**: < 10s P95 end-to-end latency for 4 parallel agents
**Constraints**: < 4096 output tokens per agent, pre-LLM redaction mandatory, schema-enforced JSON mode
**Scale/Scope**: 4 parallel agents, 10k incidents/month capacity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Parallel Execution**: Plan uses LangGraph `Send` API for true parallel agent dispatch.
- [x] **II. Schema-Guaranteed JSON Output**: Plan uses Gemini `response_schema` and `response_mime_type="application/json"`.
- [x] **III. Graceful Degradation & Isolation**: Plan captures per-agent errors in `AgentState` and returns partial results.
- [x] **IV. Pre-LLM Secret Redaction**: Plan implements a regex-based redaction pipeline in the FastAPI entry point.
- [x] **V. Continuous Improvement via Evals**: Plan includes Braintrust eval setup and golden-set testing.

## Project Structure

### Documentation (this feature)

```text
specs/001-on-call-copilot/
├── plan.md              # This file
├── research.md          # Decision log for tech choices
├── data-model.md        # State and Schema definitions
├── quickstart.md        # Local setup instructions
├── contracts/           # API and Agent Schemas
└── tasks.md             # Generated tasks
```

### Source Code (repository root)

```text
app/
├── agents/
│   ├── triage.py
│   ├── summary.py
│   ├── comms.py
│   └── pir.py
├── main.py              # FastAPI entry point & redaction
├── graph.py             # LangGraph StateGraph & fan-out/merge
├── schemas.py           # Input/Output JSON schemas
├── gemini_client.py     # Vertex AI wrapper
├── braintrust_integration.py
└── telemetry.py         # Logging & Redaction logic
scripts/
├── invoke.py            # CLI test tool
├── run_scenarios.py     # Scenario tests
├── fixtures/            # Mock data
└── golden_outputs/      # Eval data
tests/
├── test_agents.py
├── test_redaction.py
└── test_evals.py
```

**Structure Decision**: Single project (Option 1) as it's a focused Python microservice.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

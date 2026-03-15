<!--
Sync Impact Report:
- Version change: template → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Parallel Execution
  - [PRINCIPLE_2_NAME] → II. Schema-Guaranteed JSON Output
  - [PRINCIPLE_3_NAME] → III. Graceful Degradation & Isolation
  - [PRINCIPLE_4_NAME] → IV. Pre-LLM Secret Redaction
  - [PRINCIPLE_5_NAME] → V. Continuous Improvement via Evals
- Added sections:
  - Core Technology Stack
  - Development & Quality Standards
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/tasks-template.md (✅ updated)
  - .specify/templates/plan-template.md (✅ updated)
- Follow-up TODOs: None
-->

# On-Call Copilot Constitution

## Core Principles

### I. Parallel Execution
All specialized agents (Triage, Summary, Comms, PIR) MUST run in parallel using the LangGraph `Send` API. This ensures fast response times and prevents a single agent's failure from blocking others.

### II. Schema-Guaranteed JSON Output
Every agent MUST enforce its output format via Gemini's native JSON mode and a strict `response_schema`. This guarantees that downstream consumers receive predictable, structured data.

### III. Graceful Degradation & Isolation
Agents MUST be stateless and isolated. A failure in one agent SHOULD NOT cause the entire request to fail. The system MUST return partial results where possible, explicitly flagging errors in telemetry.

### IV. Pre-LLM Secret Redaction
All incident data MUST pass through a redaction pipeline BEFORE being sent to any LLM. This prevents sensitive information (API keys, tokens, PII) from ever reaching model providers or being logged.

### V. Continuous Improvement via Evals
All prompt and logic changes MUST be validated against a "golden set" of incident data using Braintrust evals. Performance metrics MUST be tracked to prevent regressions.

## Core Technology Stack
- **Orchestration**: LangGraph StateGraph
- **LLM**: Google Gemini 2.0 Flash (via Vertex AI)
- **API Framework**: FastAPI
- **Observability**: Braintrust (Tracing + Evals)
- **Infrastructure**: GCP Cloud Run

## Development & Quality Standards
- **Local Development**: MUST support `MOCK_MODE` to allow development and CI without live LLM dependencies.
- **Testing**: Every agent node MUST have unit tests for its schema and logic. Integration tests SHOULD verify live LLM behavior.
- **CI/CD**: Automated deployment via GitHub Actions, including mandatory eval steps before production rollout.

## Governance
- The Constitution is the source of truth for all architectural decisions.
- Amendments require a version bump and updated Sync Impact Report.
- All Pull Requests MUST be reviewed for compliance with Core Principles.
- Versioning follows Semantic Versioning rules (MAJOR.MINOR.PATCH).

**Version**: 1.0.0 | **Ratified**: 2026-03-15 | **Last Amended**: 2026-03-15

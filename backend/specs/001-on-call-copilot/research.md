# Research: On-Call Copilot

## Decision Log

### Decision: LangGraph Parallel Orchestration (Send API)
- **Status**: Finalized
- **Rationale**: LangGraph's `Send` API allows for true parallel dispatch of agents without inter-agent state dependencies. This fulfills the Constitution's parallel execution mandate.
- **Alternatives considered**: Microsoft ConcurrentBuilder (rejected: less composable, more complex boilerplate).

### Decision: OpenRouter 2.0 Flash
- **Status**: Finalized
- **Rationale**: High speed and low cost ($0.0012/call) make it ideal for real-time incident triage. Built-in JSON schema enforcement at inference time ensures reliability.
- **Alternatives considered**: Azure OpenAI (rejected: higher cost, no native JSON schema mode).

### Decision: Pre-LLM Secret Redaction
- **Status**: Finalized
- **Rationale**: Redacting secrets (keys, tokens) *before* LLM call ensures security compliance and prevents leakage to model provider logs.
- **Alternatives considered**: Post-LLM redaction (rejected: does not protect the model provider logs).

### Decision: Braintrust for Evals & Tracing
- **Status**: Finalized
- **Rationale**: Purpose-built for LLM evaluation workflows. Golden-set testing allows for deterministic performance measurement.
- **Alternatives considered**: OpenTelemetry (rejected: less focused on LLM-specific evaluation).

### Decision: FastAPI & Cloud Run
- **Status**: Finalized
- **Rationale**: Lightweight, async-native, and serverless. Ideal for short-lived, bursty incident analysis workloads.
- **Alternatives considered**: Microsoft Agent Framework (rejected: too much overhead for this simple use case).

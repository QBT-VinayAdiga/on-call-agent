# Feature Specification: On-Call Copilot

**Feature Branch**: `001-on-call-copilot`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Implement On-Call Copilot multi-agent system using LangGraph, OpenRouter, and Braintrust"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Incident Triage & Analysis (Priority: P1)

As an on-call engineer, I want the system to automatically analyze incoming incident data (alerts, logs, metrics) and provide suspected root causes and immediate remediation steps so that I can reduce Mean Time to Resolution (MTTR).

**Why this priority**: This is the core value proposition of the copilot. It provides immediate technical assistance during high-pressure outages.

**Independent Test**: Can be fully tested by submitting a sample incident payload (e.g., SEV1 database outage) and verifying the system returns specific, evidence-backed hypotheses and prioritize actions.

**Acceptance Scenarios**:

1. **Given** an incident with high database CPU metrics and connection pool errors in logs, **When** the system processes the incident, **Then** it must return a "database saturation" hypothesis with at least 0.8 confidence and suggest scaling the instance or checking connection settings.
2. **Given** an incident with sparse data (e.g., only a title and no logs), **When** the system processes it, **Then** it must return 0.0 confidence for hypotheses and list specific diagnostic questions in "missing information".

---

### User Story 2 - Stakeholder Communications (Priority: P2)

As an incident commander, I want the system to generate formatted Slack updates for engineers and jargon-free summaries for non-technical stakeholders so that I can keep all parties informed without manual writing effort.

**Why this priority**: Communication is a major overhead during incidents. Automating this ensures consistency and speed.

**Independent Test**: Submit an incident and verify the output contains both a Slack-formatted string (with emojis and bold text) and a separate plain-language executive summary.

**Acceptance Scenarios**:

1. **Given** a SEV2 latency incident, **When** the comms agent runs, **Then** the Slack update must include the :warning: emoji, the current status, and customer impact, while the stakeholder update must explain the impact on users without mentioning "P95 latency" or "service mesh".

---

### User Story 3 - Post-Incident Reporting (Priority: P3)

As a site reliability engineer, I want the system to generate a draft Post-Incident Report (PIR) including a chronological timeline and prevention actions so that I can complete the post-mortem process more efficiently.

**Why this priority**: PIRs are often delayed because manual timeline reconstruction is tedious. This automates the hardest part of the post-mortem.

**Independent Test**: Submit an incident with multiple timestamped alerts/logs and verify the generated PIR contains a chronologically ordered timeline and at least one specific "prevention action" with a due date.

**Acceptance Scenarios**:

1. **Given** an incident with events at 14:03Z and 14:07Z, **When** the PIR agent runs, **Then** the timeline must show these events in order with correct timestamps, and provide a quantified customer impact (e.g., error rate percentage).

---

### Edge Cases

- **Credential Exposure**: What happens when a user accidentally includes an API key in the incident log? The system must redact it before it reaches any external model.
- **Agent Timeout**: How does the system handle one agent (e.g., PIR agent) hanging while others finish? The system must return the results from the successful agents and flag the failure in telemetry.
- **Insufficient Data**: If the incident payload is empty or invalid, the system must reject it before starting the analysis process.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST process four analysis tasks (Triage, Summary, Comms, PIR) in parallel.
- **FR-002**: System MUST redact sensitive patterns (API keys, Bearer tokens, passwords) from input data before LLM invocation.
- **FR-003**: System MUST return structured JSON matching a pre-defined schema for every agent.
- **FR-004**: System MUST handle partial agent failures by returning available data and an error report.
- **FR-005**: System MUST log every invocation with a unique correlation ID for end-to-end tracing.
- **FR-006**: System MUST support a "mock mode" for testing that returns deterministic fixture data instead of calling live LLMs.

### Key Entities *(include if feature involves data)*

- **Incident**: The input payload containing ID, title, severity, logs, alerts, and metrics.
- **Triage Report**: Hypotheses, evidence, confidence scores, and remediation steps.
- **Post-Incident Report**: A chronological timeline of events and assignable prevention actions.
- **Telemetry**: Metadata about the execution, including latency per agent and any error details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: End-to-end processing of a standard incident (4 agents) must complete in under 10 seconds (p95).
- **SC-002**: 100% of outputs must pass JSON schema validation against their respective agent schemas.
- **SC-003**: 0% of raw secrets (matching defined patterns) should be present in the final output or logs.
- **SC-004**: System must successfully return a partial response if up to 3 agents fail.

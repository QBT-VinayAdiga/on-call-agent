# On-Call Copilot — LangGraph + Gemini + Braintrust
### Technical Specification · v2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Input Schema](#input-schema)
5. [Agent Definitions](#agent-definitions)
6. [LangGraph Implementation](#langgraph-implementation)
7. [Gemini Configuration](#gemini-configuration)
8. [Braintrust Integration](#braintrust-integration)
9. [Output Merge](#output-merge)
10. [Error Handling & Resilience](#error-handling--resilience)
11. [Security & Secret Redaction](#security--secret-redaction)
12. [REST API](#rest-api)
13. [Observability & Monitoring](#observability--monitoring)
14. [Environment Variables](#environment-variables)
15. [Local Development](#local-development)
16. [Testing Strategy](#testing-strategy)
17. [Deployment](#deployment)
18. [Cost Estimation](#cost-estimation)
19. [Migration from Original](#migration-from-original)
20. [File Structure](#file-structure)
21. [Design Principles](#design-principles)

---

## Overview

This document specifies the **LangGraph + Google Gemini + Braintrust** implementation of the On-Call Copilot multi-agent system. It replaces the original Microsoft Agent Framework + Azure OpenAI stack while preserving identical functional behavior.

**Four specialized agents** run in parallel to process an incoming incident and return a unified structured JSON response covering triage, summary, communications, and post-incident reporting.

### Goals

| Goal | Approach |
|------|----------|
| Parallel agent execution | LangGraph `Send` API |
| Fast, cost-effective inference | Gemini 2.0 Flash |
| Schema-guaranteed outputs | Gemini JSON mode + `response_schema` |
| Observability | Braintrust tracing + evals |
| Secret safety | Pre-LLM redaction pipeline |
| Continuous improvement | Braintrust golden-set evals + A/B prompt experiments |

---

## Architecture

### Request Flow

```
                         Incident JSON (HTTP POST /invoke)
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │   FastAPI Entry Point   │
                         │  (auth, validation,     │
                         │   correlation_id gen)   │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  Secret Redaction       │
                         │  Pipeline               │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  LangGraph StateGraph   │
                         │  (compiled graph)       │
                         └────────────┬───────────┘
                                      │
                               fan_out (Send)
                                      │
            ┌─────────────┬───────────┼───────────┬─────────────┐
            │             │           │           │
            ▼             ▼           ▼           ▼
     ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐
     │  Triage  │  │ Summary  │ │  Comms   │ │   PIR    │
     │  Agent   │  │  Agent   │ │  Agent   │ │  Agent   │
     └────┬─────┘  └────┬─────┘ └────┬─────┘ └────┬─────┘
          │             │            │             │
          └─────────────┴────────────┴─────────────┘
                                      │
                               fan_in (merge)
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  merge_node             │
                         │  (assemble response)    │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         Structured JSON Response
```

### Agent Interaction Model

Each agent is **stateless and isolated** — they receive the full incident payload independently. There is no inter-agent dependency or chaining. This means:

- Any single agent failure degrades output gracefully (partial response) rather than failing the whole call.
- All four can be retried independently without re-running siblings.
- The merge node handles `None` values from failed agents explicitly.

### Sequence Diagram

```
Client          FastAPI          StateGraph       Gemini API        Braintrust
  │               │                  │                 │                │
  │─POST /invoke─▶│                  │                 │                │
  │               │─validate+redact─▶│                 │                │
  │               │                  │─Send(triage)───▶│                │
  │               │                  │─Send(summary)──▶│                │
  │               │                  │─Send(comms)────▶│                │
  │               │                  │─Send(pir)──────▶│                │
  │               │                  │                 │─trace span────▶│
  │               │                  │◀────responses───│                │
  │               │                  │─merge_node──────────────────────▶│
  │               │                  │                                  │
  │◀─JSON response│◀─────────────────│                 │                │
```

---

## Technology Stack

| Component | Original | This Spec | Rationale |
|-----------|----------|-----------|-----------|
| Orchestration | Microsoft ConcurrentBuilder | LangGraph StateGraph | Open-source, composable, testable |
| LLM | Azure OpenAI (Model Router) | Google Gemini 2.0 Flash | Speed, native JSON mode, cost |
| Evals & Tracing | OpenTelemetry + custom | Braintrust | Purpose-built for LLM eval workflows |
| Serving | Microsoft Agent Framework | FastAPI + LangServe | Lightweight, async, portable |
| Auth | DefaultAzureCredential | Google Application Default Credentials | GCP-native |
| Container platform | Microsoft Foundry | GCP Cloud Run | Serverless, auto-scaling |

---

## Input Schema

The incident input envelope is **unchanged** from the original spec. All validation is performed before the graph is invoked.

```python
# app/schemas.py

INCIDENT_INPUT_SCHEMA: dict = {
    "type": "object",
    "required": ["incident_id", "title", "severity", "timeframe"],
    "properties": {
        "incident_id": {
            "type": "string",
            "description": "Unique identifier, e.g. INC-20240915-042"
        },
        "title": {
            "type": "string",
            "description": "Short incident title"
        },
        "severity": {
            "type": "string",
            "enum": ["SEV1", "SEV2", "SEV3", "SEV4"],
            "description": "SEV1 = complete outage, SEV4 = minor degradation"
        },
        "timeframe": {
            "type": "object",
            "required": ["start"],
            "properties": {
                "start": {"type": "string", "format": "date-time"},
                "end": {"type": ["string", "null"], "format": "date-time"},
            },
        },
        "alerts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "value": {"type": "string"},
                    "threshold": {"type": "string"},
                    "fired_at": {"type": "string", "format": "date-time"}
                }
            }
        },
        "logs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "timestamp": {"type": "string", "format": "date-time"},
                    "level": {"type": "string", "enum": ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]},
                    "message": {"type": "string"},
                    "service": {"type": "string"}
                }
            }
        },
        "metrics": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "value": {"type": "number"},
                    "unit": {"type": "string"},
                    "timestamp": {"type": "string", "format": "date-time"}
                }
            }
        },
        "runbook_excerpt": {
            "type": "string",
            "description": "Relevant runbook section, if available"
        },
        "constraints": {
            "type": "object",
            "properties": {
                "no_rollback": {"type": "boolean"},
                "change_freeze": {"type": "boolean"},
                "affected_regions": {"type": "array", "items": {"type": "string"}}
            }
        },
    },
}
```

### Input Validation

Validation runs at the FastAPI layer (via `jsonschema`) **before** any LLM call:

```python
from jsonschema import validate, ValidationError

def validate_incident(payload: dict) -> None:
    try:
        validate(instance=payload, schema=INCIDENT_INPUT_SCHEMA)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Invalid incident payload: {e.message}")
```

---

## Agent Definitions

All agents share these properties unless noted:

- **Model:** `gemini-2.0-flash`
- **Output format:** JSON enforced via `response_mime_type="application/json"` and `response_schema`
- **Failure mode:** Returns `{}` with an `_error` key — never raises to the graph

---

### Agent 1 — Triage Agent

**Responsibility:** Root cause analysis, immediate remediation actions, data gap identification, runbook alignment.

| Property | Value |
|----------|-------|
| Name | `triage-agent` |
| LangGraph node | `triage_node` |
| Model | `gemini-2.0-flash` |
| Timeout | 30s |
| Max retries | 3 |

#### Output Schema

```python
TRIAGE_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["suspected_root_causes", "immediate_actions", "missing_information", "runbook_alignment"],
    "properties": {
        "suspected_root_causes": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["hypothesis", "evidence", "confidence"],
                "properties": {
                    "hypothesis": {"type": "string"},
                    "evidence": {"type": "array", "items": {"type": "string"}},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                }
            }
        },
        "immediate_actions": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["step", "owner_role", "priority"],
                "properties": {
                    "step": {"type": "string"},
                    "owner_role": {"type": "string"},
                    "priority": {"type": "string", "enum": ["P0", "P1", "P2", "P3"]}
                }
            }
        },
        "missing_information": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["question", "why_it_matters"],
                "properties": {
                    "question": {"type": "string"},
                    "why_it_matters": {"type": "string"}
                }
            }
        },
        "runbook_alignment": {
            "type": "object",
            "properties": {
                "matched_steps": {"type": "array", "items": {"type": "string"}},
                "gaps": {"type": "array", "items": {"type": "string"}}
            }
        }
    }
}
```

#### System Instructions

```
You are an expert Site Reliability Engineer performing real-time incident triage.
Analyze the provided incident data and return a structured JSON triage report.

Rules:
- Never invent evidence. Only cite data present in alerts, logs, or metrics.
- If data is insufficient to establish a hypothesis, set confidence: 0 and populate missing_information.
- For sparse incidents with little signal, populate immediate_actions with diagnostic steps.
- All secrets, tokens, and credentials visible in logs must be omitted from your output.
- immediate_actions must be specific, not generic ("Check CloudSQL CPU utilization in us-central1"
  not "Check the database").
- Do not speculate beyond what the data supports.
- Respect constraints: if no_rollback is true, never suggest rollback in immediate_actions.
```

#### Guardrails

| Condition | Behavior |
|-----------|----------|
| Secrets in logs | Redacted to `[REDACTED]` **before** LLM call |
| Sparse data | `confidence: 0.0` on all hypotheses, `missing_information` fully populated |
| No runbook provided | `runbook_alignment.matched_steps: []`, `gaps: ["No runbook provided"]` |
| Constraint violations | `immediate_actions` must respect `constraints` (e.g. no rollback if `no_rollback: true`) |

---

### Agent 2 — Summary Agent

**Responsibility:** Concise, factual incident narrative for SRE teams.

| Property | Value |
|----------|-------|
| Name | `summary-agent` |
| LangGraph node | `summary_node` |
| Model | `gemini-2.0-flash` |
| Timeout | 20s |
| Max retries | 3 |

#### Output Schema

```python
SUMMARY_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["summary"],
    "properties": {
        "summary": {
            "type": "object",
            "required": ["what_happened", "current_status"],
            "properties": {
                "what_happened": {
                    "type": "string",
                    "description": "2-4 sentence factual summary of the incident"
                },
                "current_status": {
                    "type": "string",
                    "description": "One of: ONGOING | MITIGATED | MONITORING | RESOLVED, followed by detail"
                }
            }
        }
    }
}
```

#### System Instructions

```
You are an SRE technical writer. Given the incident data, write a clear, factual incident summary.

Rules:
- what_happened: 2-4 sentences only. Be specific. Cite actual values (error rates, latency numbers).
- current_status: Start with exactly one of ONGOING | MITIGATED | MONITORING | RESOLVED,
  then a colon, then a brief explanation.
- No speculation, no jargon the SRE on-call wouldn't know.
- Use past tense for events that have concluded; present tense for ongoing conditions.
```

---

### Agent 3 — Comms Agent

**Responsibility:** Audience-appropriate communications — a Slack update for the SRE channel and a non-technical executive summary.

| Property | Value |
|----------|-------|
| Name | `comms-agent` |
| LangGraph node | `comms_node` |
| Model | `gemini-2.0-flash` |
| Timeout | 20s |
| Max retries | 3 |

#### Output Schema

```python
COMMS_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["comms"],
    "properties": {
        "comms": {
            "type": "object",
            "required": ["slack_update", "stakeholder_update"],
            "properties": {
                "slack_update": {
                    "type": "string",
                    "description": "Slack-formatted string with emoji, severity, status, impact, next steps"
                },
                "stakeholder_update": {
                    "type": "string",
                    "description": "Non-technical executive summary, no jargon, 3-5 sentences"
                }
            }
        }
    }
}
```

#### Slack Emoji Conventions

| Condition | Emoji |
|-----------|-------|
| Active SEV1 / SEV2 | `:rotating_light:` |
| Degraded / investigating | `:warning:` |
| Mitigated / monitoring | `:large_yellow_circle:` |
| Resolved | `:white_check_mark:` |

#### System Instructions

```
You produce incident communications for two audiences.

slack_update rules:
- Use Slack markdown: *bold*, `code`, bullet points with •
- Include emoji appropriate to severity/status (see conventions)
- Be concise — on-call engineers scan this under pressure
- Always include: severity, current status, customer impact summary, top 2 next actions

stakeholder_update rules:
- No technical jargon. No acronyms without expansion.
- 3-5 sentences. Explain business impact in plain language.
- Do not include technical remediation steps.
- Appropriate for C-suite or customer success teams.
```

---

### Agent 4 — PIR Agent

**Responsibility:** Post-incident report with timeline, quantified customer impact, and actionable prevention measures.

| Property | Value |
|----------|-------|
| Name | `pir-agent` |
| LangGraph node | `pir_node` |
| Model | `gemini-2.0-flash` |
| Timeout | 30s |
| Max retries | 3 |

#### Output Schema

```python
PIR_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["post_incident_report"],
    "properties": {
        "post_incident_report": {
            "type": "object",
            "required": ["timeline", "customer_impact", "prevention_actions"],
            "properties": {
                "timeline": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["time", "event"],
                        "properties": {
                            "time": {"type": "string", "description": "HH:MMZ or ISO 8601"},
                            "event": {"type": "string"}
                        }
                    }
                },
                "customer_impact": {
                    "type": "string",
                    "description": "Quantified impact: affected user count, error rate, duration"
                },
                "prevention_actions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["action", "owner_role", "due_within"],
                        "properties": {
                            "action": {"type": "string"},
                            "owner_role": {"type": "string"},
                            "due_within": {
                                "type": "string",
                                "description": "e.g. 48h, 1 week, next sprint"
                            }
                        }
                    }
                }
            }
        }
    }
}
```

#### System Instructions

```
You are writing a post-incident report (PIR) for engineering and leadership review.

Rules:
- timeline: List events in chronological order with precise timestamps from the data.
  Do not interpolate or invent events not present in alerts, logs, or metrics.
- customer_impact: Quantify using numbers from the data (error rate %, user count, revenue impact if stated).
  If unquantifiable, say "Impact unknown — investigation ongoing."
- prevention_actions: Each action must be specific, assignable, and testable.
  Bad: "Improve monitoring."
  Good: "Add PagerDuty alert for CloudSQL CPU > 80% sustained 5m (owner: Platform SRE, due: 48h)."
- Include due_within for every prevention action.
```

---

## LangGraph Implementation

### State Definition

```python
# app/graph.py

from langgraph.graph import StateGraph, END
from langgraph.types import Send
from typing import TypedDict, Optional

class AgentState(TypedDict):
    incident: dict
    triage_output: Optional[dict]
    summary_output: Optional[dict]
    comms_output: Optional[dict]
    pir_output: Optional[dict]
    correlation_id: str
    agent_errors: dict        # per-agent failure tracking
    telemetry: dict
```

### Graph Definition

> **Implementation note:** The entry point is `fan_out`, which dispatches all four agents via the LangGraph `Send` API. There is no separate `invoke_agents` node — `fan_out` is the conditional edge dispatcher registered at `set_conditional_entry_point`.

```python
def create_incident_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Register agent nodes
    graph.add_node("triage", triage_node)
    graph.add_node("summary", summary_node)
    graph.add_node("comms", comms_node)
    graph.add_node("pir", pir_node)
    graph.add_node("merge", merge_node)

    # fan_out dispatches all agents in parallel
    graph.set_conditional_entry_point(
        fan_out,
        {
            "triage": "triage",
            "summary": "summary",
            "comms": "comms",
            "pir": "pir",
        }
    )

    # All agent nodes converge at merge
    for node in ["triage", "summary", "comms", "pir"]:
        graph.add_edge(node, "merge")

    graph.add_edge("merge", END)

    return graph.compile()
```

### Fan-Out Dispatcher

```python
def fan_out(state: AgentState) -> list[Send]:
    """Dispatch all 4 agents in parallel using LangGraph Send API."""
    return [
        Send("triage", state),
        Send("summary", state),
        Send("comms", state),
        Send("pir", state),
    ]
```

### Agent Node Pattern

Each agent node follows this pattern — retries, error capture, and span logging are handled uniformly:

```python
# app/agents/triage.py

import time
from app.graph import AgentState
from app.gemini_client import generate_agent_response, GeminiCallError
from app.schemas import TRIAGE_OUTPUT_SCHEMA, TRIAGE_INSTRUCTIONS
import braintrust

def triage_node(state: AgentState) -> dict:
    span = braintrust.start_span(
        name="triage-agent",
        input={"incident_id": state["incident"].get("incident_id")}
    )
    start = time.monotonic()

    try:
        response = generate_agent_response(
            instructions=TRIAGE_INSTRUCTIONS,
            incident_data=state["incident"],
            output_schema=TRIAGE_OUTPUT_SCHEMA,
        )
        latency_ms = (time.monotonic() - start) * 1000
        span.log(output=response, metrics={"latency_ms": latency_ms})
        span.end()
        return {"triage_output": response}

    except GeminiCallError as e:
        span.log(
            output={"_error": str(e)},
            metrics={"latency_ms": (time.monotonic() - start) * 1000}
        )
        span.end()
        return {
            "triage_output": {},
            "agent_errors": {**state.get("agent_errors", {}), "triage": str(e)}
        }
```

---

## Gemini Configuration

### Model Selection

| Model | Use Case | Notes |
|-------|----------|-------|
| `gemini-2.0-flash` | All four agents (default) | Fast, cost-effective, JSON mode supported |
| `gemini-2.5-flash` | Complex triage fallback | Upgrade path — not default |

### Client Setup

```python
# app/gemini_client.py

import os
import json
import logging
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
)

class GeminiCallError(Exception):
    """Raised when Gemini fails after all retries."""
    pass
```

### Schema-Enforced Generation

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def generate_agent_response(
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    model: str = "gemini-2.0-flash",
) -> dict:
    """
    Call Gemini with JSON schema enforcement.
    Retries up to 3 times with exponential backoff.
    """
    prompt = f"""## Incident Data
```json
{json.dumps(incident_data, indent=2)}
```

Follow your system instructions. Return ONLY valid JSON matching the schema."""

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=instructions,
                response_mime_type="application/json",
                response_schema=output_schema,
                temperature=0.0,          # Deterministic output
                max_output_tokens=4096,
            ),
        )
        return json.loads(response.text)

    except Exception as e:
        logger.error("Gemini call failed: %s", str(e))
        raise GeminiCallError(f"Gemini call failed: {e}") from e
```

### Configuration Reference

| Parameter | Value | Reason |
|-----------|-------|--------|
| `temperature` | `0.0` | Deterministic output; reduces hallucination |
| `response_mime_type` | `"application/json"` | Forces structured output |
| `response_schema` | Per-agent JSON Schema | Schema enforcement at inference time |
| `max_output_tokens` | `4096` | Sufficient for all outputs; prevents runaway generation |

---

## Braintrust Integration

### Why Braintrust

| Purpose | Mechanism |
|---------|-----------|
| **Tracing** | Per-span logging of inputs, outputs, latency, and token counts |
| **Evals** | Automated scoring of agent outputs against golden datasets |
| **Prompt A/B** | Compare experiments on the same golden set |

### Initialization

```python
# app/braintrust_integration.py

import os
import braintrust

braintrust.init(
    project="oncall-copilot",
    api_key=os.environ["BRAINTRUST_API_KEY"],
)
```

### Tracing Pattern

Each agent wraps its Gemini call in a Braintrust span. The `correlation_id` links all four agent spans back to the parent invocation:

```python
import braintrust

def traced_agent_call(
    agent_name: str,
    instructions: str,
    incident_data: dict,
    output_schema: dict,
    correlation_id: str,
) -> dict:
    with braintrust.start_span(
        name=agent_name,
        input={
            "incident_id": incident_data.get("incident_id"),
            "severity": incident_data.get("severity"),
            "correlation_id": correlation_id,
        }
    ) as span:
        result = generate_agent_response(
            instructions=instructions,
            incident_data=incident_data,
            output_schema=output_schema,
        )
        span.log(
            output=result,
            metadata={"correlation_id": correlation_id},
        )
        return result
```

### Eval Setup

```python
# tests/test_evals.py

import braintrust
from braintrust import Eval
from app.agents.triage import triage_node
from app.schemas import TRIAGE_OUTPUT_SCHEMA
import jsonschema, json, os

def load_golden_set(path: str = "scripts/golden_outputs/") -> list[dict]:
    golden = []
    for f in os.listdir(path):
        if f.endswith(".json"):
            with open(os.path.join(path, f)) as fp:
                golden.append(json.load(fp))
    return golden

def schema_valid_scorer(output: dict, expected: dict) -> dict:
    try:
        jsonschema.validate(instance=output, schema=TRIAGE_OUTPUT_SCHEMA)
        return {"name": "schema_valid", "score": 1.0}
    except jsonschema.ValidationError as e:
        return {"name": "schema_valid", "score": 0.0, "metadata": {"error": e.message}}

def root_cause_overlap_scorer(output: dict, expected: dict) -> dict:
    expected_hypotheses = {rc["hypothesis"] for rc in expected.get("suspected_root_causes", [])}
    output_hypotheses = {rc["hypothesis"] for rc in output.get("suspected_root_causes", [])}
    if not expected_hypotheses:
        return {"name": "root_cause_overlap", "score": 1.0}
    overlap = len(expected_hypotheses & output_hypotheses) / len(expected_hypotheses)
    return {"name": "root_cause_overlap", "score": overlap}

Eval(
    project="oncall-copilot",
    experiment="triage-baseline",
    data=load_golden_set(),
    task=lambda example: triage_node({"incident": example["input"], "correlation_id": "eval"}),
    scores=[schema_valid_scorer, root_cause_overlap_scorer],
)
```

### Tracked Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `latency_ms` | float | Agent wall-clock response time |
| `tokens_input` | int | Prompt token count |
| `tokens_output` | int | Completion token count |
| `schema_valid` | bool | Output passes JSON schema validation |
| `root_cause_overlap` | float | Fraction of expected root causes matched |
| `action_count` | int | Number of `immediate_actions` returned |
| `missing_info_count` | int | Number of `missing_information` entries |
| `correlation_id` | string | Links all spans to parent incident |

---

## Output Merge

The `merge_node` assembles the final response. It handles partial failures gracefully — if an agent returned `{}`, its section is empty but the call succeeds.

```python
# app/graph.py

def merge_node(state: AgentState) -> dict:
    triage = state.get("triage_output") or {}
    summary = state.get("summary_output") or {}
    comms = state.get("comms_output") or {}
    pir = state.get("pir_output") or {}
    errors = state.get("agent_errors") or {}

    return {
        "suspected_root_causes": triage.get("suspected_root_causes", []),
        "immediate_actions": triage.get("immediate_actions", []),
        "missing_information": triage.get("missing_information", []),
        "runbook_alignment": triage.get("runbook_alignment", {}),
        "summary": summary.get("summary", {}),
        "comms": comms.get("comms", {}),
        "post_incident_report": pir.get("post_incident_report", {}),
        "telemetry": {
            "correlation_id": state["correlation_id"],
            "model": "gemini-2.0-flash",
            "provider": "google-gemini-api",
            "agent_errors": errors,
        }
    }
```

### Partial Failure Handling

| Condition | Behavior |
|-----------|----------|
| 1–3 agents fail | `200 OK` with partial result; `telemetry.agent_errors` populated |
| All 4 agents fail | `500 Internal Server Error` with full error detail |
| Callers need explicit partial signal | Implement `207 Multi-Status` variant |

---

## Error Handling & Resilience

### Retry Strategy

All Gemini calls use `tenacity` with exponential backoff:

| Attempt | Wait |
|---------|------|
| 1 | Immediate |
| 2 | 2s |
| 3 | 4s |
| (fail) | Raise `GeminiCallError` |

### Timeout Configuration

```python
AGENT_TIMEOUTS = {
    "triage": 30,   # seconds
    "summary": 20,
    "comms": 20,
    "pir": 30,
}
```

### Failure Matrix

| Failure Type | Behavior |
|--------------|----------|
| Gemini API unavailable | Retry 3× → agent returns `{}` with `_error` |
| JSON schema violation | Retry with stricter prompt → if still invalid, return `{}` with `_error` |
| Timeout exceeded | Agent returns `{}` with `_error: "timeout"` |
| Input validation failure | `422 Unprocessable Entity` before graph invocation |
| All 4 agents fail | `500 Internal Server Error` with `telemetry.agent_errors` |

### Circuit Breaker (Optional)

For high-volume deployments, wrap `generate_agent_response` with a circuit breaker to fast-fail during Gemini API degradation:

```python
from pybreaker import CircuitBreaker

gemini_breaker = CircuitBreaker(fail_max=5, reset_timeout=60)

@gemini_breaker
def generate_agent_response(...):
    ...
```

---

## Security & Secret Redaction

**Secrets are redacted before the incident payload reaches any LLM call.** Redaction runs synchronously in the FastAPI handler before graph invocation.

### Redaction Pipeline

```python
# app/telemetry.py

import re
from typing import Any

SECRET_PATTERNS = [
    r'(?i)(api[_-]?key|token|secret|password|passwd|credential)["\s:=]+["\']?([A-Za-z0-9+/=_\-\.]{8,})["\']?',
    r'AKIA[0-9A-Z]{16}',                           # AWS access key IDs
    r'"private_key":\s*"-----BEGIN[^"]*"',          # GCP service account keys
    r'Bearer\s+[A-Za-z0-9\-_\.]+',                 # Bearer tokens
    r'(?i)(mongodb|postgres|mysql|redis):\/\/[^\s"\']+',  # Connection strings
]

def redact_secrets(payload: Any, depth: int = 0) -> Any:
    """Recursively redact secrets from incident payload."""
    if depth > 10:
        return payload

    if isinstance(payload, str):
        result = payload
        for pattern in SECRET_PATTERNS:
            result = re.sub(pattern, lambda m: m.group(0)[:4] + "[REDACTED]", result)
        return result

    if isinstance(payload, dict):
        return {k: redact_secrets(v, depth + 1) for k, v in payload.items()}

    if isinstance(payload, list):
        return [redact_secrets(item, depth + 1) for item in payload]

    return payload
```

### Security Checklist

| Control | Status |
|---------|--------|
| Secrets redacted before LLM call | Required |
| `BRAINTRUST_API_KEY` via Secret Manager | Required |
| `GOOGLE_APPLICATION_CREDENTIALS` via Workload Identity (production) | Recommended |
| Non-root container user | Required |
| No customer data logged to Braintrust (only `incident_id`, `severity`) | Required |
| HTTPS only on Cloud Run | Enforced by platform |

---

## REST API

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/invoke` | Process incident through all 4 agents |
| `GET` | `/health` | Liveness check |
| `GET` | `/ready` | Readiness check (verifies Gemini reachability) |

### FastAPI Implementation

```python
# app/main.py

import uuid
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from app.graph import create_incident_graph
from app.schemas import INCIDENT_INPUT_SCHEMA
from app.telemetry import redact_secrets
import braintrust
import jsonschema

logger = logging.getLogger(__name__)
app = FastAPI(title="On-Call Copilot — LangGraph + Gemini", version="2.0.0")
graph = create_incident_graph()

@app.post("/invoke")
async def invoke_incident(request: Request) -> JSONResponse:
    incident = await request.json()

    # 1. Validate input
    try:
        jsonschema.validate(instance=incident, schema=INCIDENT_INPUT_SCHEMA)
    except jsonschema.ValidationError as e:
        raise HTTPException(status_code=422, detail=e.message)

    # 2. Redact secrets before any LLM call
    incident = redact_secrets(incident)

    # 3. Generate correlation ID
    correlation_id = str(uuid.uuid4())
    logger.info("Processing incident", extra={
        "incident_id": incident.get("incident_id"),
        "correlation_id": correlation_id,
        "severity": incident.get("severity"),
    })

    # 4. Invoke graph
    initial_state = {
        "incident": incident,
        "triage_output": None,
        "summary_output": None,
        "comms_output": None,
        "pir_output": None,
        "correlation_id": correlation_id,
        "agent_errors": {},
        "telemetry": {},
    }

    result = await graph.ainvoke(initial_state)

    # 5. Surface total failure
    agent_errors = result.get("telemetry", {}).get("agent_errors", {})
    if len(agent_errors) == 4:
        raise HTTPException(status_code=500, detail={
            "message": "All agents failed",
            "errors": agent_errors
        })

    return JSONResponse(content=result, status_code=200)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ready")
async def ready():
    try:
        from app.gemini_client import client
        client.models.list()
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
```

### Response Envelope

```json
{
  "suspected_root_causes": [
    {
      "hypothesis": "CloudSQL CPU saturation causing connection pool exhaustion",
      "evidence": ["CPU alert fired at 14:03Z: 94%", "ERROR: too many connections in service logs"],
      "confidence": 0.87
    }
  ],
  "immediate_actions": [
    {
      "step": "Scale CloudSQL instance from db-n1-standard-4 to db-n1-standard-8",
      "owner_role": "Platform SRE",
      "priority": "P0"
    }
  ],
  "missing_information": [],
  "runbook_alignment": {
    "matched_steps": ["Scale database instance", "Check connection pool settings"],
    "gaps": ["No runbook step for read replica failover"]
  },
  "summary": {
    "what_happened": "CloudSQL CPU reached 94% at 14:03Z, causing connection pool exhaustion...",
    "current_status": "ONGOING: Database CPU remains at 89%, mitigation in progress"
  },
  "comms": {
    "slack_update": ":rotating_light: *[SEV2] Database CPU Saturation*\n...",
    "stakeholder_update": "Our database service is experiencing high load affecting checkout..."
  },
  "post_incident_report": {
    "timeline": [
      {"time": "14:03Z", "event": "CloudSQL CPU alert fired at 94%"},
      {"time": "14:07Z", "event": "On-call engineer paged"}
    ],
    "customer_impact": "Estimated 12% of checkout requests failing, ~4,200 affected users",
    "prevention_actions": [
      {
        "action": "Add PagerDuty alert for CloudSQL CPU > 80% sustained 5m",
        "owner_role": "Platform SRE",
        "due_within": "48h"
      }
    ]
  },
  "telemetry": {
    "correlation_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "model": "gemini-2.0-flash",
    "provider": "google-gemini-api",
    "agent_errors": {}
  }
}
```

---

## Observability & Monitoring

### Structured Logging

Use `structlog` for JSON-formatted logs. Include `correlation_id` and `incident_id` in every record.

```python
import structlog
logger = structlog.get_logger()
logger.info("agent_complete", agent="triage", latency_ms=423, correlation_id=cid)
```

### Key Log Events

| Event | Level | Fields |
|-------|-------|--------|
| `incident_received` | INFO | `incident_id`, `severity`, `correlation_id` |
| `agent_start` | INFO | `agent`, `correlation_id` |
| `agent_complete` | INFO | `agent`, `latency_ms`, `correlation_id` |
| `agent_failed` | ERROR | `agent`, `error`, `attempt`, `correlation_id` |
| `merge_complete` | INFO | `correlation_id`, `agent_errors_count` |
| `secret_redacted` | WARN | `pattern_matched`, `incident_id` |

### Alerting Thresholds

| Alert | Threshold |
|-------|-----------|
| Agent failure rate | > 5% over 5 min |
| P95 end-to-end latency | > 10s |
| All-agents-failed rate | > 1% |
| Gemini 429 rate | > 10/min |

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GCP_PROJECT` | ✅ | Google Cloud project ID | `oncall-prod-123` |
| `GCP_LOCATION` | ✅ | GCP region | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | Path to service account JSON | `/secrets/gcp-creds.json` |
| `BRAINTRUST_API_KEY` | ✅ | Braintrust API key | `btp_...` |
| `LOG_LEVEL` | ❌ | Logging verbosity | `INFO` |
| `MOCK_MODE` | ❌ | Skip Gemini calls; use fixture responses | `false` |
| `GEMINI_MODEL` | ❌ | Override default model | `gemini-2.0-flash` |
| `AGENT_TIMEOUT_SECONDS` | ❌ | Global agent timeout override | `30` |
| `CIRCUIT_BREAKER_ENABLED` | ❌ | Enable Gemini circuit breaker | `false` |

---

## Local Development

### Prerequisites

- Python 3.11+
- `gcloud` CLI authenticated: `gcloud auth application-default login`
- Braintrust API key in `.env`

### Setup

```bash
git clone https://github.com/your-org/oncall-copilot-langgraph
cd oncall-copilot-langgraph

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with GCP_PROJECT, BRAINTRUST_API_KEY

uvicorn app.main:app --reload --port 8080
```

### Mock Mode

`MOCK_MODE=true` skips all Gemini calls and returns fixture responses from `scripts/fixtures/`. Useful for schema validation and CI without GCP credentials:

```bash
MOCK_MODE=true uvicorn app.main:app --reload
```

---

## Testing Strategy

### Test Commands

| Command | Description |
|---------|-------------|
| `python scripts/invoke.py --demo 1` | Single demo against live Gemini |
| `python scripts/run_scenarios.py` | All 5 test scenarios |
| `MOCK_MODE=true python scripts/validate.py` | Schema validation only (no LLM calls) |
| `pytest tests/ -v` | Full unit test suite |
| `INTEGRATION=true pytest tests/test_integration.py` | Live Gemini integration tests |
| `braintrust eval tests/test_evals.py` | Evals against golden set |

### Unit Test Coverage

| Test | Description |
|------|-------------|
| `test_triage_schema_valid` | Triage output passes JSON schema |
| `test_secret_redaction` | Secrets stripped before LLM call |
| `test_merge_partial_failure` | `merge_node` handles agent `{}` gracefully |
| `test_graph_parallel` | All 4 nodes invoked simultaneously |
| `test_constraint_respected` | `no_rollback: true` excludes rollback actions |
| `test_sparse_incident` | Low-signal incident → `confidence: 0.0` + `missing_information` populated |

### Golden Output Format

Each file in `scripts/golden_outputs/` follows this shape:

```json
{
  "input": { },
  "expected": {
    "suspected_root_causes": [],
    "immediate_actions": []
  },
  "metadata": {
    "scenario": "database-cpu-spike",
    "severity": "SEV2",
    "created_by": "platform-sre-team",
    "created_at": "2024-09-15"
  }
}
```

---

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY scripts/ ./scripts/

# Non-root user
RUN useradd -m -u 1000 appuser
USER appuser

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### GCP Cloud Run

```bash
gcloud run deploy oncall-copilot \
  --source . \
  --region us-central1 \
  --platform managed \
  --min-instances 1 \
  --max-instances 20 \
  --concurrency 10 \
  --memory 1Gi \
  --cpu 2 \
  --timeout 120s \
  --set-env-vars="GCP_PROJECT=${GCP_PROJECT},GCP_LOCATION=us-central1" \
  --set-secrets="BRAINTRUST_API_KEY=braintrust-api-key:latest"
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: MOCK_MODE=true pytest tests/ -v

  eval:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: braintrust eval tests/test_evals.py
    env:
      BRAINTRUST_API_KEY: ${{ secrets.BRAINTRUST_API_KEY }}

  deploy:
    needs: [test, eval]
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: oncall-copilot
          region: us-central1
          source: .
```

---

## Cost Estimation

Gemini 2.0 Flash pricing (verify at cloud.google.com/vertex-ai/pricing):

| Component | Rate |
|-----------|------|
| Input tokens | ~$0.075 / 1M tokens |
| Output tokens | ~$0.30 / 1M tokens |

**Per incident call (4 agents × ~2,000 input + ~500 output tokens each):**

| Item | Tokens | Estimated Cost |
|------|--------|---------------|
| Input (4 agents) | ~8,000 | ~$0.0006 |
| Output (4 agents) | ~2,000 | ~$0.0006 |
| **Total per call** | ~10,000 | **~$0.0012** |

At 10,000 incidents/month: ~$12/month in LLM costs. Cloud Run compute is additive but negligible for short-lived async invocations.

---

## Migration from Original

| Original Component | New Component | Notes |
|-------------------|----------------|-------|
| `ConcurrentBuilder` | `LangGraph StateGraph` + `Send` API | Fan-out semantics preserved |
| `AzureOpenAIChatClient` | `google.genai.Client` (Vertex AI) | Auth via ADC |
| Model Router | `GEMINI_MODEL` env var + default | No router needed |
| OpenTelemetry spans | Braintrust spans | Richer LLM-specific eval data |
| `agent.yaml` | `langserve.yaml` (optional) | LangServe serves the compiled graph |
| Microsoft Foundry | GCP Cloud Run | Serverless, equivalent scaling |
| `DefaultAzureCredential` | `GOOGLE_APPLICATION_CREDENTIALS` / Workload Identity | GCP-native |

---

## File Structure

```
oncall-copilot-langgraph/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI entry point
│   ├── graph.py                      # LangGraph StateGraph, fan_out, merge_node
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── triage.py                 # triage_node + TRIAGE_INSTRUCTIONS
│   │   ├── summary.py                # summary_node + SUMMARY_INSTRUCTIONS
│   │   ├── comms.py                  # comms_node + COMMS_INSTRUCTIONS
│   │   └── pir.py                    # pir_node + PIR_INSTRUCTIONS
│   ├── schemas.py                    # Input + per-agent output JSON schemas
│   ├── gemini_client.py              # Gemini wrapper: schema enforcement + retry
│   ├── braintrust_integration.py     # Braintrust init + traced_agent_call
│   └── telemetry.py                  # redact_secrets, structlog, correlation IDs
├── scripts/
│   ├── invoke.py                     # CLI: single incident test
│   ├── run_scenarios.py              # Run all 5 test scenarios
│   ├── validate.py                   # Schema validation (MOCK_MODE)
│   ├── fixtures/                     # Mock agent responses for MOCK_MODE
│   ├── golden_outputs/               # Human-verified input/output pairs for evals
│   └── scenarios/
│       ├── sev1_database_outage.json
│       ├── sev2_latency_spike.json
│       ├── sev2_memory_leak.json
│       ├── sev3_sporadic_errors.json
│       └── sev4_noisy_alert.json
├── tests/
│   ├── test_agents.py
│   ├── test_redaction.py
│   ├── test_schemas.py
│   ├── test_graph.py
│   ├── test_integration.py           # Requires GCP credentials
│   └── test_evals.py                 # Braintrust eval definitions
├── .env.example
├── requirements.txt
├── Dockerfile
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Parallel execution** | LangGraph `Send` API dispatches all 4 agents simultaneously |
| **JSON-only output** | Gemini `response_mime_type="application/json"` + `response_schema` |
| **Deterministic output** | `temperature=0.0` on all agent calls |
| **Graceful degradation** | Per-agent error capture; partial results returned rather than hard failure |
| **No hardcoded models** | `GEMINI_MODEL` env var; `gemini-2.0-flash` default with clear upgrade path |
| **Separation of concerns** | Each agent owns distinct output keys; no cross-agent state dependency |
| **Instructions as config** | Agent behavior defined in `*_INSTRUCTIONS` strings, versioned in Git |
| **No hallucination** | `confidence: 0.0` + `missing_information` when data is insufficient |
| **Secret safety** | Redaction runs before graph invocation — LLM never sees raw secrets |
| **Observability** | Braintrust spans + structlog JSON logs + `correlation_id` threaded throughout |
| **Testability** | `MOCK_MODE` enables full test runs without GCP credentials |
| **Cost awareness** | Token budgets via `max_output_tokens`; cost per call is ~$0.001 |
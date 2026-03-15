# Data Model: On-Call Copilot

## Agent State (LangGraph `AgentState`)
Defines the shared state throughout the execution graph.

| Field | Type | Description |
|-------|------|-------------|
| `incident` | `dict` | The incident data (alerts, logs, etc.) |
| `triage_output` | `Optional[dict]` | Captured results from Triage Agent |
| `summary_output` | `Optional[dict]` | Captured results from Summary Agent |
| `comms_output` | `Optional[dict]` | Captured results from Comms Agent |
| `pir_output` | `Optional[dict]` | Captured results from PIR Agent |
| `correlation_id` | `str` | UUID for tracing |
| `agent_errors` | `dict` | Map of `agent_name -> error_message` |
| `telemetry` | `dict` | Execution metadata |

## Schemas

### Input: Incident (INCIDENT_INPUT_SCHEMA)
```json
{
  "incident_id": "string (required)",
  "title": "string (required)",
  "severity": "SEV1 | SEV2 | SEV3 | SEV4 (required)",
  "timeframe": { "start": "iso8601", "end": "iso8601" },
  "alerts": "array of alert objects",
  "logs": "array of log objects",
  "metrics": "array of metric objects",
  "runbook_excerpt": "string",
  "constraints": { "no_rollback": "boolean", "change_freeze": "boolean" }
}
```

### Output: Triage (TRIAGE_OUTPUT_SCHEMA)
```json
{
  "suspected_root_causes": [ { "hypothesis": "str", "evidence": ["str"], "confidence": 0-1 } ],
  "immediate_actions": [ { "step": "str", "owner_role": "str", "priority": "P0-P3" } ],
  "missing_information": [ { "question": "str", "why_it_matters": "str" } ],
  "runbook_alignment": { "matched_steps": ["str"], "gaps": ["str"] }
}
```

### Output: PIR (PIR_OUTPUT_SCHEMA)
```json
{
  "post_incident_report": {
    "timeline": [ { "time": "str", "event": "str" } ],
    "customer_impact": "str",
    "prevention_actions": [ { "action": "str", "owner_role": "str", "due_within": "str" } ]
  }
}
```

# REST API Contract: On-Call Copilot

## POST /invoke
Analyzes an incident and returns a multi-agent report.

### Input Specification
Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `incident_id` | `str` | Yes | Unique incident identifier |
| `title` | `str` | Yes | Summary title of the outage |
| `severity` | `str` | Yes | SEV1, SEV2, SEV3, or SEV4 |
| `timeframe` | `dict` | Yes | Contains `start` and optional `end` as ISO8601 strings |
| `alerts` | `list` | No | List of triggered alerts |
| `logs` | `list` | No | Log entries relevant to the incident |
| `metrics` | `list` | No | Time-series metrics data |
| `runbook_excerpt` | `str` | No | Excerpt from the operations runbook |
| `constraints` | `dict` | No | e.g., `no_rollback: true` |

### Output Specification
HTTP Status: `200 OK` (Partial results possible)
HTTP Status: `500 Internal Error` (All agents failed)

```json
{
  "suspected_root_causes": [],
  "immediate_actions": [],
  "missing_information": [],
  "runbook_alignment": {},
  "summary": {},
  "comms": {},
  "post_incident_report": {},
  "telemetry": {
    "correlation_id": "uuid",
    "agent_errors": {}
  }
}
```

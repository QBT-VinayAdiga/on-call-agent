# app/mock_data.py

def get_mock_response(output_schema: dict) -> dict:
    """Returns a mock response matching the provided schema."""
    if "suspected_root_causes" in output_schema.get("properties", {}):
        # Triage Mock
        return {
            "suspected_root_causes": [
                {"hypothesis": "Database connection pool exhaustion", "evidence": ["Logs show 'Too many connections'"], "confidence": 0.9},
                {"hypothesis": "High CPU on API nodes", "evidence": ["CPU metrics at 95%"], "confidence": 0.7}
            ],
            "immediate_actions": [
                {"step": "Increase connection pool size", "owner_role": "DBA", "priority": "P0"},
                {"step": "Scale out API nodes", "owner_role": "SRE", "priority": "P1"}
            ],
            "missing_information": [
                {"question": "Are read replicas affected?", "why_it_matters": "Helps isolate the issue to the primary DB"}
            ],
            "runbook_alignment": {
                "matched_steps": ["Check DB connections"],
                "gaps": ["No automated scaling for DB connections"]
            }
        }
    elif "summary" in output_schema.get("properties", {}):
        # Summary Mock
        return {
            "summary": {
                "what_happened": "A sudden spike in traffic led to database connection pool exhaustion, causing API errors for 15% of users.",
                "current_status": "MITIGATED: Connection pool size increased, traffic stabilizing."
            }
        }
    elif "comms" in output_schema.get("properties", {}):
        # Comms Mock
        return {
            "comms": {
                "slack_update": ":rotating_light: *[SEV2] DB Connection Issues*\n• *Status*: MITIGATED\n• *Impact*: 15% error rate\n• *Next*: Monitor traffic.",
                "stakeholder_update": "We are experiencing a service degradation due to high database load. Our engineers have applied a fix and are monitoring the recovery."
            }
        }
    elif "post_incident_report" in output_schema.get("properties", {}):
        # PIR Mock
        return {
            "post_incident_report": {
                "timeline": [
                    {"time": "10:00Z", "event": "Traffic spike detected"},
                    {"time": "10:05Z", "event": "DB alert fired"},
                    {"time": "10:15Z", "event": "Pool size increased"}
                ],
                "customer_impact": "15% of users experienced 5xx errors for 20 minutes.",
                "prevention_actions": [
                    {"action": "Implement auto-scaling for DB pool", "owner_role": "DBA", "due_within": "1 week"}
                ]
            }
        }
    elif "incident_id" in output_schema.get("required", []):
        # Input Structure Mock
        return {
            "incident_id": "INC-MOCK-001",
            "title": "Mock Incident from Raw Input",
            "severity": "SEV2",
            "timeframe": {"start": "2026-03-15T10:00:00Z"},
            "alerts": [{"name": "CPU_HIGH", "value": "95%", "threshold": "80%", "fired_at": "2026-03-15T10:00:00Z"}],
            "logs": [{"timestamp": "2026-03-15T10:00:05Z", "level": "ERROR", "message": "Connection refused", "service": "api"}],
            "metrics": [{"name": "db_connections", "value": 100, "unit": "count", "timestamp": "2026-03-15T10:00:00Z"}]
        }
    
    return {}

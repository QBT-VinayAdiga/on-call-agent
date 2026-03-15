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
            "type": ["string", "null"],
            "description": "Relevant runbook section, if available"
        },
        "constraints": {
            "type": ["object", "null"],
            "properties": {
                "no_rollback": {"type": "boolean"},
                "change_freeze": {"type": "boolean"},
                "affected_regions": {"type": "array", "items": {"type": "string"}}
            }
        },
    },
}

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

TRIAGE_INSTRUCTIONS = """
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
"""

SUMMARY_INSTRUCTIONS = """
You are an SRE technical writer. Given the incident data, write a clear, factual incident summary.

Rules:
- what_happened: 2-4 sentences only. Be specific. Cite actual values (error rates, latency numbers).
- current_status: Start with exactly one of ONGOING | MITIGATED | MONITORING | RESOLVED,
  then a colon, then a brief explanation.
- No speculation, no jargon the SRE on-call wouldn't know.
- Use past tense for events that have concluded; present tense for ongoing conditions.
"""

COMMS_INSTRUCTIONS = """
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
"""

PIR_INSTRUCTIONS = """
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
"""

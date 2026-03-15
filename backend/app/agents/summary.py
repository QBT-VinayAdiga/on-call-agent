# app/agents/summary.py

import time
import braintrust
from app.graph import AgentState
from app.gemini_client import generate_agent_response, GeminiCallError
from app.schemas import SUMMARY_OUTPUT_SCHEMA, SUMMARY_INSTRUCTIONS

def summary_node(state: AgentState) -> dict:
    """
    Summary Agent: Produces a concise factual summary of the incident.
    """
    span = braintrust.start_span(
        name="summary-agent",
        input={"incident_id": state["incident"].get("incident_id")}
    )
    start = time.monotonic()

    try:
        response = generate_agent_response(
            instructions=SUMMARY_INSTRUCTIONS,
            incident_data=state["incident"],
            output_schema=SUMMARY_OUTPUT_SCHEMA,
        )
        latency_ms = (time.monotonic() - start) * 1000
        span.log(output=response, metrics={"latency_ms": latency_ms})
        span.end()
        return {"summary_output": response}

    except GeminiCallError as e:
        latency_ms = (time.monotonic() - start) * 1000
        span.log(
            output={"_error": str(e)},
            metrics={"latency_ms": latency_ms},
            status="error"
        )
        span.end()
        return {
            "summary_output": {},
            "agent_errors": {"summary": str(e)}
        }
    except Exception as e:
        span.log(output={"_error": str(e)}, status="error")
        span.end()
        return {
            "summary_output": {},
            "agent_errors": {"summary": str(e)}
        }

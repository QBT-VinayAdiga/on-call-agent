# app/agents/pir.py

import time
import braintrust
from app.graph import AgentState
from app.gemini_client import generate_agent_response, GeminiCallError
from app.schemas import PIR_OUTPUT_SCHEMA, PIR_INSTRUCTIONS

def pir_node(state: AgentState) -> dict:
    """
    PIR Agent: Generates a post-incident report with timeline and prevention actions.
    """
    span = braintrust.start_span(
        name="pir-agent",
        input={"incident_id": state["incident"].get("incident_id")}
    )
    start = time.monotonic()

    try:
        response = generate_agent_response(
            instructions=PIR_INSTRUCTIONS,
            incident_data=state["incident"],
            output_schema=PIR_OUTPUT_SCHEMA,
        )
        latency_ms = (time.monotonic() - start) * 1000
        span.log(output=response, metrics={"latency_ms": latency_ms})
        span.end()
        return {"pir_output": response}

    except GeminiCallError as e:
        latency_ms = (time.monotonic() - start) * 1000
        span.log(
            output={"_error": str(e)},
            metrics={"latency_ms": latency_ms},
            status="error"
        )
        span.end()
        return {
            "pir_output": {},
            "agent_errors": {"pir": str(e)}
        }
    except Exception as e:
        span.log(output={"_error": str(e)}, status="error")
        span.end()
        return {
            "pir_output": {},
            "agent_errors": {"pir": str(e)}
        }

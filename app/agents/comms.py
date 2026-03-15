# app/agents/comms.py

import time
import braintrust
from app.graph import AgentState
from app.gemini_client import generate_agent_response, GeminiCallError
from app.schemas import COMMS_OUTPUT_SCHEMA, COMMS_INSTRUCTIONS

def comms_node(state: AgentState) -> dict:
    """
    Comms Agent: Generates audience-appropriate communications.
    """
    span = braintrust.start_span(
        name="comms-agent",
        input={"incident_id": state["incident"].get("incident_id")}
    )
    start = time.monotonic()

    try:
        response = generate_agent_response(
            instructions=COMMS_INSTRUCTIONS,
            incident_data=state["incident"],
            output_schema=COMMS_OUTPUT_SCHEMA,
        )
        latency_ms = (time.monotonic() - start) * 1000
        span.log(output=response, metrics={"latency_ms": latency_ms})
        span.end()
        return {"comms_output": response}

    except GeminiCallError as e:
        latency_ms = (time.monotonic() - start) * 1000
        span.log(
            output={"_error": str(e)},
            metrics={"latency_ms": latency_ms},
            status="error"
        )
        span.end()
        return {
            "comms_output": {},
            "agent_errors": {"comms": str(e)}
        }
    except Exception as e:
        span.log(output={"_error": str(e)}, status="error")
        span.end()
        return {
            "comms_output": {},
            "agent_errors": {"comms": str(e)}
        }

# app/agents/triage.py

import time
import braintrust
from app.graph import AgentState
from app.llm_client import generate_agent_response, LLMCallError
from app.schemas import TRIAGE_OUTPUT_SCHEMA, TRIAGE_INSTRUCTIONS

def triage_node(state: AgentState) -> dict:
    """
    Triage Agent: Analyzes incident data for root causes and remediation.
    """
    span = braintrust.start_span(
        name="triage-agent",
        input={"incident_id": state["incident"].get("incident_id")}
    )
    start = time.monotonic()

    try:
        provider = state.get("telemetry", {}).get("provider_override", "gemini")
        response = generate_agent_response(
            instructions=TRIAGE_INSTRUCTIONS,
            incident_data=state["incident"],
            output_schema=TRIAGE_OUTPUT_SCHEMA,
            provider=provider
        )
        latency_ms = (time.monotonic() - start) * 1000
        span.log(output=response, metrics={"latency_ms": latency_ms})
        span.end()
        return {"triage_output": response}

    except LLMCallError as e:
        latency_ms = (time.monotonic() - start) * 1000
        span.log(
            output={"_error": str(e)},
            metrics={"latency_ms": latency_ms},
            status="error"
        )
        span.end()
        # Return empty output but capture error in state
        return {
            "triage_output": {},
            "agent_errors": {"triage": str(e)}
        }
    except Exception as e:
        span.log(output={"_error": str(e)}, status="error")
        span.end()
        return {
            "triage_output": {},
            "agent_errors": {"triage": str(e)}
        }

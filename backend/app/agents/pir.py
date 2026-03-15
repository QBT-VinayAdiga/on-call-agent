# app/agents/pir.py

from app.graph import AgentState
from app.llm_client import generate_agent_response
from app.braintrust_integration import trace_agent_node
from app.schemas import PIR_OUTPUT_SCHEMA, PIR_INSTRUCTIONS

@trace_agent_node(name="pir-agent", output_key="pir_output")
def pir_node(state: AgentState) -> dict:
    """
    PIR Agent: Generates a post-incident report with timeline and prevention actions.
    """
    provider = state.get("telemetry", {}).get("provider_override", "openrouter")
    return generate_agent_response(
        instructions=PIR_INSTRUCTIONS,
        incident_data=state["incident"],
        output_schema=PIR_OUTPUT_SCHEMA,
        provider=provider
    )

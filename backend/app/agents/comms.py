# app/agents/comms.py

from app.graph import AgentState
from app.llm_client import generate_agent_response
from app.braintrust_integration import trace_agent_node
from app.schemas import COMMS_OUTPUT_SCHEMA, COMMS_INSTRUCTIONS

@trace_agent_node(name="comms-agent", output_key="comms_output")
def comms_node(state: AgentState) -> dict:
    """
    Comms Agent: Generates audience-appropriate communications.
    """
    provider = state.get("telemetry", {}).get("provider_override", "openrouter")
    return generate_agent_response(
        instructions=COMMS_INSTRUCTIONS,
        incident_data=state["incident"],
        output_schema=COMMS_OUTPUT_SCHEMA,
        provider=provider
    )

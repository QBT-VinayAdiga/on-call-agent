# app/agents/triage.py

from app.graph import AgentState
from app.llm_client import generate_agent_response
from app.braintrust_integration import trace_agent_node
from app.schemas import TRIAGE_OUTPUT_SCHEMA, TRIAGE_INSTRUCTIONS

@trace_agent_node(name="triage-agent", output_key="triage_output")
def triage_node(state: AgentState) -> dict:
    """
    Triage Agent: Analyzes incident data for root causes and remediation.
    """
    provider = state.get("telemetry", {}).get("provider_override", "openrouter")
    return generate_agent_response(
        instructions=TRIAGE_INSTRUCTIONS,
        incident_data=state["incident"],
        output_schema=TRIAGE_OUTPUT_SCHEMA,
        provider=provider
    )

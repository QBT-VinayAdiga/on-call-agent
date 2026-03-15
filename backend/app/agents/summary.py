# app/agents/summary.py

from app.graph import AgentState
from app.llm_client import generate_agent_response
from app.braintrust_integration import trace_agent_node
from app.schemas import SUMMARY_OUTPUT_SCHEMA, SUMMARY_INSTRUCTIONS

@trace_agent_node(name="summary-agent", output_key="summary_output")
def summary_node(state: AgentState) -> dict:
    """
    Summary Agent: Produces a concise factual summary of the incident.
    """
    provider = state.get("telemetry", {}).get("provider_override", "openrouter")
    return generate_agent_response(
        instructions=SUMMARY_INSTRUCTIONS,
        incident_data=state["incident"],
        output_schema=SUMMARY_OUTPUT_SCHEMA,
        provider=provider
    )

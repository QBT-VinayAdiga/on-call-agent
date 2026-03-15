# app/graph.py

from langgraph.graph import StateGraph, END
from langgraph.types import Send
from typing import TypedDict, Optional, Annotated
import operator

class AgentState(TypedDict):
    incident: dict
    triage_output: Optional[dict]
    summary_output: Optional[dict]
    comms_output: Optional[dict]
    pir_output: Optional[dict]
    correlation_id: str
    agent_errors: Annotated[dict, operator.ior]  # Merge dictionaries
    telemetry: dict

def fan_out(state: AgentState) -> list[Send]:
    """Dispatch all 4 agents in parallel using LangGraph Send API."""
    return [
        Send("triage", state),
        Send("summary", state),
        Send("comms", state),
        Send("pir", state),
    ]

def merge_node(state: AgentState) -> dict:
    """Consolidate agent outputs into a unified response."""
    triage = state.get("triage_output") or {}
    summary = state.get("summary_output") or {}
    comms = state.get("comms_output") or {}
    pir = state.get("pir_output") or {}
    errors = state.get("agent_errors") or {}

    return {
        "suspected_root_causes": triage.get("suspected_root_causes", []),
        "immediate_actions": triage.get("immediate_actions", []),
        "missing_information": triage.get("missing_information", []),
        "runbook_alignment": triage.get("runbook_alignment", {}),
        "summary": summary.get("summary", {}),
        "comms": comms.get("comms", {}),
        "post_incident_report": pir.get("post_incident_report", {}),
        "telemetry": {
            "correlation_id": state["correlation_id"],
            "model": "gemini-2.0-flash",
            "provider": "google-gemini-api",
            "agent_errors": errors,
        }
    }

# Agent node imports are handled inside create_incident_graph to avoid circular imports

def create_incident_graph() -> StateGraph:
    """Compile the incident analysis graph."""
    # Note: Using placeholders for nodes; actual nodes will be imported in Phase 3-5
    from app.agents.triage import triage_node
    from app.agents.summary import summary_node
    from app.agents.comms import comms_node
    from app.agents.pir import pir_node

    workflow = StateGraph(AgentState)

    # Register nodes
    workflow.add_node("triage", triage_node)
    workflow.add_node("summary", summary_node)
    workflow.add_node("comms", comms_node)
    workflow.add_node("pir", pir_node)
    workflow.add_node("merge", merge_node)

    # Parallel dispatch from entry point
    workflow.set_conditional_entry_point(
        fan_out,
        {
            "triage": "triage",
            "summary": "summary",
            "comms": "comms",
            "pir": "pir",
        }
    )

    # Converge at merge
    workflow.add_edge("triage", "merge")
    workflow.add_edge("summary", "merge")
    workflow.add_edge("comms", "merge")
    workflow.add_edge("pir", "merge")
    
    workflow.add_edge("merge", END)

    return workflow.compile()
